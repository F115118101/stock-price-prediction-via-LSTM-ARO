# DJIA 30 檔原始資料集重現計畫（架構與超參數）

> 目標：用論文原始資料集（DJIA 30 檔、2018-01-01～2023-01-01）重現 Gülmez (2023) 的六種模型比較，
> 並補上論文沒寫的超參數。**每一種方法的總執行時間控制在約 5 小時內**（本機：i5-12500H 12C/16T、TF 2.9 CPU）。
>
> 方法與搜尋空間見 `paper_method.md`；既有程式為 `lstm_aro.py`。本文件只定義「要怎麼跑」，程式修改列在 §8。
>
> **實作：`djia_reproduction.ipynb`（Colab / 本機 Jupyter 皆可）。** 與本文件的差異：notebook 預設**照論文**
> （`USE_VALIDATION = False`：fitness 用測試集 MSE、固定 epochs 不做 early stopping；搜尋 20 epochs、最終 50 epochs、5 seeds、pop 10 × iters 10）。
> 設 `USE_VALIDATION = True` 即為本文件 §2 的驗證集協定。迭代數請依 notebook「時間估算」那格的建議調整。
>
> **多人分工**：以股票分份（`SHARD = "k/n"`，輪流分配），每人跑自己那份股票的全部 7 種模型，跑完匯出 zip 給負責人合併。
> 所有人從 GitHub 下載同一份凍結資料 `implementation/data/djia30_2018_2022.csv`。notebook 會顯示 RUN ID（設定＋資料指紋），合併時不一致的結果會被拒收。
> 結果逐筆存在 Google Drive：每個候選模型訓練完就寫入 `candidates.jsonl`，每個（股票 × 模型）完成就寫 `done.json`；斷線後重新「全部執行」即可接著跑。

---

## 0. 原則

1. **論文有寫的照論文**：視窗 20、80/20 時間切分、Table 1–4 固定架構、Table 6 搜尋空間、GA 與 ARO 用相同族群數/迭代數。
2. **論文沒寫的用可辯護的預設值**，並全部列在 §9 參數總表；不聲稱與論文相同。
3. **縮小的只有搜尋預算**（族群 × 迭代、搜尋時的 epoch 上限），模型結構與搜尋空間不縮。
4. **公平比較**：GA 與 ARO 用同一個 fitness 函式、同一個初始族群、同樣的名目評估次數；所有模型最終都用同一套「最終訓練協定」與同一組 seeds 評估。
5. **可中斷、可續跑**：筆電跑 5 小時，任何一檔股票做完就落地存檔。

---

## 1. 資料集

### 1.1 標的（論文 Table 7 的 30 檔）

```
AXP AMGN AAPL BA CAT CSCO CVX GS HD HON IBM INTC JNJ KO JPM
MCD MMM MRK MSFT NKE PG TRV UNH CRM VZ V WBA WMT DIS DOW
```

### 1.2 已確認的資料問題（2026-11-18 以 yfinance 實測）

| 標的 | 問題 | 處理方式 |
|---|---|---|
| **WBA** | 已下市，yfinance 回傳 0 筆 | 先找替代來源（Stooq、學校資料庫、別人存的 CSV）；找不到就 **29 檔**並在報告註明 |
| **DOW** | 2019-03-20 才上市，只有 955 天（其他 1,259 天） | 照用，樣本較少；報告註明 |
| **WMT** | 2024-02 進行 1:3 分割，現在下載的 `Close` 已回溯調整，約為論文當時的 1/3 | 照用調整後價格；和論文比 MSE 時 **×9**（MAE ×3），MAPE、R² 不受影響 |

### 1.3 欄位與快照

- 欄位：**`Close`**（yfinance `auto_adjust=False`，只做分割調整）。
  不用 `Adj Close`：它會隨每次新配息改寫歷史價格，現在下載的數值和論文當時不同，MSE 無法對照。
  （注意：先前 2330.TW 那次跑的是 `Adj Close`，DJIA 這次改用 `Close`。）
- 下載一次後凍結成 `data/djia30_2018_2022.csv`（長格式：date, ticker, close, adj_close），並記錄下載日期；之後所有實驗只讀這個檔，不再連網。

### 1.4 切分（每檔各自）

以一般 1,259 個交易日的股票為例：

| 段落 | 用途 | 樣本數 |
|---|---|---:|
| 全部視窗樣本 | `len − 20` | 1,239 |
| Train（前 80%） | 最終模型訓練 | 991 |
| └ Search-fit（train 前 80%） | 搜尋時訓練候選模型 | 793 |
| └ Search-val（train 後 20%） | 搜尋時算 fitness ＋ early stopping | 198 |
| Test（後 20%） | **只在最後評估用一次** | 248 |

- 正規化：`MinMaxScaler` 只用 Train 段涵蓋的價格 fit，評估時反轉回原價格。
- 指標都在**原始價格尺度**計算；MAPE 回報**比例**（與論文表格的數值格式一致）。

---

## 2. 評估協定

### 2.1 搜尋階段的 fitness（GA / ARO 共用）

- fitness = 候選模型在 **Search-val** 上的 MSE（原價格尺度），越小越好。
- 每個候選只訓練一次（論文也是一次，見 §4.1 推算）；相同架構有快取，不重訓。
- **主實驗用 `fitness_on=val`**。論文 Fig. 2 是用 test 誤差挑超參數，等於偷看測試集；
  若要對照論文的偏樂觀數字，另外跑一輪 `fitness_on=test`（各需約 4 小時，列為選配，見 §10）。

### 2.2 最終訓練協定（全部模型共用）

| 項目 | 設定 | 理由 |
|---|---|---|
| 訓練資料 | 整個 Train（991 筆） | 搜尋完就用全部訓練資料 |
| Early stopping | 取 Train 尾端 10% 監控 `val_loss`，patience 10，還原最佳權重 | 避免固定 epoch 造成過擬合或欠擬合 |
| 最大 epochs | 100 | 由 early stopping 決定實際長度 |
| Batch size | 32 | Keras 預設；論文 Table 11 的時間與「batch 32、約 50 epochs」吻合 |
| Loss | MSE | |
| **Seeds** | **10 個（0–9）** | 2330.TW 先前結果顯示單次重訓的變異很大（ARO 驗證 MSE 75 → 測試 914） |
| 回報 | 每檔：10 seeds 的平均 ± 標準差（另存中位數） | |

---

## 3. 各模型設定

| 模型 | 架構 | Optimizer / LR | 需搜尋 |
|---|---|---|---|
| NAIVE（額外加入） | 預測值 = 前一日價格 | — | 否 |
| ANN | Flatten → Dense(10, ReLU) → Dense(10, ReLU) → Dropout(0.5) → Dense(1) | Adam / 1e-3 | 否 |
| LSTM1D | LSTM(10) → Dense(10, ReLU) → Dropout(0.5) → Dense(1) | Adam / 1e-3 | 否 |
| LSTM2D | LSTM(10) ×2 → Dense(10, ReLU) → Dropout(0.5) → Dense(1) | Adam / 1e-3 | 否 |
| LSTM3D | LSTM(10) ×3 → Dense(10, ReLU) → Dropout(0.5) → Dense(1) | Adam / 1e-3 | 否 |
| LSTM-GA | Table 5 可變架構 | 搜尋 | GA |
| LSTM-ARO | Table 5 可變架構 | 搜尋 | ARO |

- NAIVE 不是論文模型，但它是判斷「模型有沒有學到東西」的基準（2330.TW 上 NAIVE 贏過所有模型）。不需訓練，成本為 0。
- 搜尋空間完全照 Table 6（9 維，每維連續 `[0,1]` 再解碼成離散值），不刪減選項。

### 3.1 搜尋演算法參數

| 參數 | GA | ARO |
|---|---|---|
| 族群數 | **20** | **20** |
| 迭代 / 世代 | **12** | **12** |
| 名目評估次數 | 20 + 20×12 = **260** | 20 + 20×12 = **260** |
| 初始族群 | **與 ARO 相同**（同一 seed 產生） | 同左 |
| 其他 | tournament k=3、uniform crossover p=0.8、每維 mutation 1/9、菁英 1 | Eq. 6–20 原式；H 乘 N(0,1)（見 `paper_method.md` §5.3） |
| 搜尋 seed | 每檔 `1000 + ticker_index` | 同左 |

搜尋階段候選模型的訓練設定（低成本版本）：

| 項目 | 搜尋階段 | 最終訓練 |
|---|---|---|
| 最大 epochs | **30** | 100 |
| Early stopping patience | **5**（監控 Search-val） | 10 |
| Batch | 32 | 32 |
| 每個候選訓練次數 | 1 | 10 seeds |

---

## 4. 時間預算推導

### 4.1 論文本身的算力

- ARO 30 檔合計 754,890 s（8.74 天），GA 721,660 s。
- 每檔 50×(50+1) = 2,550 次評估 → **每次評估約 9.9 s**。
- Table 11 最終模型的單次訓練時間：LSTM1D 8.3 s、LSTM2D 12.5 s、LSTM3D 16.7 s、ANN 4.5 s。

### 4.2 本機實測（2026-11-18，合成 1,259 天資料，793/198 切分）

| 架構 | 單一 process，50 epochs 實際耗時 | 每 epoch |
|---|---:|---:|
| LSTM [10] | 3.5 s（18 ep 提早停） | ~0.19 s |
| LSTM [10,10] | 12.2 s（跑滿 50 ep，lr 1e-5） | ~0.24 s |
| LSTM [20,20,20] | 9.4 s（20 ep 提早停） | ~0.47 s |

- intra-op threads 2 或 16 速度幾乎一樣 → 小模型吃不滿 CPU，**應該多 process 平行跑**。
- 平行 6 個 process：吞吐量約 2.7 倍；8 個 process：約 2.9 倍（筆電散熱限制）。**估算取 2.8 倍。**
- 本機與論文硬體速度相近（LSTM2D 跑滿 50 epochs ≈ 12 s，論文 12.5 s），所以完全照論文 50×50 單機約需 8.7 天 / 2.8 ≈ **3 天**，不可行。
- GPU：TF 2.9 在 Windows 原生環境沒有偵測到 RTX 3050（未裝 CUDA 11.2 / cuDNN 8.1）。這種 batch 32、20 步的小 LSTM 用 GPU 也快不了多少，**不處理 GPU**。

### 4.3 搜尋成本估算

```
每檔實際訓練次數 U ≈ 名目評估數 × 不重複率
每次訓練時間 t   ≈ 6 s（30 epoch 上限；約 40% 候選是 lr 1e-5/1e-6 或 SGD/Adagrad，會跑滿）
總時間 ≈ U × t × 30 檔 / 2.8（平行加速）
```

| 方法 | 不重複率（2330.TW 實測） | U | 搜尋 | 最終 10 seeds | **合計** |
|---|---:|---:|---:|---:|---:|
| LSTM-ARO | ~87% | ~225 | ~4.0 h | ~0.1 h | **≈ 4.1 h** |
| LSTM-GA | ~47–60% | ~140 | ~2.5 h | ~0.1 h | **≈ 2.6 h** |

GA 比較快，是因為它常產生重複解（菁英、交配）而吃到快取。兩者的**名目評估次數相同**，公平定義與論文一致（都用 50/50）。
若想讓 GA 也用滿時間，可改用「相同不重複訓練次數」當停止條件，列為選配。

### 4.4 固定架構模型

每檔 10 seeds × 30 檔 = 300 次最終訓練：

| 模型 | 單次（ES 約 20–30 ep） | 單 process 總計 | 平行後 |
|---|---:|---:|---:|
| ANN | ~2 s | 10 min | **~4 min** |
| LSTM1D | ~4 s | 20 min | **~7 min** |
| LSTM2D | ~7 s | 35 min | **~13 min** |
| LSTM3D | ~10 s | 50 min | **~18 min** |

四個合計不到 1 小時，遠低於 5 小時。多出的時間不需要用掉；10 seeds 已足以看出變異。

### 4.5 校正（pilot run，正式跑之前必做）

1. 用 8 個 worker 跑 8 檔，`--iters 2`（約 60 次評估/檔），記錄負載下每次訓練的平均時間 `t_load`。
2. 預估 ARO 總時數 = `t_load × 225 × ceil(30/8) / 3600`。
3. 依結果調整迭代數，族群固定 20：

| 預估 ARO 總時數 | 動作 |
|---|---|
| > 4.5 h | iters 改 **10**（220 次評估） |
| 3–4.5 h | 維持 **12**（260 次） |
| < 3 h | iters 改 **15**（320 次） |

GA 一律跟著 ARO 用同樣的 pop/iters。

---

## 5. 平行化與執行流程

### 5.1 平行方式

- **以股票為單位平行**：一個 worker process 負責一檔股票的整個搜尋 → 最終訓練，互不溝通，最簡單也最穩。
- `--workers 8`，每個 process `intra_op = inter_op = 2` threads。若筆電降頻嚴重，改 6。
- 30 檔 ÷ 8 = 4 輪；長的股票先排（DOW 樣本少，放最後）。
- 執行時插電、Windows 電源設為「最佳效能」、關掉其他重負載程式。

### 5.2 執行順序

```
Step 0  下載並凍結資料 → data/djia30_2018_2022.csv               (~1 min)
Step 1  NAIVE + ANN + LSTM1D + LSTM2D + LSTM3D（10 seeds）        (~45 min)
Step 2  Pilot：ARO iters=2 跑 8 檔 → 依 §4.5 決定 iters          (~15 min)
Step 3  LSTM-GA  搜尋 + 最終 10 seeds                               (~2.6 h)
Step 4  LSTM-ARO 搜尋 + 最終 10 seeds                               (~4.1 h)
Step 5  彙整：產生對照論文 Table 7–11 的表格與圖                   (~1 min)
```

Step 3、4 可各自在晚上跑。全部合計約 8 小時。

### 5.3 續跑

- 每檔做完寫 `results/djia/<TICKER>/<MODEL>/done.json`；重跑時已完成的跳過。
- 搜尋中的每次評估都追加到 `candidates.jsonl`（含架構、fitness、實際 epochs、秒數）。中斷後重跑會先讀回快取，不重訓已評估過的架構（同 seed 下 ARO/GA 軌跡可重現）。

---

## 6. 輸出

```
results/djia/
├── <TICKER>/
│   ├── NAIVE|ANN|LSTM1D|LSTM2D|LSTM3D/metrics_seeds.csv   # 每 seed 的 MSE/MAE/MAPE/R²/秒數
│   ├── LSTM-GA|LSTM-ARO/
│   │   ├── candidates.jsonl      # 每次評估
│   │   ├── search.json           # 最佳架構、收斂歷史、不重複訓練數、搜尋秒數
│   │   └── metrics_seeds.csv
│   └── predictions.csv           # 各模型 seed 平均的測試集預測
├── table7_mse.csv  table8_mae.csv  table9_mape.csv  table10_r2.csv
├── table11_time.csv              # 搜尋時間 + 最終訓練時間（分開列）
├── vs_paper.csv                  # 與論文數值並列
└── summary.md
```

### 6.1 要回答的問題

| 問題 | 做法 |
|---|---|
| ARO 是否在大多數股票最佳？ | 每個指標統計各模型「第一名的檔數」與平均名次（論文的主張方式） |
| ARO 與 GA 差異是否顯著？ | 30 檔配對的 Wilcoxon signed-rank test（MSE） |
| 是否贏過 NAIVE？ | 同上，LSTM-ARO vs NAIVE |
| 與論文是否一致？ | 只比**名次與方向**，不比絕對值；把論文 Table 7–10 手動抄成 `data/paper_tables.csv`（PDF 文字抽取欄位錯亂，`docs/paper-data.js` 只抄了 5 檔，需補全並核對） |
| 種子變異有多大？ | 每檔每模型 10 seeds 的標準差；挑 3 檔畫箱形圖 |

---

## 7. 已知限制（報告中要寫）

1. 搜尋預算約為論文的 **10%**（260 vs 2,550 次評估），且搜尋時 epoch 上限 30 → 偏好收斂快的設定（lr 1e-2/1e-3），對 lr 1e-5、1e-6 的候選不利。
2. 每個候選只訓練一次，fitness 有雜訊；ARO 的貪婪更新可能保留「運氣好」的解。
3. 每檔只跑**一次**搜尋（一個搜尋 seed）；metaheuristic 自身的變異沒有量化。
4. Search-val 同時用於 early stopping 和 fitness，有輕微選擇偏差（但不碰 test）。
5. 資料差異：WBA 可能缺；DOW 較短；WMT 需換算；論文未說明的欄位與正規化方式可能和本實驗不同。

---

## 8. 需要修改的程式（`lstm_aro.py`）

| # | 修改 | 說明 |
|---|---|---|
| 1 | `--tickers djia30` 預設清單＋`--data data/djia30_2018_2022.csv` | 下載一次、之後離線讀長格式 CSV |
| 2 | 拆分訓練設定：`search_epochs / search_patience` 與 `final_epochs / final_patience` | 目前共用 `epochs=50, patience=10` |
| 3 | `--final-seeds 10`：所有模型（含 baseline）用同一組 seeds 重訓並存每個 seed 的指標 | 目前每個模型只訓練一次 |
| 4 | `--workers N --threads 2`：以股票為單位的 `multiprocessing.Pool`（spawn） | 每個 worker 內設定 TF threads、`clear_session` |
| 5 | GA 與 ARO 共用初始族群 | 目前兩者各自從 rng 抽 |
| 6 | `candidates.jsonl` 紀錄＋啟動時載回快取；`done.json` 續跑 | |
| 7 | `--models` 可單獨跑某一種方法（例如只跑 `LSTM-ARO`） | 已有 `models` 欄位，補 CLI 與輸出路徑 |
| 8 | 新增 `aggregate.py`：產生 Table 7–11 對照表、名次統計、Wilcoxon、`vs_paper.csv` | 需要 `scipy` |
| 9 | 每檔股票的回測（台股成本）在 DJIA 實驗**關閉** | 論文沒有回測，且費率是台股的 |

---

## 9. 參數總表

| 類別 | 參數 | 值 | 來源 |
|---|---|---|---|
| 資料 | 標的 | DJIA 30 檔（WBA 待確認） | 論文 |
| | 期間 | 2018-01-01 ～ 2023-01-01 | 論文 |
| | 欄位 | Close（分割調整） | **自訂** |
| | 視窗 | 20 | 論文 |
| | Train / Test | 80% / 20%，時間順序 | 論文 |
| | Search-val | Train 尾端 20% | **自訂** |
| | 正規化 | MinMax，只 fit Train 段 | **自訂** |
| 固定模型 | 架構 | Table 1–4 | 論文 |
| | Dense 激活 | ReLU | **自訂** |
| | Optimizer / LR | Adam / 1e-3 | **自訂** |
| 搜尋 | 搜尋空間 | Table 6 | 論文 |
| | 族群 × 迭代 | 20 × 12（依 pilot 調為 10–15） | **自訂**（論文 50 × 50） |
| | fitness | Search-val MSE（原價格） | **自訂**（論文用 test） |
| | 搜尋時 epochs / patience | 30 / 5 | **自訂** |
| | GA 運算子 | tournament 3、uniform crossover 0.8、mutation 1/9、菁英 1 | **自訂** |
| 最終訓練 | epochs / patience | 100 / 10（ES 用 Train 尾端 10%） | **自訂** |
| | batch | 32 | **自訂**（與 Table 11 時間吻合） |
| | seeds | 10 | **自訂** |
| 評估 | 指標 | MSE、MAE、MAPE（比例）、R²，原價格尺度 | 論文 |
| 執行 | workers × threads | 8 × 2 | 本機實測 |

---

## 10. 待確認

1. **fitness 用 val 還是 test？** 本計畫主實驗用 val（不洩漏）。若希望數字盡量貼近論文，可再各花約 4 小時跑一輪 `fitness_on=test`，兩者並列也能說明資料洩漏的影響。
2. **WBA 的替代來源**：沒有就以 29 檔進行。
3. 是否接受「GA 名目評估數相同但實際訓練較少」的公平定義（§4.3）。
