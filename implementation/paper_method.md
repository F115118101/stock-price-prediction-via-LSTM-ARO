# LSTM-ARO 論文方法整理

> **論文**：Burak Gülmez (2023). *Stock price prediction with optimized deep LSTM network with artificial rabbits optimization algorithm*. Expert Systems With Applications, 227, 120346. https://doi.org/10.1016/j.eswa.2023.120346

---

## 1. 核心概念

用 **ARO（Artificial Rabbits Optimization，人工兔子最佳化演算法）** 這個 metaheuristic 演算法，去搜尋 **深層 LSTM 的架構與超參數**（層數、每層神經元數、Dense 神經元數、Dropout、Optimizer、Learning rate），得到的模型稱為 **LSTM-ARO**，用來做「用過去 20 天價格預測隔天價格」的單步回歸。

比較對象：ANN、LSTM1D、LSTM2D、LSTM3D（固定架構），以及用 **GA（基因演算法）** 搜尋同一個空間的 LSTM-GA。

```
┌──────────── ARO（外層：搜尋架構） ────────────┐      ┌──────── Deep LSTM（內層：評估） ────────┐
│ 初始化族群（每隻兔子 = 一組超參數）            │      │ 資料 → 切 train / test                   │
│ loop t = 1..T:                                 │      │                                          │
│   計算能量因子 A                               │      │                                          │
│   A > 1 ? 迂迴覓食(探索) : 隨機躲藏(開發)       │      │                                          │
│   計算 fitness 並更新位置 ─────────────────────┼────► │ 依超參數建模 → 訓練 → 預測 → 算誤差       │
│                     ◄──────────────────────────┼───── │ 誤差即為 fitness                         │
│ 直到最大迭代 → 輸出最佳解                      │      │                                          │
└────────────────────────────────────────────────┘      └──────────────────────────────────────────┘
```
（對應論文 Fig. 2）

---

## 2. 資料設定（論文 §4.1）

| 項目 | 論文設定 |
|---|---|
| 資料來源 | Yahoo Finance（Python API） |
| 標的 | DJIA 30 檔成分股，每檔各自訓練/評估 |
| 期間 | 2018-01-01 ～ 2023-01-01（5 年日資料） |
| 輸入 | 前 20 天的價格（time window = 20，單變量） |
| 輸出 | 下一天的價格 |
| 切分 | 前 80% 訓練、後 20% 測試（時間順序） |

論文**沒有說明**：使用哪個價格欄位（推測 Close）、是否正規化、epoch、batch size、GA 參數、是否有驗證集。

---

## 3. LSTM 單元（論文 Eq. 1–5）

| 元件 | 公式 |
|---|---|
| Input gate | $i_t = \sigma(W_i[h_{t-1}, x_t] + b_i)$ |
| Forget gate | $f_t = \sigma(W_f[h_{t-1}, x_t] + b_f)$ |
| Output gate | $o_t = \sigma(W_o[h_{t-1}, x_t] + b_o)$ |
| Cell state | $c_t = f_t \odot c_{t-1} + i_t \odot \tanh(W_c[h_{t-1}, x_t] + b_c)$ |
| Hidden state | $h_t = o_t \odot \tanh(c_t)$ |

---

## 4. 模型架構（論文 Table 1–5）

### 4.1 固定架構的基準模型

| 模型 | 架構 |
|---|---|
| ANN | Input(20) → Dense(10) → Dense(10) → Dropout(0.5) → Dense(1) |
| LSTM1D | Input(20) → LSTM(10) → Dense(10) → Dropout(0.5) → Dense(1) |
| LSTM2D | Input(20) → LSTM(10) → LSTM(10) → Dense(10) → Dropout(0.5) → Dense(1) |
| LSTM3D | Input(20) → LSTM(10) → LSTM(10) → LSTM(10) → Dense(10) → Dropout(0.5) → Dense(1) |

### 4.2 可搜尋架構（LSTM-GA / LSTM-ARO，Table 5）

```
Input(20)
→ LSTM(x0)
→ LSTM(x2)      ← 只有 x1 = 1 才存在
→ LSTM(x4)      ← 只有 x3 = 1 才存在
→ Dense(x5)
→ Dropout(x6)
→ Dense(1)
＋ optimizer(x7)、learning rate(x8)
```

### 4.3 超參數搜尋空間（Table 6）

| 變數 | 意義 | 候選值 |
|---|---|---|
| x0, x2, x4 | LSTM 第 1/2/3 層神經元數 | 1, 2, …, 20 |
| x1, x3 | 第 2/3 層 LSTM 是否存在 | 0, 1 |
| x5 | Dense 神經元數 | 1, 2, …, 20 |
| x6 | Dropout rate | 0.3, 0.4, 0.5, 0.6, 0.7 |
| x7 | Optimizer | Adagrad, Adam, Adamax, RMSprop, SGD |
| x8 | Learning rate | 1e-2, 1e-3, 1e-4, 1e-5, 1e-6 |

→ 一隻兔子（一個解）= 9 維向量。

---

## 5. ARO 演算法（論文 §3.5，原始出處 Wang et al., 2022）

符號：$n$ 族群數、$d$ 維度、$T$ 最大迭代數、$t$ 目前迭代、$r_1..r_5 \sim U(0,1)$、$n_1, n_2 \sim N(0,1)$。

### 5.1 能量因子：決定探索 or 開發（Eq. 20）

$$A(t) = 4\left(1 - \frac{t}{T}\right)\ln\frac{1}{r}$$

- $A > 1$ → **迂迴覓食（Detour foraging，探索）**
- $A \le 1$ → **隨機躲藏（Random hiding，開發）**

隨迭代進行 $A$ 變小，因此逐漸由探索轉為開發。

### 5.2 迂迴覓食（Eq. 6–11）

兔子不吃自己窩邊草，而是跑到**另一隻隨機兔子 $j$** 的區域附近找食物：

$$\vec v_i(t+1) = \vec x_j(t) + R\cdot(\vec x_i(t) - \vec x_j(t)) + \text{round}(0.5(0.05+r_1))\cdot n_1$$

$$R = L\cdot c,\qquad L = \left(e - e^{\left(\frac{t-1}{T}\right)^2}\right)\sin(2\pi r_2)$$

$$c(k) = \begin{cases}1 & k \in g(1..\lceil r_3 d\rceil)\\0 & \text{otherwise}\end{cases},\qquad g = \text{randperm}(d)$$

- $L$（running length）：前期步伐大、後期步伐小。
- $c$：隨機挑一部分維度做變動（mapping vector）。
- $\text{round}(0.5(0.05+r_1))$：只有約 5% 機率為 1，產生額外擾動以跳出局部解。

### 5.3 隨機躲藏（Eq. 12–18）

兔子在每個維度各挖一個洞（共 $d$ 個），隨機選一個躲：

$$\vec b_{i,j}(t) = \vec x_i(t) + H\cdot g\cdot \vec x_i(t),\qquad H = \frac{T-t+1}{T}\cdot n_2$$

（$g$ 為第 $j$ 維的 one-hot 向量；$H$ 隨迭代線性縮小，洞越挖越靠近。）

選中的洞 $\vec b_{i,r}$（維度 $\lceil r_5 d\rceil$）：

$$\vec v_i(t+1) = \vec x_i(t) + R\cdot(r_4\cdot \vec b_{i,r}(t) - \vec x_i(t))$$

> 論文 Eq. 13 印的是 $\cdot r_4$，但同時列出了沒被使用的 $n_2 \sim N(0,1)$（Eq. 14）；原始 ARO 論文/程式碼中 $H$ 乘的是常態亂數，實作採用 $n_2$。

### 5.4 位置更新：貪婪選擇（Eq. 19）

$$\vec x_i(t+1) = \begin{cases}\vec x_i(t) & f(\vec x_i(t)) \le f(\vec v_i(t+1))\\ \vec v_i(t+1) & \text{otherwise}\end{cases}$$

（最小化問題：新位置比較好才移過去。）

### 5.5 虛擬碼

```
初始化 n 隻兔子位置 X ∈ [lb, ub]^d，計算 fitness
for t = 1..T:
    for i = 1..n:
        計算 L, c, R, A
        if A > 1:  v = 迂迴覓食 (Eq.6)
        else:      v = 隨機躲藏 (Eq.16)
        v = clip(v, lb, ub)
        if f(v) < f(x_i): x_i = v            (Eq.19)
        更新全域最佳解
return 最佳解
```

---

## 6. ARO 與 LSTM 的結合方式

1. 兔子位置是連續向量 → **解碼**成離散超參數（實作中：每維在 [0,1]，乘上候選數量後取整數索引）。
2. 依超參數建立 LSTM → 在訓練資料訓練 → 預測 → 誤差當 **fitness（越小越好）**。
3. ARO 跑完 → 最佳超參數即 LSTM-ARO 的最終架構。
4. 論文設定：**族群 50、迭代 50**（GA 同），30 檔股票共耗時約 8.7 天（HPC）。

> ⚠️ 論文流程圖中 fitness 是以「Prediction of test data → Calculate accuracy and error」計算，也就是**直接用測試集誤差挑超參數**，這會造成資料洩漏（測試結果過度樂觀）。實作預設改為從訓練集切出驗證集來算 fitness，另提供 `fitness_on="test"` 選項重現論文作法。

---

## 7. 評估指標（Eq. 21–24）

| 指標 | 公式 | 方向 |
|---|---|---|
| MSE | $\frac1n\sum(y_i-\hat y_i)^2$ | 越小越好 |
| MAE | $\frac1n\sum\lvert y_i-\hat y_i\rvert$ | 越小越好 |
| MAPE | $\frac1n\sum\left\lvert\frac{y_i-\hat y_i}{y_i}\right\rvert$ | 越小越好 |
| R² | $1-\frac{\sum(y_i-\hat y_i)^2}{\sum(y_i-\bar y)^2}$ | 越接近 1 越好 |

- 從數值大小判斷（例如 AXP 的 MSE ≈ 24），指標是在**原始價格尺度**上計算。
- 論文表中的 MAPE（如 0.024）是**比例**而非百分比（公式寫 ×100，但表格顯然沒乘）。

---

## 8. 論文結果摘要

- LSTM-ARO 在大多數股票的 MSE / MAE / MAPE / R² 都最佳，LSTM-GA 非常接近（部分股票 GA 略勝）。
- 固定架構的 LSTM1D/2D/3D 在部分股票（KO、UNH、CVX）R² 甚至為負。
- 單次預測時間（30 檔）：ANN 136s < LSTM1D 250s < LSTM-GA 289s < LSTM-ARO 302s < LSTM2D 374s < LSTM3D 502s。

---

## 9. 實作時需自行補上的設定（論文未說明）

| 項目 | 實作預設 |
|---|---|
| 價格欄位 | Close |
| 正規化 | MinMaxScaler，只用訓練段資料 fit，評估時反轉回原價格 |
| Dense 層激活函數 | ReLU |
| epoch / batch | 50 / 32，EarlyStopping(patience=10) |
| 基準模型的 optimizer | Adam, lr = 1e-3 |
| fitness | 驗證集 MSE（可切換成測試集重現論文） |
| GA 參數 | tournament(k=3)、uniform crossover(0.8)、mutation(1/d)、菁英保留 1 |
| 族群/迭代 | 預設 10/10（論文 50/50，太花時間；可用參數調整） |
| 相同超參數 | 快取 fitness，避免重複訓練 |

---

## 10. 換成台股時的注意事項

- yfinance 代號：上市 `2330.TW`、上櫃 `xxxx.TWO`；指數 `^TWII`。
- 台股有漲跌停（±10%），價格變動有上下限，與美股分布不同。
- 除權息會造成價格跳空，建議使用還原股價（Adj Close）或自行還原。
- 程式中的 `load_prices()` 已預留 CSV 介面，之後換成 TEJ / FinMind / 證交所資料只需改這個函式。
