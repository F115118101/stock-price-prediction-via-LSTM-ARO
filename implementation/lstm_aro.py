# %% [markdown]
# # LSTM-ARO：以人工兔子最佳化演算法優化深層 LSTM 的股價預測
#
# 實作 Gülmez (2023), *Expert Systems With Applications* 227, 120346。
# 方法整理見 `paper_method.md`。
#
# 比較模型：ANN、LSTM1D、LSTM2D、LSTM3D、LSTM-GA、LSTM-ARO
#
# 用法（本機）：
# ```
# python lstm_aro.py --tickers 2330.TW --pop 10 --iters 10
# python lstm_aro.py --csv my_data.csv --price-col Close
# python lstm_aro.py --tickers 2330.TW --pop 50 --iters 50 --fitness-on test   # 完全照論文
# ```

# %%
import argparse
import json
import math
import os
import random
import time
from dataclasses import asdict, dataclass, field
from typing import Callable, Dict, List, Optional

import numpy as np
import pandas as pd

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
import tensorflow as tf  # noqa: E402
from tensorflow import keras  # noqa: E402

from sklearn.metrics import (  # noqa: E402
    mean_absolute_error,
    mean_absolute_percentage_error,
    mean_squared_error,
    r2_score,
)
from sklearn.preprocessing import MinMaxScaler  # noqa: E402

ALL_MODELS = ["NAIVE", "ANN", "LSTM1D", "LSTM2D", "LSTM3D", "LSTM-GA", "LSTM-ARO"]


# %% [markdown]
# ## 1. 設定

# %%
@dataclass
class Config:
    # --- 資料 ---
    tickers: List[str] = field(default_factory=lambda: ["2330.TW"])
    csv_path: Optional[str] = None      # 指定時改讀 CSV（需有日期欄與價格欄）
    start: str = "2018-01-01"
    end: str = "2023-01-01"
    price_col: str = "Close"
    window: int = 20                    # 論文：前 20 天預測隔天
    train_ratio: float = 0.8            # 論文：80% train / 20% test
    # --- 超參數搜尋 ---
    val_ratio: float = 0.2              # 從訓練集尾端切出的驗證集比例（fitness 用）
    fitness_on: str = "val"             # "val"（建議）或 "test"（照論文流程，有資料洩漏）
    pop_size: int = 10                  # 論文 50
    iterations: int = 10                # 論文 50
    # --- 訓練 ---
    epochs: int = 50
    batch_size: int = 32
    patience: int = 10
    # --- 回測（台股成本）---
    fee_rate: float = 0.001425          # 手續費，買賣各收一次（未含折扣）
    tax_rate: float = 0.003             # 證交稅，賣出時收
    trade_threshold: float = 0.0        # 預測漲幅 > 此值才持有
    # --- 其他 ---
    models: List[str] = field(default_factory=lambda: list(ALL_MODELS))
    seed: int = 42
    out_dir: str = "results"
    verbose: int = 1


# %% [markdown]
# ## 2. 資料
# `load_prices()` 是唯一和資料來源有關的函式，之後換台股資料源只要改這裡。

# %%
def load_prices(cfg: Config, ticker: Optional[str]) -> pd.Series:
    """回傳以日期為 index 的價格序列。"""
    if cfg.csv_path:
        df = pd.read_csv(cfg.csv_path)
        date_col = next(
            (c for c in df.columns if str(c).lower() in ("date", "datetime", "time", "日期")), None
        )
        if date_col is not None:
            df[date_col] = pd.to_datetime(df[date_col])
            df = df.set_index(date_col).sort_index()
    else:
        import yfinance as yf

        df = yf.download(ticker, start=cfg.start, end=cfg.end, auto_adjust=False, progress=False)
        if isinstance(df.columns, pd.MultiIndex):  # 新版 yfinance 會回傳多層欄位
            df.columns = df.columns.get_level_values(0)
    if df.empty or cfg.price_col not in df.columns:
        raise ValueError(f"找不到資料或欄位 {cfg.price_col!r}；可用欄位：{list(df.columns)}")
    return df[cfg.price_col].astype(float).dropna()


def make_windows(values: np.ndarray, window: int):
    """X[i] = values[i:i+window]，y[i] = values[i+window]。"""
    X = np.lib.stride_tricks.sliding_window_view(values[:-1], window)
    y = values[window:]
    return X.copy(), y.copy()


@dataclass
class Dataset:
    X_train: np.ndarray
    y_train: np.ndarray
    X_test: np.ndarray
    y_test: np.ndarray
    X_fit: np.ndarray      # 搜尋時用來訓練候選模型
    y_fit: np.ndarray
    X_eval: np.ndarray     # 搜尋時用來算 fitness（val 或 test）
    y_eval: np.ndarray
    scaler: MinMaxScaler
    test_dates: pd.DatetimeIndex


def prepare_dataset(prices: pd.Series, cfg: Config) -> Dataset:
    raw = prices.values.reshape(-1, 1)
    n_samples = len(raw) - cfg.window
    n_train = int(n_samples * cfg.train_ratio)

    # scaler 只看訓練樣本涵蓋到的價格，避免偷看未來
    scaler = MinMaxScaler().fit(raw[: n_train + cfg.window])
    scaled = scaler.transform(raw).ravel()

    X, y = make_windows(scaled, cfg.window)
    X = X[..., None]  # (樣本, 20, 1)
    X_train, y_train = X[:n_train], y[:n_train]
    X_test, y_test = X[n_train:], y[n_train:]

    if cfg.fitness_on == "test":
        X_fit, y_fit, X_eval, y_eval = X_train, y_train, X_test, y_test
    else:
        n_val = int(len(X_train) * cfg.val_ratio)
        X_fit, y_fit = X_train[:-n_val], y_train[:-n_val]
        X_eval, y_eval = X_train[-n_val:], y_train[-n_val:]

    test_dates = prices.index[cfg.window + n_train:]
    return Dataset(X_train, y_train, X_test, y_test, X_fit, y_fit, X_eval, y_eval, scaler, test_dates)


# %% [markdown]
# ## 3. 模型（論文 Table 1–5）

# %%
OPTIMIZERS = ["Adagrad", "Adam", "Adamax", "RMSprop", "SGD"]


def build_lstm(window: int, lstm_units: List[int], dense_units: int, dropout: float,
               optimizer: str = "Adam", lr: float = 1e-3) -> keras.Model:
    model = keras.Sequential([keras.Input(shape=(window, 1))])
    for k, units in enumerate(lstm_units):
        model.add(keras.layers.LSTM(units, return_sequences=k < len(lstm_units) - 1))
    model.add(keras.layers.Dense(dense_units, activation="relu"))
    model.add(keras.layers.Dropout(dropout))
    model.add(keras.layers.Dense(1))
    model.compile(optimizer=getattr(keras.optimizers, optimizer)(learning_rate=lr), loss="mse")
    return model


def build_ann(window: int) -> keras.Model:
    model = keras.Sequential([
        keras.Input(shape=(window, 1)),
        keras.layers.Flatten(),
        keras.layers.Dense(10, activation="relu"),
        keras.layers.Dense(10, activation="relu"),
        keras.layers.Dropout(0.5),
        keras.layers.Dense(1),
    ])
    model.compile(optimizer=keras.optimizers.Adam(learning_rate=1e-3), loss="mse")
    return model


BASELINES: Dict[str, Callable[[int], keras.Model]] = {
    "ANN": build_ann,
    "LSTM1D": lambda w: build_lstm(w, [10], 10, 0.5),
    "LSTM2D": lambda w: build_lstm(w, [10, 10], 10, 0.5),
    "LSTM3D": lambda w: build_lstm(w, [10, 10, 10], 10, 0.5),
}


def train(model: keras.Model, X, y, cfg: Config, X_val=None, y_val=None) -> keras.Model:
    """有 X_val 就用它做 early stopping，否則取訓練資料最後 10%。"""
    es = keras.callbacks.EarlyStopping(monitor="val_loss", patience=cfg.patience,
                                       restore_best_weights=True)
    kw = dict(validation_data=(X_val, y_val)) if X_val is not None else dict(validation_split=0.1)
    model.fit(X, y, epochs=cfg.epochs, batch_size=cfg.batch_size, callbacks=[es],
              shuffle=True, verbose=0, **kw)
    return model


def inverse(scaler: MinMaxScaler, v: np.ndarray) -> np.ndarray:
    return scaler.inverse_transform(np.asarray(v).reshape(-1, 1)).ravel()


# %% [markdown]
# ## 4. 超參數編碼（論文 Table 6）
# 每個解是 9 維、每維介於 [0, 1] 的連續向量，解碼成離散超參數。

# %%
NEURONS = list(range(1, 21))
SEARCH_SPACE = [
    ("x0_lstm1_units", NEURONS),
    ("x1_lstm2_exists", [0, 1]),
    ("x2_lstm2_units", NEURONS),
    ("x3_lstm3_exists", [0, 1]),
    ("x4_lstm3_units", NEURONS),
    ("x5_dense_units", NEURONS),
    ("x6_dropout", [0.3, 0.4, 0.5, 0.6, 0.7]),
    ("x7_optimizer", OPTIMIZERS),
    ("x8_lr", [1e-2, 1e-3, 1e-4, 1e-5, 1e-6]),
]
DIM = len(SEARCH_SPACE)


def decode(x: np.ndarray) -> dict:
    hp = {}
    for v, (name, choices) in zip(x, SEARCH_SPACE):
        idx = min(int(float(v) * len(choices)), len(choices) - 1)
        hp[name] = choices[max(idx, 0)]
    return hp


def hp_to_arch(hp: dict) -> dict:
    units = [hp["x0_lstm1_units"]]
    if hp["x1_lstm2_exists"]:
        units.append(hp["x2_lstm2_units"])
    if hp["x3_lstm3_exists"]:
        units.append(hp["x4_lstm3_units"])
    return dict(lstm_units=units, dense_units=hp["x5_dense_units"], dropout=hp["x6_dropout"],
                optimizer=hp["x7_optimizer"], lr=hp["x8_lr"])


def arch_key(arch: dict) -> tuple:
    return (tuple(arch["lstm_units"]), arch["dense_units"], arch["dropout"], arch["optimizer"], arch["lr"])


class FitnessFunction:
    """fitness = 候選模型在 eval 集（原始價格尺度）的 MSE；相同架構會快取。"""

    def __init__(self, ds: Dataset, cfg: Config, tag: str):
        self.ds, self.cfg, self.tag = ds, cfg, tag
        self.cache: Dict[tuple, float] = {}
        self.n_trained = 0
        self.best_mse = float("inf")
        self.best_pred: Optional[np.ndarray] = None   # 最佳模型在 eval 集的預測（原始價格）

    def __call__(self, x: np.ndarray) -> float:
        arch = hp_to_arch(decode(x))
        key = arch_key(arch)
        if key in self.cache:
            return self.cache[key]
        ds = self.ds
        keras.backend.clear_session()
        model = build_lstm(self.cfg.window, **arch)
        # fitness_on == "test" 時沒有獨立驗證集，early stopping 用訓練資料尾端
        if self.cfg.fitness_on == "test":
            train(model, ds.X_fit, ds.y_fit, self.cfg)
        else:
            train(model, ds.X_fit, ds.y_fit, self.cfg, ds.X_eval, ds.y_eval)
        pred = inverse(ds.scaler, model.predict(ds.X_eval, verbose=0).ravel())
        mse = mean_squared_error(inverse(ds.scaler, ds.y_eval), pred)
        if not np.isfinite(mse):
            mse = float("inf")
        if mse < self.best_mse:
            self.best_mse, self.best_pred = float(mse), pred
        self.cache[key] = float(mse)
        self.n_trained += 1
        if self.cfg.verbose >= 2:
            print(f"    [{self.tag}] #{self.n_trained:3d} {arch} -> MSE={mse:.4f}")
        return float(mse)


# %% [markdown]
# ## 5. ARO：Artificial Rabbits Optimization（論文 Eq. 6–20）

# %%
def aro(fobj: Callable[[np.ndarray], float], dim: int, pop_size: int, max_iter: int,
        lb: float = 0.0, ub: float = 1.0, rng: Optional[np.random.Generator] = None,
        verbose: int = 1):
    rng = rng or np.random.default_rng()
    n, d, T = pop_size, dim, max_iter
    X = rng.uniform(lb, ub, (n, d))
    fit = np.array([fobj(x) for x in X])
    best_i = int(np.argmin(fit))
    best_x, best_f = X[best_i].copy(), fit[best_i]
    history = [best_f]

    for t in range(1, T + 1):
        for i in range(n):
            # Eq. 8：running length，前期大、後期小
            L = (math.e - math.exp(((t - 1) / T) ** 2)) * math.sin(2 * math.pi * rng.random())
            # Eq. 9–10：mapping vector，隨機選 ceil(r3*d) 個維度
            c = np.zeros(d)
            c[rng.permutation(d)[: math.ceil(rng.random() * d)]] = 1
            R = L * c                                                   # Eq. 7
            A = 4 * (1 - t / T) * math.log(1 / max(rng.random(), 1e-12))  # Eq. 20：能量因子

            if A > 1:
                # 迂迴覓食（探索）Eq. 6
                j = rng.choice([k for k in range(n) if k != i])
                v = X[j] + R * (X[i] - X[j]) + round(0.5 * (0.05 + rng.random())) * rng.standard_normal()
            else:
                # 隨機躲藏（開發）Eq. 13, 16–18
                H = (T - t + 1) / T * rng.standard_normal()
                gr = np.zeros(d)
                gr[math.ceil(rng.random() * d) - 1] = 1
                b = X[i] + H * gr * X[i]
                v = X[i] + R * (rng.random() * b - X[i])

            v = np.clip(v, lb, ub)
            fv = fobj(v)
            if fv < fit[i]:  # Eq. 19：貪婪更新
                X[i], fit[i] = v, fv
                if fv < best_f:
                    best_x, best_f = v.copy(), fv
        history.append(best_f)
        if verbose:
            print(f"  ARO iter {t:3d}/{T}  best fitness = {best_f:.4f}")
    return best_x, best_f, history


# %% [markdown]
# ## 6. GA：基因演算法（比較用，LSTM-GA）
# 論文沒有給 GA 細節，這裡用常見設定：tournament selection、uniform crossover、隨機重設突變、菁英保留。

# %%
def ga(fobj: Callable[[np.ndarray], float], dim: int, pop_size: int, max_iter: int,
       lb: float = 0.0, ub: float = 1.0, rng: Optional[np.random.Generator] = None,
       pc: float = 0.8, pm: Optional[float] = None, tournament: int = 3, verbose: int = 1):
    rng = rng or np.random.default_rng()
    pm = pm if pm is not None else 1.0 / dim
    P = rng.uniform(lb, ub, (pop_size, dim))
    fit = np.array([fobj(x) for x in P])
    history = [fit.min()]

    def select():
        idx = rng.choice(pop_size, size=min(tournament, pop_size), replace=False)
        return P[idx[np.argmin(fit[idx])]]

    for g in range(1, max_iter + 1):
        elite = P[np.argmin(fit)].copy()
        children = [elite]
        while len(children) < pop_size:
            p1, p2 = select(), select()
            child = np.where(rng.random(dim) < 0.5, p1, p2) if rng.random() < pc else p1.copy()
            mask = rng.random(dim) < pm
            child[mask] = rng.uniform(lb, ub, mask.sum())
            children.append(child)
        P = np.array(children)
        fit = np.array([fobj(x) for x in P])  # 菁英已快取，不會重訓
        history.append(fit.min())
        if verbose:
            print(f"  GA  gen  {g:3d}/{max_iter}  best fitness = {fit.min():.4f}")
    b = int(np.argmin(fit))
    return P[b], fit[b], history


# %% [markdown]
# ## 7. 評估（論文 Eq. 21–24）

# %%
def evaluate(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    return dict(
        MSE=mean_squared_error(y_true, y_pred),
        MAE=mean_absolute_error(y_true, y_pred),
        MAPE=mean_absolute_percentage_error(y_true, y_pred),  # 比例，與論文表格一致
        R2=r2_score(y_true, y_pred),
    )


def trading_eval(prev: np.ndarray, y_true: np.ndarray, y_pred: np.ndarray, cfg: Config) -> dict:
    """
    簡單多空切換回測（只做多）：第 t-1 天收盤得知預測值，
    若預測漲幅 > threshold 就以收盤價持有到第 t 天收盤，否則空手。
    註：假設能以預測當天的收盤價成交，略為樂觀。
    """
    real_ret = y_true / prev - 1
    pred_ret = y_pred / prev - 1
    pos = (pred_ret > cfg.trade_threshold).astype(float)
    change = np.diff(np.concatenate([[0.0], pos, [0.0]]))   # 最後一天強制平倉
    buys, sells = (change[:-1] > 0), (change < 0)
    cost = buys * cfg.fee_rate + sells[:-1] * (cfg.fee_rate + cfg.tax_rate)
    cost[-1] += sells[-1] * (cfg.fee_rate + cfg.tax_rate)
    strat = pos * real_ret - cost
    equity = np.cumprod(1 + strat)
    gross = np.cumprod(1 + pos * real_ret)
    bh = np.cumprod(1 + real_ret)
    moved = pred_ret != 0
    dir_acc = float(np.mean(np.sign(pred_ret[moved]) == np.sign(real_ret[moved]))) if moved.any() else float("nan")
    sharpe = float(np.mean(strat) / np.std(strat) * np.sqrt(252)) if np.std(strat) > 0 else float("nan")
    return dict(
        DirAcc=dir_acc,
        Trades=int(buys.sum()),
        InMarket=float(pos.mean()),
        GrossRet=float(gross[-1] - 1),
        NetRet=float(equity[-1] - 1),
        BuyHold=float(bh[-1] - 1),
        Sharpe=sharpe,
        _equity=equity,
    )


def set_seed(seed: int):
    random.seed(seed)
    np.random.seed(seed)
    tf.keras.utils.set_random_seed(seed)


# %% [markdown]
# ## 8. 主流程

# %%
def run_ticker(cfg: Config, ticker: Optional[str]) -> dict:
    name = ticker or os.path.splitext(os.path.basename(cfg.csv_path))[0]
    print(f"\n========== {name} ==========")
    prices = load_prices(cfg, ticker)
    ds = prepare_dataset(prices, cfg)
    print(f"共 {len(prices)} 天；train={len(ds.X_train)}  test={len(ds.X_test)}  "
          f"(search fit={len(ds.X_fit)}, eval={len(ds.X_eval)} on {cfg.fitness_on})")

    y_true = inverse(ds.scaler, ds.y_test)
    prev = inverse(ds.scaler, ds.X_test[:, -1, 0])   # 前一天價格
    results, preds, extra = {}, {"date": ds.test_dates, "actual": y_true}, {}
    equities = {}

    for m in cfg.models:
        set_seed(cfg.seed)
        t0 = time.time()
        if m == "NAIVE":
            model = None   # 明天 = 今天
        elif m in BASELINES:
            keras.backend.clear_session()
            model = train(BASELINES[m](cfg.window), ds.X_train, ds.y_train, cfg)
        elif m in ("LSTM-ARO", "LSTM-GA"):
            optimizer = aro if m == "LSTM-ARO" else ga
            fobj = FitnessFunction(ds, cfg, m)
            print(f"[{m}] 搜尋中：pop={cfg.pop_size}, iters={cfg.iterations}")
            best_x, best_f, hist = optimizer(fobj, DIM, cfg.pop_size, cfg.iterations,
                                             rng=np.random.default_rng(cfg.seed), verbose=cfg.verbose)
            arch = hp_to_arch(decode(best_x))
            print(f"[{m}] 最佳架構 {arch}（fitness={best_f:.4f}，實際訓練 {fobj.n_trained} 個模型）")
            extra[m] = dict(best_arch=arch, best_fitness=best_f, history=hist, n_trained=fobj.n_trained)
            if cfg.fitness_on == "test":
                # 論文流程：搜尋時就是在測試集評分，直接採用分數最好的那個已訓練模型
                model = "search_best"
            else:
                # 用最佳架構在完整訓練集重新訓練，再評估測試集
                set_seed(cfg.seed)
                keras.backend.clear_session()
                model = train(build_lstm(cfg.window, **arch), ds.X_train, ds.y_train, cfg)
        else:
            raise ValueError(f"未知模型 {m}")
        if model is None:
            pred = prev.copy()
        elif isinstance(model, str):
            pred = fobj.best_pred
        else:
            pred = inverse(ds.scaler, model.predict(ds.X_test, verbose=0).ravel())
        tr = trading_eval(prev, y_true, pred, cfg)
        equities[m] = tr.pop("_equity")
        results[m] = {**evaluate(y_true, pred), **tr, "time_s": time.time() - t0}
        preds[m] = pred
        r = results[m]
        print(f"[{m:8s}] MSE={r['MSE']:.4f} MAE={r['MAE']:.4f} MAPE={r['MAPE']:.4f} "
              f"R2={r['R2']:.4f} | DirAcc={r['DirAcc']:.3f} Trades={r['Trades']} "
              f"Net={r['NetRet']:+.2%} (B&H {r['BuyHold']:+.2%}) ({r['time_s']:.1f}s)")

    save_outputs(cfg, name, results, pd.DataFrame(preds), extra, equities)
    return name, results


def save_outputs(cfg: Config, name: str, results: dict, preds: pd.DataFrame, extra: dict,
                 equities: Optional[dict] = None):
    out = os.path.join(cfg.out_dir, name.replace("^", ""))
    os.makedirs(out, exist_ok=True)
    pd.DataFrame(results).T.to_csv(os.path.join(out, "metrics.csv"))
    preds.to_csv(os.path.join(out, "predictions.csv"), index=False)
    with open(os.path.join(out, "search.json"), "w", encoding="utf-8") as f:
        json.dump({"config": asdict(cfg), **extra}, f, ensure_ascii=False, indent=2, default=float)

    import matplotlib
    if not _in_notebook():
        matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    models = [m for m in cfg.models if m in preds]
    cols = 2
    rows = math.ceil(len(models) / cols)
    fig, axes = plt.subplots(rows, cols, figsize=(14, 3.5 * rows), squeeze=False)
    for ax, m in zip(axes.flat, models):
        ax.plot(preds["date"], preds["actual"], "--", label="Actual", linewidth=1)
        ax.plot(preds["date"], preds[m], label=m, linewidth=1)
        ax.set_title(f"{name} - {m}  (R2={results[m]['R2']:.3f})")
        ax.legend()
    for ax in list(axes.flat)[len(models):]:
        ax.axis("off")
    fig.tight_layout()
    fig.savefig(os.path.join(out, "predictions.png"), dpi=120)

    if extra:
        fig2, ax2 = plt.subplots(figsize=(7, 4))
        for m, e in extra.items():
            ax2.plot(e["history"], marker="o", label=m)
        ax2.set_xlabel("Iteration")
        ax2.set_ylabel(f"Best fitness (MSE on {cfg.fitness_on})")
        ax2.set_title(f"{name} - convergence")
        ax2.legend()
        fig2.tight_layout()
        fig2.savefig(os.path.join(out, "convergence.png"), dpi=120)
    if equities:
        fig3, ax3 = plt.subplots(figsize=(10, 4.5))
        bh = preds["actual"].values / np.concatenate([[preds["actual"].values[0]], preds["actual"].values[:-1]])
        ax3.plot(preds["date"], np.cumprod(bh), "k--", label="Buy & Hold", linewidth=1.2)
        for m, eq in equities.items():
            ax3.plot(preds["date"], eq, label=m, linewidth=1)
        ax3.axhline(1, color="gray", linewidth=0.5)
        ax3.set_title(f"{name} - strategy equity (net of fees {cfg.fee_rate:.4%} + tax {cfg.tax_rate:.1%})")
        ax3.legend(ncol=2, fontsize=8)
        fig3.tight_layout()
        fig3.savefig(os.path.join(out, "backtest.png"), dpi=120)
    if _in_notebook():
        plt.show()
    else:
        plt.close("all")
    print(f"結果已存到 {out}")


def _in_notebook() -> bool:
    try:
        from IPython import get_ipython
        return get_ipython() is not None and "IPKernelApp" in get_ipython().config
    except Exception:
        return False


def run(cfg: Config) -> pd.DataFrame:
    tickers = [None] if cfg.csv_path else cfg.tickers
    all_res = {}
    for tk in tickers:
        name, res = run_ticker(cfg, tk)
        for m, r in res.items():
            all_res[(name, m)] = r
    df = pd.DataFrame(all_res).T
    df.index.names = ["ticker", "model"]
    os.makedirs(cfg.out_dir, exist_ok=True)
    df.to_csv(os.path.join(cfg.out_dir, "summary.csv"))
    print("\n========== 總表 ==========")
    with pd.option_context("display.width", 250):
        print(df.drop(columns=["time_s"]).round(4).to_string())
    return df


PAPER_MODELS = ["ANN", "LSTM1D", "LSTM2D", "LSTM3D", "LSTM-GA", "LSTM-ARO"]


def paper_config(**overrides) -> Config:
    """完全照論文有寫明的設定（§3.6、§4.1、Table 6、Fig. 2、§4.3）。"""
    base = dict(
        start="2018-01-01", end="2023-01-01", price_col="Close",
        window=20, train_ratio=0.8,
        fitness_on="test",          # Fig. 2：以測試集誤差作為 fitness
        pop_size=50, iterations=50,  # §4.3：50 族群、50 迭代
        models=list(PAPER_MODELS),
    )
    base.update(overrides)
    return Config(**base)


# %% [cli]
def parse_args() -> Config:
    p = argparse.ArgumentParser(description="LSTM-ARO stock price prediction (Gülmez, 2023)")
    d = Config()
    p.add_argument("--tickers", nargs="+", default=d.tickers)
    p.add_argument("--csv", dest="csv_path", default=None)
    p.add_argument("--start", default=d.start)
    p.add_argument("--end", default=d.end)
    p.add_argument("--price-col", default=d.price_col)
    p.add_argument("--window", type=int, default=d.window)
    p.add_argument("--train-ratio", type=float, default=d.train_ratio)
    p.add_argument("--val-ratio", type=float, default=d.val_ratio)
    p.add_argument("--fitness-on", choices=["val", "test"], default=d.fitness_on)
    p.add_argument("--pop", dest="pop_size", type=int, default=d.pop_size)
    p.add_argument("--iters", dest="iterations", type=int, default=d.iterations)
    p.add_argument("--epochs", type=int, default=d.epochs)
    p.add_argument("--batch-size", type=int, default=d.batch_size)
    p.add_argument("--patience", type=int, default=d.patience)
    p.add_argument("--fee-rate", type=float, default=d.fee_rate)
    p.add_argument("--tax-rate", type=float, default=d.tax_rate)
    p.add_argument("--trade-threshold", type=float, default=d.trade_threshold)
    p.add_argument("--models", nargs="+", default=d.models, choices=ALL_MODELS)
    p.add_argument("--seed", type=int, default=d.seed)
    p.add_argument("--out-dir", default=d.out_dir)
    p.add_argument("--verbose", type=int, default=d.verbose)
    p.add_argument("--paper", action="store_true",
                   help="套用論文設定（測試集 fitness、50×50、Close、論文 6 個模型）；"
                        "只會覆蓋你沒有另外指定的參數")
    args = p.parse_args()
    if not args.paper:
        return Config(**{k: v for k, v in vars(args).items() if k != "paper"})
    # 使用者明確指定的參數優先於論文預設
    given = {k: v for k, v in vars(args).items() if k != "paper" and v != getattr(d, k)}
    paper = asdict(paper_config())
    paper.update(given)
    return Config(**paper)


if __name__ == "__main__":
    run(parse_args())
