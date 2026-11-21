# DJIA 30 檔原始資料集重現計畫

> 用論文原始資料集（DJIA 成分股、2018-01-01～2023-01-01）重現 Gülmez (2023) 的模型比較：
> **ANN、LSTM1D、LSTM2D、LSTM3D、LSTM-GA、LSTM-ARO**，另加不需訓練的 **NAIVE** 基準。
>
> - 實作：`djia_reproduction.ipynb`（Colab 與本機 Jupyter 皆可），核心程式在 notebook 中寫出的 `djia_lib.py`。
> - 方法與公式整理見 `paper_method.md`。
> - **目前階段：照論文原始流程（不使用驗證集）**。驗證集版本保留為之後的實驗（§9）。

---

## 0. 原則

1. **論文有寫的照論文**：視窗 20、80/20 時間切分、Table 1–4 固定架構、Table 5–6 可搜尋架構與搜尋空間、GA 與 ARO 用相同族群數與迭代數、fitness 用測試集誤差（Fig. 2）。
2. **論文沒寫的用可辯護的預設值**，全部標成「自訂」（§3、§10），不聲稱與論文相同。
3. **縮小的只有運算預算**：族群 × 迭代、搜尋時的 epochs；模型結構與搜尋空間不縮。
4. **公平比較**：GA 與 ARO 用同一個 fitness 函式、同一個初始族群、相同的名目評估次數；所有模型最後都用同一套最終訓練方式與同一組 seeds。
5. **可中斷、可續跑、可分工**：每訓練完一個模型就存檔；三人分股票各自跑，最後合併。

---

## 1. 資料

### 1.1 標的

論文 Table 7 的 30 檔：

```
AXP AMGN AAPL BA CAT CSCO CVX GS HD HON IBM INTC JNJ KO JPM
MCD MMM MRK MSFT NKE PG TRV UNH CRM VZ V WBA WMT DIS DOW
```

| 標的 | 問題 | 處理 |
|---|---|---|
| **WBA** | 已下市，yfinance 抓不到 | 以 **29 檔**進行，報告註明 |
| **DOW** | 2019-03-20 才上市，955 個交易日（其他 1,259） | 照用 |
| **WMT** | 2024 年 1 拆 3，`Close` 已回溯調整，約為論文當時的 1/3 | 照用；和論文比 MSE 要 ×9、MAE ×3（MAPE、R² 不受影響） |

### 1.2 凍結資料

- 檔案：`implementation/data/djia30_2018_2022.csv`（2026-11-20 從 yfinance 下載，長格式 `date, ticker, close, adj_close`）。
- 資料指紋：`22650beb`（忽略換行格式的 md5 前 8 碼）。notebook 從 GitHub 下載這份檔，三人資料一致；指紋不同的結果不能合併。
- 價格欄位：**`Close`**（只做分割調整）。不用 `Adj Close`，因為它會隨新配息改寫歷史價格，和論文當時的數值對不上。【自訂；論文只寫 price】

### 1.3 前處理與切分（每檔各自）

| 項目 | 設定 | 來源 |
|---|---|---|
| 輸入 / 輸出 | 前 20 天收盤價 → 隔天收盤價（單變量） | 論文 |
| 輸入形狀 | `(20, 1)`：20 個時間步 × 1 個特徵（論文只寫 "Input 20"；`INPUT_LAYOUT = "features"` 可改成 1 步 × 20 特徵做對照） | 推論 |
| 切分 | 依時間前 80% 訓練、後 20% 測試 | 論文 |
| 正規化 | Min-Max 到 [0, 1]，最小/最大值只取訓練段涵蓋的價格；預測後反轉回原價格 | 自訂 |

以 1,259 個交易日的股票為例：視窗樣本 1,239 筆 → 訓練 991、測試 248。

---

## 2. 評估方式（論文模式，`USE_VALIDATION = False`）

| 階段 | 做法 |
|---|---|
| GA / ARO 搜尋 | 每個候選架構用**全部訓練資料**訓練一次，在**測試集**上算 MSE（原價格尺度）當 fitness，越小越好（論文 Fig. 2） |
| 最終模型 | 每種模型用全部訓練資料重新訓練 **5 次**（seed 42–46），每次在測試集算指標，取平均 |
| 指標 | MSE、MAE、MAPE、R²（Eq. 21–24），原價格尺度；MAPE 以**比例**表示（與論文表格的數值一致） |

> **注意**：GA / ARO 用測試集挑超參數，等於偷看了測試集，所以 LSTM-GA、LSTM-ARO 的測試成績會偏樂觀，固定架構的模型則沒有這個優勢。這是照論文流程的結果，報告中要寫明。

---

## 3. 各模型的架構與參數

### 3.1 共用訓練設定

| 項目 | 搜尋階段（GA/ARO 的候選） | 最終訓練（所有模型） | 來源 |
|---|---|---|---|
| 訓練資料 | 全部訓練集（991 筆） | 全部訓練集（991 筆） | 論文 |
| Epochs | **20**（固定，不提早停止） | **50**（固定，不提早停止） | 自訂 |
| Batch size | 32 | 32 | 自訂 |
| Loss | MSE | MSE | 自訂 |
| 每筆打亂 | 是（`shuffle=True`） | 是 | 自訂 |
| 訓練次數 | 每個架構 1 次 | 5 個 seed（42–46）取平均 | 自訂 |
| 隨機種子 | 由「股票＋架構」決定，同一架構重跑結果相同 | 42–46 | 自訂 |

論文沒有寫 epochs。最終訓練取 50；搜尋階段縮成 20，是為了讓每人在 5 小時內跑完（§4）。
batch 32、`shuffle=True`、LSTM 的 tanh / sigmoid 都是 Keras 預設值。多層 LSTM 時，除最後一層外都設 `return_sequences=True`。

**論文沒寫的地方，一律採 Keras 預設值**：作者用 Python／Keras，表格只列「層＋參數」，沒有額外設定時最可能就是框架預設。

### 3.2 固定架構模型

| 模型 | 架構（輸入 `(20, 1)`） | Optimizer / LR | 可訓練參數 |
|---|---|---|---:|
| **NAIVE** | 預測值 = 前一天收盤價 | — | 0 |
| **ANN** | Input(20) → Dense(10) → Dense(10) → Dropout(0.5) → Dense(1) | Adam / 1e-3 | 331 |
| **LSTM1D** | Input(20) → LSTM(10) → Dense(10) → Dropout(0.5) → Dense(1) | Adam / 1e-3 | 601 |
| **LSTM2D** | Input(20) → LSTM(10) → LSTM(10) → Dense(10) → Dropout(0.5) → Dense(1) | Adam / 1e-3 | 1,441 |
| **LSTM3D** | Input(20) → LSTM(10) → LSTM(10) → LSTM(10) → Dense(10) → Dropout(0.5) → Dense(1) | Adam / 1e-3 | 2,281 |

- 層的順序、神經元數、Dropout 位置與比例，與論文 Table 1–4 及 §3.6.1–3.6.4 的文字逐項一致。
- 隱藏 Dense 層：論文沒寫激活函數 → **Keras 預設 linear（無激活）**。可用 `DENSE_ACTIVATION = "relu"` 做對照實驗。
  2026-11-20 實測（50 epochs、2 seeds 平均的測試 MSE）：linear 在 3 檔 × 4 個固定模型上都比 ReLU 低 2–6 倍，
  例如 AAPL LSTM1D 54 vs 228、MSFT ANN 305 vs 949、KO LSTM2D 4.8 vs 13.9。
  論文提到 ANN 的 MAPE 僅次於 LSTM-ARO，線性 Dense 的 ANN 較符合這個描述。
  `"1/3"` 10 檔的正式比較（對照論文 Table 7–10）也是 linear 明顯較接近論文，**定案用 linear**，詳見 `relu_vs_linear_test.md` 第 5 節。
- Adam / 1e-3：論文沒寫固定架構模型的 optimizer；Adam 及其預設學習率 1e-3 是 Keras 最常見的寫法。
- NAIVE 不是論文模型，用來判斷模型有沒有勝過「明天 = 今天」。

### 3.3 可搜尋架構（LSTM-GA、LSTM-ARO，論文 Table 5–6）

```
Input(20, 1)
→ LSTM(x0)
→ LSTM(x2)            ← 只有 x1 = 1 才加入
→ LSTM(x4)            ← 只有 x3 = 1 才加入
→ Dense(x5)           ← 激活同固定架構（預設 linear）
→ Dropout(x6)
→ Dense(1)
optimizer = x7，learning rate = x8
```

| 變數 | 意義 | 候選值 |
|---|---|---|
| x0 | 第 1 層 LSTM 神經元 | 1–20 |
| x1 | 是否加第 2 層 LSTM | 0、1 |
| x2 | 第 2 層 LSTM 神經元 | 1–20 |
| x3 | 是否加第 3 層 LSTM | 0、1 |
| x4 | 第 3 層 LSTM 神經元 | 1–20 |
| x5 | Dense 神經元 | 1–20 |
| x6 | Dropout | 0.3、0.4、0.5、0.6、0.7 |
| x7 | Optimizer | Adagrad、Adam、Adamax、RMSprop、SGD |
| x8 | Learning rate | 1e-2、1e-3、1e-4、1e-5、1e-6 |

- **編碼**（自訂）：每個解是 9 維、每維在 [0, 1] 的連續向量；第 i 維解碼成「候選值清單的第 ⌊v × 候選數⌋ 個」。
- 若 x1 = 0 而 x3 = 1，第 3 層會直接接在第 1 層後面（實際為 2 層 LSTM）。
- 相同架構只訓練一次（快取），所以實際訓練次數少於名目評估次數。

### 3.4 搜尋演算法

| 參數 | LSTM-GA | LSTM-ARO | 來源 |
|---|---|---|---|
| 族群數 | **10** | **10** | 自訂（論文 50） |
| 迭代 / 世代 | **10** | **10** | 自訂（論文 50） |
| 名目評估次數（每檔） | 10 + 10 × 10 = **110** | 10 + 10 × 10 = **110** | 論文的 4.3%（2,550） |
| 預估實際訓練次數（每檔） | 約 60（重複解多，命中快取） | 約 95 | 2330.TW 實測比例 |
| 初始族群 | 在 [0, 1]⁹ 均勻抽樣，**GA 與 ARO 共用同一組** | 同左 | 自訂 |
| 搜尋 seed | `42 × 1000 + crc32(股票代號) mod 1000`；ARO 再 +1、GA 再 +2 | | 自訂 |
| 選擇 | Tournament（k = 3） | — | 自訂（論文未寫 GA 細節） |
| 交配 | Uniform crossover，機率 0.8（否則複製父代 1） | — | 自訂 |
| 突變 | 每個基因以 1/9 機率重抽 U(0, 1) | — | 自訂 |
| 菁英保留 | 1 | — | 自訂 |
| 位置更新 | — | 論文 Eq. 6–20：能量 A > 1 迂迴覓食（探索）、否則隨機躲藏（開發）；每隻兔子算完立即貪婪更新（Eq. 19）；位置裁切到 [0, 1] | 論文 |
| 隨機躲藏的 H | — | 乘上 N(0, 1)（依原始 ARO；論文 Eq. 13 印成 r₄，見 `paper_method.md` §5.3） | 原始 ARO |

搜尋結束後，取 fitness 最佳的架構，依 §3.1 的最終訓練方式訓練 5 次並評估。

---

## 4. 時間預算

### 4.1 論文本身的運算量

- ARO 30 檔合計 754,890 s（8.7 天），GA 721,660 s。每檔 50 × 51 = 2,550 次評估，平均**每次約 9.9 s**。
- 照論文 50 × 50、每個候選 50 epochs，本機 8 個 process 平行也要約 3 天；三人分工仍遠超過每人 5 小時，所以**架構與搜尋空間不變，只縮小搜尋預算**（pop × iters、搜尋時的 epochs）。
- 論文沒有寫硬體，Table 11 的時間無法拿來推回 epochs 或輸入形狀（實測兩種輸入形狀的耗時比例都對不上，見 §11）。

### 4.2 實測與預估（論文模式、pop 10 × iters 10、搜尋 20 / 最終 50 epochs、5 seeds）

| 環境 | 測量 | 一份（約 10 檔）全部模型 |
|---|---|---:|
| 筆電 i5-12500H，8 個 process 同時跑 | 搜尋候選 17.4 s/個、最終模型 29.3 s/個（負載下） | 約 **1.2 小時**（推算） |
| **Colab T4（免費）** | notebook「時間估算」那格 | **3.9 小時**（實測估算） |

筆電上 29 檔全部跑完的推算值：ARO 1.8 h、GA 1.2 h、ANN + LSTM1D/2D/3D 合計 0.5 h。

每人每份 3.9 小時，在「每種方法 5 小時內」的目標之內，也在免費 Colab 單次連線的範圍內（斷線可續跑，見 §5.2）。

---

## 5. 分工與執行

### 5.1 三人分工

以股票輪流分配（`SHARD = "k/n"` 取第 k 份 = 清單中第 k、k+n、k+2n… 檔），每人跑自己那份股票的全部 7 種模型：

| `SHARD` | 股票 | 檔數 |
|---|---|---:|
| `"1/3"` | AXP BA CVX HON JNJ MCD MSFT TRV VZ DIS | 10 |
| `"2/3"` | AMGN CAT GS IBM KO MMM NKE UNH V DOW | 10 |
| `"3/3"` | AAPL CSCO HD INTC JPM MRK PG CRM WMT | 9 |

除了 `SHARD`，其他設定三人必須一致。notebook 會印出 RUN ID（例：`paper_lin_t20_e20-50_s5_p10_i10_data-22650beb`），三人要相同。

### 5.2 存檔與續跑

- Colab 上，結果存在各自 Google Drive 的 `MyDrive/lstm_aro_djia/`。
- 搜尋時每訓練完一個候選就寫入 `candidates.jsonl`；每完成一組（股票 × 模型）就寫 `done.json`。
- 斷線後重新「全部執行」：已完成的跳過，已訓練過的候選直接讀紀錄（已實測：續跑不重訓，結果與中斷前相同）。最多損失正在訓練的那一個模型。
- 時間估算結果也有存檔，續跑時不重測。

### 5.3 合併

1. 每人執行「匯出結果」，得到 `exports/results_<RUN ID>_shard<k>of3.zip`。
2. 負責人把 zip 放進 `incoming/`，執行「合併」：設定或資料指紋不同的會被拒收，已存在的會略過。
3. 執行「彙整」產生完整 29 檔的表格。

### 5.4 輸出

```
results_djia/paper_lin_t20_e20-50_s5/
├── <TICKER>/
│   ├── NAIVE | ANN | LSTM1D | LSTM2D | LSTM3D/
│   │   ├── done.json            # 平均指標、標準差、時間、完整設定
│   │   ├── metrics_seeds.csv    # 每個 seed 的 MSE/MAE/MAPE/R²、epochs、秒數
│   │   └── predictions.csv      # 測試集實際值與 seed 平均預測
│   └── LSTM-GA_p10_i10 | LSTM-ARO_p10_i10/
│       ├── candidates.jsonl     # 每個候選架構的 fitness、epochs、秒數
│       ├── done.json            # 另含最佳架構、收斂歷史、實際訓練數、搜尋秒數
│       ├── metrics_seeds.csv
│       └── predictions.csv
└── summary_p10_i10/
    ├── table_MSE.csv  table_MAE.csv  table_MAPE.csv  table_R2.csv   # 對應論文 Table 7–10
    ├── ranking.csv      # 各指標拿第一的檔數、平均名次
    ├── time.csv         # 對應 Table 11（最終訓練時間）＋搜尋時間
    └── all_results.csv
```

---

## 6. 要回答的問題

| 問題 | 做法 |
|---|---|
| LSTM-ARO 是否在大多數股票最佳？ | 每個指標統計各模型拿第一的檔數與平均名次（論文的主張方式） |
| ARO 與 GA 差異是否顯著？ | 29 檔配對的 Wilcoxon signed-rank test（MSE） |
| 是否勝過 NAIVE？ | 同上，LSTM-ARO vs NAIVE |
| 與論文是否一致？ | 比**名次與方向**，不比絕對值。需要把論文 Table 7–10 抄成 CSV（尚未做，見 §8） |
| seed 變異多大？ | `metrics_seeds.csv` 的 5 個 seed 標準差 |

---

## 7. 已知限制（報告中要寫）

1. **測試集洩漏**：照論文流程，GA / ARO 用測試集誤差挑架構，測試成績偏樂觀。
2. 搜尋預算約為論文的 **4.3%**（110 vs 2,550 次評估），搜尋時只訓練 20 epochs，對低學習率（1e-5、1e-6）或收斂慢的 optimizer 不利。
3. 每個候選只訓練一次，fitness 有隨機雜訊；ARO 的貪婪更新可能留下「運氣好」的解。
4. 每檔只跑一次搜尋，沒有量化 GA / ARO 本身的變異。
5. 資料差異：缺 WBA；DOW 較短；WMT 需換算；論文未說明價格欄位、正規化、epochs、batch、optimizer 等細節。
6. 固定 epochs、不提早停止（照論文的推測流程），部分模型可能過擬合或欠擬合。

---

## 8. 待辦

1. ~~三人各跑一份 → 合併 → 彙整~~：已完成（2026-11-21），結果與分析見 `djia_results.md`。
2. ~~把論文 Table 7–10 抄成 `data/paper_tables.csv`~~：已完成（30 檔 × 6 模型，2026-11-20）。彙整時加上與本實驗名次的對照。
3. 視需要調整 `ITERATIONS`：時間估算那格會給出 5 小時內 ARO 可用的最大迭代數。調整時三人必須一起改。

---

## 9. 之後的實驗：驗證集版本（`USE_VALIDATION = True`）

不偷看測試集的版本，用來說明論文流程的洩漏影響。結果會存在另一個資料夾（`val_...`），不會和論文模式混在一起。

| 項目 | 論文模式（目前） | 驗證集版本（之後） |
|---|---|---|
| 搜尋時訓練資料 | 全部訓練集 991 筆 | 訓練集前 80%（793 筆） |
| fitness | 測試集 MSE | 訓練集尾端 20%（198 筆）的 MSE |
| 搜尋時訓練 | 固定 20 epochs | 最多 20 epochs，early stopping patience 5（監控驗證集） |
| 最終訓練 | 固定 50 epochs | 最多 50 epochs，early stopping patience 10（取訓練集尾端 10% 監控），還原最佳權重 |
| 測試集 | 搜尋與最終評估都用 | 只在最終評估用一次 |

時間與論文模式相近（early stopping 可能略短）。

---

## 10. 參數總表

| 類別 | 參數 | 值 | 來源 |
|---|---|---|---|
| 資料 | 標的 | DJIA 29 檔（WBA 已下市） | 論文 |
| | 期間 | 2018-01-01 ～ 2023-01-01 | 論文 |
| | 價格欄位 | Close（分割調整） | 自訂 |
| | 視窗 | 20 | 論文 |
| | 切分 | 80% 訓練 / 20% 測試，時間順序 | 論文 |
| | 正規化 | Min-Max，只用訓練段 | 自訂 |
| 評估 | fitness | 測試集 MSE（原價格） | 論文 Fig. 2 |
| | 指標 | MSE、MAE、MAPE（比例）、R²，原價格尺度 | 論文 |
| 固定模型 | 架構 | Table 1–4（§3.2） | 論文 |
| | Dense 激活 | linear（Keras 預設） | 推論（論文未寫） |
| | Optimizer / LR | Adam / 1e-3 | 自訂 |
| 搜尋 | 架構與搜尋空間 | Table 5–6（§3.3） | 論文 |
| | 族群 × 迭代 | 10 × 10（GA、ARO 相同） | 自訂（論文 50 × 50） |
| | 搜尋時 epochs | 20，固定 | 自訂 |
| | GA 運算子 | tournament 3、uniform crossover 0.8、mutation 1/9、菁英 1 | 自訂 |
| | ARO | Eq. 6–20，H 乘 N(0, 1) | 論文／原始 ARO |
| 最終訓練 | epochs | 50，固定 | 自訂 |
| | batch | 32 | 自訂 |
| | seeds | 5（42–46），取平均 | 自訂 |
| 執行 | 分工 | 3 份，依股票輪流分配 | — |
| | 平行 | 自動：Colab 2 個 process；16 執行緒的筆電 8 個 | 實測 |

---

## 11. 與論文逐項核對

依論文 §3.5–4.3、Table 1–11、Fig. 2 逐項比對。「推論」= 論文沒寫，採最可能的做法；「縮小」= 為了時間刻意偏離。

| 項目 | 論文原文 | 本實驗 | 狀態 |
|---|---|---|---|
| 資料來源 / 期間 | Yahoo Finance，2018.01.01–2023.01.01，DJIA 30 檔 | 同；凍結於 2026-11-20 下載 | 一致（缺 WBA） |
| 視窗 / 輸出 | 前 20 天價格 → 隔天價格 | 同 | 一致 |
| 切分 | 80% 訓練、20% 測試 | 同，依時間順序 | 一致 |
| ANN | Input 20 → Dense 10 → Dense 10 → Dropout 0.5 → Dense 1（Table 1） | 同 | 一致 |
| LSTM1D | Input 20 → LSTM 10 → Dense 10 → Dropout 0.5 → Dense 1（Table 2） | 同 | 一致 |
| LSTM2D | Input 20 → LSTM 10 → LSTM 10 → Dense 10 → Dropout 0.5 → Dense 1（Table 3） | 同 | 一致 |
| LSTM3D | Input 20 → LSTM 10 ×3 → Dense 10 → Dropout 0.5 → Dense 1（Table 4） | 同 | 一致 |
| LSTM-GA / ARO 架構 | Input 20 → LSTM x0 → LSTM(x1) x2 → LSTM(x3) x4 → Dense x5 → Dropout x6 → Dense 1，另搜 optimizer、LR（Table 5） | 同 | 一致 |
| 搜尋空間 | 神經元 1–20、層 0/1、Dropout 0.3–0.7、5 種 optimizer、LR 1e-2–1e-6（Table 6） | 同 | 一致 |
| ARO 公式 | Eq. 6–20 | 同；Eq. 13 的 r₄ 依原始 ARO 用 N(0,1)（論文同時列出未使用的 n₂） | 一致（一處勘誤） |
| fitness | 訓練 → 預測測試集 → 算誤差（Fig. 2） | 測試集 MSE | 一致 |
| GA 與 ARO 預算 | 都是族群 50 × 迭代 50 | 都是 10 × 10 | **縮小**（相同預算比較的原則不變） |
| 指標 | MSE、MAE、MAPE、R²（Eq. 21–24），表格 MAPE 為比例 | 同，原價格尺度 | 一致 |
| Dense 激活 | 未寫 | Keras 預設 linear | 推論 |
| 輸入形狀 | 只寫 "Input 20" | 20 步 × 1 特徵 | 推論（可切換） |
| 固定模型 optimizer / LR | 未寫 | Adam / 1e-3 | 推論 |
| Epochs | 未寫 | 搜尋 20、最終 50 | 推論＋**縮小** |
| Batch / shuffle | 未寫 | 32 / 是（Keras 預設） | 推論 |
| Loss | 未寫 | MSE | 推論 |
| 正規化 | 未寫 | Min-Max（只用訓練段） | 推論 |
| 價格欄位 | 只寫 price | Close | 推論 |
| GA 運算子 | 只說有 selection、crossover、mutation | tournament 3、uniform 0.8、mutation 1/9、菁英 1 | 推論 |
| 解的編碼 | 未寫 | 9 維連續 [0,1] → 離散值 | 推論 |
| 重複訓練 | 未寫（看起來每個模型訓練一次） | 最終模型 5 seeds 取平均 | 自訂（降低隨機性，不影響架構） |
| NAIVE 基準 | 無 | 額外加入 | 額外 |
