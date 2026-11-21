# 測試：隱藏 Dense 層用 linear 還是 ReLU？

論文 Table 1–5 只列出層和神經元數，沒寫隱藏 Dense 層的激活函數。notebook 目前預設用 Keras 預設值 `linear`，但現在多數 LSTM 範例會在 Dense 層加 `ReLU`。
這份文件說明：**先用第 1 份股票（`"1/3"`）兩種都跑，看哪一種的結果比較接近論文，再決定其他兩份用哪一種**。

不需要改程式，只改 notebook 第一格的設定。

---

## 1. 兩種設定不會互相覆蓋

`DENSE_ACTIVATION` 是 RUN ID 和結果資料夾名稱的一部分，兩種結果會分開存：

| 設定 | 結果資料夾 | RUN ID |
|---|---|---|
| `DENSE_ACTIVATION = "linear"` | `results_djia/paper_lin_t20_e20-50_s5/` | `paper_lin_t20_e20-50_s5_p10_i10_data-22650beb` |
| `DENSE_ACTIVATION = "relu"` | `results_djia/paper_relu_t20_e20-50_s5/` | `paper_relu_t20_e20-50_s5_p10_i10_data-22650beb` |

所以兩種可以放在同一個 Drive 或同一台電腦，各跑各的，合併時也不會混在一起。

---

## 2. 步驟

### 第一階段：用 `"1/3"` 比較（負責人自己跑）

`"1/3"` 的 10 檔：AXP BA CVX HON JNJ MCD MSFT TRV VZ DIS

建議在**筆電**上跑，比 Colab 快約 3 倍：

| 跑法 | 筆電（推算） | Colab T4 |
|---|---:|---:|
| 只跑 Step 1（ANN、LSTM1D/2D/3D、NAIVE） | 每種激活約 10 分鐘 | 每種約 0.5 小時 |
| 全部模型（含 GA、ARO） | 每種激活約 1.2 小時 | 每種約 3.9 小時 |

**快速版**只看固定架構的 4 個模型就能判斷。激活函數對所有模型的影響方向應該相同，而且不必讓另外兩位等太久。

1. 第一格設定：
   ```python
   SHARD            = "1/3"
   DENSE_ACTIVATION = "linear"
   ```
2. 執行到 Step 1（快速版）或全部執行（完整版）。
   - 只跑 Step 1：從第一格依序執行到「Step 1」那格，然後**跳過 Step 2、Step 3**，直接執行「彙整」那格。
3. 改成 `DENSE_ACTIVATION = "relu"`，**從第一格重新執行**（設定改了，後面的格子都要重跑），一樣跑到 Step 1（或全部）。
4. 依第 3 節比較兩種結果。

### 第二階段：其他兩份用勝出的設定

1. 通知另外兩位把 `DENSE_ACTIVATION` 改成勝出的那個，並確認 RUN ID 一致（`paper_lin_...` 或 `paper_relu_...`）。
2. 他們分別跑 `"2/3"`、`"3/3"`，全部執行。
3. 你這邊把 `"1/3"` 用勝出設定**補跑完全部模型**。如果第一階段已跑完整版，就不用補；已完成的會自動跳過。
4. 負責人合併前，第一格也要設成勝出的 `DENSE_ACTIVATION`，否則合併時會因設定不同而拒收。

> 分工：**負責人 `"1/3"`，另外兩位 `"2/3"`、`"3/3"`**。

---

## 3. 怎麼判斷「比較接近論文」

### 3.1 把論文數值抄成 CSV

從論文 PDF 的 Table 7（MSE）、Table 8（MAE）、Table 9（MAPE）、Table 10（R²）抄出 `"1/3"` 那 10 檔的數值。
PDF 的文字複製會錯欄，**請對照 PDF 畫面逐格抄**。存成 notebook 的 `BASE` 資料夾裡的 `paper_tables.csv`（Colab 是 `MyDrive/lstm_aro_djia/`）：

```csv
ticker,model,MSE,MAE,MAPE,R2
AXP,LSTM-ARO,...,...,...,...
AXP,LSTM-GA,...,...,...,...
AXP,LSTM1D,...,...,...,...
AXP,LSTM2D,...,...,...,...
AXP,LSTM3D,...,...,...,...
AXP,ANN,...,...,...,...
BA,LSTM-ARO,...
...
```

- `model` 名稱要完全一樣：`LSTM-ARO`、`LSTM-GA`、`LSTM1D`、`LSTM2D`、`LSTM3D`、`ANN`。
- MAPE 照表格原樣抄（論文表格是比例，例如 0.024，和我們的格式相同）。
- 只跑 Step 1 的話，可以只抄 ANN 和 LSTM1D/2D/3D。

### 3.2 比較程式（在 notebook 最後**新增一格**貼上，不用改既有程式）

需要先執行過前面的格子（`cfg`、`L`、`BASE` 要存在）。

```python
import dataclasses, numpy as np, pandas as pd
from scipy.stats import spearmanr

paper = pd.read_csv(os.path.join(BASE, "paper_tables.csv")).set_index(["ticker", "model"])
rows = []
for act in ["linear", "relu"]:
    r = L.collect(dataclasses.replace(cfg, dense_activation=act))
    if r.empty:
        print(act, "沒有結果"); continue
    j = r.set_index(["ticker", "model"])[["MSE", "MAE", "MAPE", "R2"]].join(paper, rsuffix="_paper", how="inner")
    row = dict(激活=act, 比對筆數=len(j))
    for m in ["MSE", "MAE", "MAPE"]:
        lr = np.log10(j[m] / j[m + "_paper"])
        row[f"{m} 倍數差（中位數）"] = round(10 ** lr.abs().median(), 2)   # 1.0 = 和論文一樣；2.0 = 差兩倍
        row[f"{m} 偏高/偏低"] = "偏高" if lr.median() > 0 else "偏低"
    row["R2 差距（中位數）"] = round((j.R2 - j.R2_paper).abs().median(), 3)
    rho = [spearmanr(g.MSE, g.MSE_paper).correlation for _, g in j.groupby(level="ticker") if len(g) >= 3]
    row["模型名次相關（中位數）"] = round(float(np.nanmedian(rho)), 2)       # 1 = 模型優劣順序和論文完全一致
    rows.append(row)
display(pd.DataFrame(rows).set_index("激活").T)
```

### 3.3 判斷規則

| 指標 | 意思 | 越接近論文 |
|---|---|---|
| MSE / MAE / MAPE 倍數差 | 每一格和論文差幾倍，取中位數 | 越接近 1 |
| R² 差距 | 和論文 R² 的絕對差，取中位數 | 越小 |
| 模型名次相關 | 每檔股票裡各模型的好壞順序，和論文的 Spearman 相關 | 越接近 1 |

- **以 MSE 倍數差和模型名次相關為主**。兩項都由同一種激活勝出，就選它。
- 兩項結果不一致時，優先看**模型名次相關**：我們要重現的是「哪個模型比較好」，絕對數值本來就會受資料版本、未公開細節影響。
- 差距很小（例如倍數差 1.8 vs 1.9）就視為平手，**維持預設 linear**（理由：論文沒寫 = 框架預設）。

---

## 4. 注意事項

- 判斷依據只有 10 檔、每個模型 5 個 seed 的平均，屬於粗略比較；結果要在報告裡寫明「激活函數是依 `"1/3"` 與論文的接近程度選定」。
- 用論文的**測試集**結果來挑設定，本身也是看過測試集的選擇；這是為了「重現論文」而非「評估方法」，報告中要說明。
- 已知會和論文不同的地方（缺 WBA、WMT 分割、搜尋預算縮小等）兩種激活都一樣，不影響這次比較。
- 每次改 `DENSE_ACTIVATION` 都要**從第一格重新執行**；只重跑後面的格子會沿用舊設定。
- 兩種跑完後，Drive／資料夾裡會同時有 `paper_lin_...` 和 `paper_relu_...`。沒選上的那份可以保留做附錄，也可以刪除。

---

## 5. 測試結果（2026-11-20）

**結論：採用 `linear`（Keras 預設）。** `"2/3"`、`"3/3"` 本來就用 linear 在跑，不需重跑。

### 5.1 測試內容

- 股票：`"1/3"` 的 10 檔（AXP BA CVX HON JNJ MCD MSFT TRV VZ DIS）。
- 模型：只跑 Step 1（NAIVE、ANN、LSTM1D/2D/3D），每個模型 5 個 seed 取平均。
- 結果檔：
  - `results_paper_lin_t20_e20-50_s5_p10_i10_data-22650beb_shard1of3.zip`
  - `results_paper_relu_t20_e20-50_s5_p10_i10_data-22650beb_shard1of3.zip`
- 論文數值：`data/paper_tables.csv`。依 PDF 畫面逐格抄錄 Table 7–10 全部 30 檔 × 6 個模型，每格都通過 MAE ≤ √MSE 的檢查。
- 比對：10 檔 × 4 個固定模型 = 40 格。

### 5.2 與論文的接近程度

| 指標（40 格的中位數） | linear | ReLU | 判讀 |
|---|---:|---:|---|
| MSE 和論文差幾倍 | **1.37** | 3.71 | 越接近 1 越好 |
| MSE 整體偏高 | **1.14 倍** | 3.71 倍 | 越接近 1 越好 |
| MAE 和論文差幾倍 | **1.20** | 2.01 | |
| MAPE 和論文差幾倍 | **1.19** | 2.02 | |
| R² 和論文的絕對差 | **0.068** | 0.747 | 越小越好 |
| 模型名次和論文的 Spearman 相關 | 0.00（平均 0.14） | −0.20（平均 0.02） | 越接近 1 越好 |
| seed 間標準差 ÷ 平均 | **0.25** | 0.37 | 越小越穩定 |

各模型的 MSE 和論文的比值（幾何平均，> 1 表示我們較差）：

| 模型 | linear | ReLU |
|---|---:|---:|
| ANN | 1.34 | 5.31 |
| LSTM1D | 1.07 | 3.79 |
| LSTM2D | 1.07 | 3.00 |
| LSTM3D | 1.62 | 4.14 |

### 5.3 判讀

- **數值大小**：linear 和論文同一量級，LSTM1D、LSTM2D 平均只差 1.07 倍；ReLU 全面高 3～5 倍。這支持「論文用的是 Keras 預設 linear」的推論。
- **模型名次**：兩種都和論文不太一致。論文在這 10 檔中 ANN 拿第一 4 次（平均名次 2.0），linear 只有 1 次（2.6），ReLU 0 次（3.1）。依第 3.3 節的規則，名次相關兩種都接近 0，算平手，改以數值大小判斷，結果是 linear 勝出。
- **穩定度**：linear 的 seed 間波動較小。

### 5.4 附帶發現（報告可提）

NAIVE（明天 = 今天）的 MSE 比所有模型都低，也低於論文報告的 LSTM-ARO：

| 股票 | NAIVE（本實驗） | 論文 LSTM-ARO |
|---|---:|---:|
| AXP | 13.04 | 24.29 |
| BA | 21.81 | 33.66 |
| CVX | 11.01 | 23.97 |
| DIS | 6.93 | 13.96 |
| HON | 8.96 | 13.26 |
| JNJ | 3.55 | 5.70 |
| MCD | 9.69 | 20.60 |
| MSFT | 34.62 | 63.32 |
| TRV | 5.95 | 13.14 |
| VZ | 0.44 | 0.74 |

論文沒有和這個基準比較。
