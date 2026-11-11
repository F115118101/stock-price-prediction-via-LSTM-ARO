# 目前實作使用的超參數

本文件以 `results/2330.TW/search.json` 記錄的 **2330.TW 已執行實驗**為主，並參照 `lstm_aro.py` 的模型建構、搜尋空間與訓練流程。程式預設與論文模式可能不同；此處的「實際值」指該次結果檔中的設定。

## 資料與前處理

| 項目 | 實際值 | 說明 |
|---|---:|---|
| 股票 | `2330.TW` | Yahoo Finance 資料；`csv_path=null` |
| 資料期間 | `2018-01-01` 至 `2023-01-01` | `end` 為下載呼叫的結束日期 |
| 預測欄位 | `Adj Close` | 與程式預設 `Close` 不同 |
| 輸入視窗 `window` | 20 | 以前 20 筆價格預測下一筆 |
| 訓練比例 `train_ratio` | 0.8 | 按時間順序切分訓練與測試 |
| 搜尋驗證比例 `val_ratio` | 0.2 | 從訓練集尾端切出，供 GA/ARO 評估 |
| 搜尋評估集 `fitness_on` | `val` | 以驗證集 MSE 作為適應度，數值越低越好 |
| 縮放 | `MinMaxScaler` | 僅用訓練段資料擬合，再轉換全部資料 |

該次日誌記錄 1,220 筆價格，產生 960 筆訓練與 240 筆測試樣本；搜尋時訓練用 768 筆，驗證用 192 筆。

## 訓練與搜尋設定

| 項目 | 實際值 | 說明 |
|---|---:|---|
| 最大訓練回合 `epochs` | 50 | 可能由 EarlyStopping 提前結束 |
| 批次大小 `batch_size` | 32 | `model.fit` |
| EarlyStopping `patience` | 10 | 監控 `val_loss`，恢復最佳權重 |
| 搜尋族群 `pop_size` | 10 | GA 與 ARO 共用 |
| 搜尋迭代 `iterations` | 10 | GA 為 10 代，ARO 為 10 次迭代 |
| 隨機種子 `seed` | 42 | Python、NumPy、TensorFlow 與搜尋亂數產生器 |
| 損失函數 | MSE | 所有神經網路的編譯損失 |
| 搜尋適應度 | 反縮放後的驗證集 MSE | 相同架構的評估結果有快取 |

搜尋候選模型使用切出的驗證集做訓練監控；選定架構後，程式重新以完整訓練集訓練，並用訓練集尾端 10% 作為 EarlyStopping 驗證資料。固定架構基準模型也使用此 10% 的 `validation_split`。訓練時 `shuffle=True`。

## 模型架構

| 模型 | 架構與固定超參數 |
|---|---|
| `NAIVE` | 預測值等於前一筆價格；無訓練超參數 |
| `ANN` | Flatten → Dense(10, ReLU) → Dense(10, ReLU) → Dropout(0.5) → Dense(1)；Adam，學習率 `1e-3` |
| `LSTM1D` | LSTM(10) → Dense(10, ReLU) → Dropout(0.5) → Dense(1)；Adam，學習率 `1e-3` |
| `LSTM2D` | LSTM(10) → LSTM(10) → Dense(10, ReLU) → Dropout(0.5) → Dense(1)；Adam，學習率 `1e-3` |
| `LSTM3D` | LSTM(10) × 3 → Dense(10, ReLU) → Dropout(0.5) → Dense(1)；Adam，學習率 `1e-3` |
| `LSTM-GA` | 架構、Dropout、優化器、學習率由 GA 搜尋 |
| `LSTM-ARO` | 架構、Dropout、優化器、學習率由 ARO 搜尋 |

神經網路模型的輸入形狀為 `(20, 1)`；輸出層為 1 個神經元。多層 LSTM 的非最後一層設定 `return_sequences=True`。

### GA / ARO 的九維搜尋空間

| 參數 | 候選值 |
|---|---|
| 第 1 層 LSTM 神經元 | 整數 1–20 |
| 是否加入第 2 層 LSTM | 0、1 |
| 第 2 層 LSTM 神經元 | 整數 1–20；未加入時不生效 |
| 是否加入第 3 層 LSTM | 0、1 |
| 第 3 層 LSTM 神經元 | 整數 1–20；未加入時不生效 |
| Dense 神經元 | 整數 1–20 |
| Dropout | 0.3、0.4、0.5、0.6、0.7 |
| 優化器 | Adagrad、Adam、Adamax、RMSprop、SGD |
| 學習率 | `1e-2`、`1e-3`、`1e-4`、`1e-5`、`1e-6` |

搜尋向量共 9 維，連續座標限制在 `[0, 1]`，再映射到上述離散候選值。GA 的額外設定是交配率 `pc=0.8`、每維變異率 `pm=1/9`、錦標賽大小 `3`，並保留 1 個菁英；ARO 的座標界限同為 `[0, 1]`。

### 該次搜尋選出的超參數

| 模型 | LSTM 神經元 | Dense 神經元 | Dropout | 優化器 | 學習率 | 驗證集適應度（MSE） |
|---|---|---:|---:|---|---:|---:|
| `LSTM-GA` | `[16]` | 20 | 0.5 | RMSprop | 0.01 | 80.5440 |
| `LSTM-ARO` | `[2, 20]` | 20 | 0.3 | RMSprop | 0.01 | 75.0837 |

### 迭代紀錄與圖表

`results/2330.TW/search.json` 的 `LSTM-GA.history` 和 `LSTM-ARO.history` 各有 11 個數值：第 0 筆是初始族群的最佳 fitness，第 1–10 筆是每次迭代後的最佳 fitness。`run_2330.log` 也逐次輸出最佳 fitness。這些資料可用於觀察搜尋收斂，對應的靜態圖為 `results/2330.TW/convergence.png`，可播放的離線動畫為 `results/2330.TW/convergence_animation.html`。

目前沒有保存每個候選架構的 fitness、每個 epoch 的訓練/驗證 loss，也沒有逐次保存模型權重。因此圖表呈現的是**搜尋過程的最佳驗證集 MSE**，不是每次迭代完整的模型訓練結果。

## 回測設定

| 項目 | 實際值 |
|---|---:|
| 買賣手續費率 `fee_rate` | 0.001425 |
| 賣出交易稅率 `tax_rate` | 0.003 |
| 交易門檻 `trade_threshold` | 0.0 |

程式以預測漲幅大於門檻作為持有訊號；回測的 Sharpe 年化因子為 `√252`。

## 與原始論文的差異

對照 Gülmez (2023) *Stock price prediction with optimized deep LSTM network with artificial rabbits optimization algorithm*（`1-s2.0-S0957417423008485-main.pdf`）。下表比較的是**本次 2330.TW 執行紀錄**，不是程式可選的 `--paper` 模式。

| 項目 | 原始論文 | 本次實作 | 判讀 |
|---|---|---|---|
| 股票標的 | DJIA 的 30 檔成分股，各自預測（§4.1、§5） | 台積電 `2330.TW` 一檔 | 實驗對象與市場不同，結果不能直接對比 |
| 價格欄位 | 只稱「price」，未指定 `Close` 或 `Adj Close`（§4.1） | `Adj Close` | 論文欄位未明載，不能斷言兩者不同 |
| 資料期間 | 2018-01-01 至 2023-01-01（§4.1） | 相同的下載日期範圍 | 一致 |
| 輸入與切分 | 前 20 筆預測下一筆；80% 訓練、20% 測試（§4.1） | 視窗 20；80% 訓練、20% 測試 | 一致；實際交易日數因標的而異 |
| 搜尋族群與迭代 | GA、ARO 均為族群 50、迭代 50（§4.3、Table 11 前文字） | 族群 10、迭代 10 | 明確不同；搜尋預算較小 |
| 搜尋評估資料 | Fig. 2 將測試資料的預測與誤差放入 LSTM-ARO 流程；正文未另說明驗證集 | `fitness_on=val`；訓練集末段 20% 作搜尋驗證 | 評估流程不同；論文圖示暗示用測試誤差選參數，屬根據圖示的判讀 |
| 固定模型 | ANN、LSTM1D、LSTM2D、LSTM3D（Tables 1–4） | 同樣四種架構與 10 個神經元、0.5 Dropout | 架構一致；激活函數等實作細節未必相同 |
| 搜尋模型與範圍 | LSTM-GA、LSTM-ARO；Tables 5–6 的層數、神經元、Dropout、優化器、學習率候選 | 同樣兩種模型與九維候選範圍 | 搜尋空間一致；具體 GA 操作與解碼方式是本程式的選擇 |
| 比較模型 | 六種神經網路（§3.6） | 六種神經網路，加 `NAIVE` | 多了一個不訓練的基準 |
| 回測 | 以 MSE、MAE、MAPE、R² 比較預測；自動交易系統列為未來研究（§4.2、§5） | 另計交易成本、方向準確率、報酬與 Sharpe | 本程式新增的評估，不是論文重現項目 |

### 論文未明載、由程式自行決定的設定

原文 Tables 1–6 與 §4.1–4.3 沒有完整交代下列訓練細節，因此只能記錄本程式採用的值，**不應宣稱與論文相同或不同**：`MinMaxScaler` 及其擬合範圍、Dense 的 ReLU、固定模型的 Adam/`1e-3`、50 epochs、batch size 32、EarlyStopping patience 10、種子 42、GA 交配/變異/選擇方式、相同架構的適應度快取，以及選參數後的重新訓練流程。

論文 Eq. 23 將 MAPE 寫成百分比形式（乘 100），本程式 `sklearn.metrics.mean_absolute_percentage_error` 回傳比例值；因此閱讀兩者 MAPE 時須確認單位。論文表列數值的表示法與公式也可能不一致，不能只根據公式換算表格結果。

## 來源與重現說明

- 論文：Gülmez, B. (2023), *Expert Systems With Applications*, 227, 120346，DOI：[10.1016/j.eswa.2023.120346](https://doi.org/10.1016/j.eswa.2023.120346)；本資料夾的 `1-s2.0-S0957417423008485-main.pdf`。對照位置：§3.6、Tables 1–6、Fig. 2、§4.1–4.3、§5。
- 實際執行設定、GA/ARO 最佳架構：`results/2330.TW/search.json`；樣本數：`run_2330.log`；程式邏輯：`lstm_aro.py`。
- `lstm_aro.py` 的 `Config` 預設價格欄位是 `Close`，但結果檔記錄的是 `Adj Close`。`--paper` 模式另設 `fitness_on=test`、族群 50、迭代 50、`Close`，**不是本次紀錄的執行值**；其中 `Close` 也只是程式為論文模式選用的欄位，論文沒有明指該欄位。
