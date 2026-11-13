# LSTM-ARO 論文互動簡報系統

這個網站以互動式投影片介紹 Burak Gülmez 的論文 *Stock price prediction with optimized deep LSTM network with artificial rabbits optimization algorithm*。內容涵蓋 LSTM 股價預測模型、人工兔子最佳化演算法（ARO）、超參數搜尋，以及論文中的模型比較與實證結果。

論文來源：Gülmez, B. (2023), *Expert Systems With Applications*, 227, 120346，[DOI: 10.1016/j.eswa.2023.120346](https://doi.org/10.1016/j.eswa.2023.120346)。依 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 授權分享。

---

## 簡報架構與分工修改方式

為方便團隊成員協作，HTML 只有唯一的 `docs/index.html`，投影片內容依頂部橫條顏色（Phase 階段）拆為 3 個獨立的 JS 資料檔：

| 階段與頂條顏色 | 涵蓋投影片 | 投影片資料檔（直接修改文字即可） | 負責內容重點 |
| :--- | :---: | :--- | :--- |
| 🟣 **紫色** (`#59317b`) | **第 1–11 頁** | `docs/slides-part1.js` | 研究動機、20 日滑動視窗、LSTM 門控核心、對照模型 |
| 🔴 **桃紅** (`#8b2d58`) | **第 12–19 頁** | `docs/slides-part2.js` | GA 基準比較、ARO 繞路/躲藏/能量公式、超參數搜尋空間與流程 |
| 🟢 **綠色** (`#38602a`) | **第 20–27 頁** | `docs/slides-part3.js` | MSE/MAE/MAPE/R² 指標、30 檔股票成果、計算成本、討論與結論 |


> 每張投影片資料裡的 `"number"` 是**固定的內部編號**（程式用它對應版面與互動教材），**不是頁碼**；頁碼依投影片在檔案中的順序自動計算。合併頁面後編號會跳號（例如 part1 沒有 6、8、13），屬正常現象，新增或刪除投影片時不要改動既有編號。

---

## 如何修改投影片內容？

1. **各自分工修改**：
   - 負責第 1 部分的人只需打開 `docs/slides-part1.js`；負責第 2 部分的人打開 `docs/slides-part2.js`；負責第 3 部分的人打開 `docs/slides-part3.js`。
   - 檔案內已做標準 JSON 排版縮排，搜尋對應投影片文字直接替換即可。
2. **預覽簡報**：
   - 直接用瀏覽器開啟 `docs/index.html`，網頁會自動載入並合併三份檔案，任何人修改後重新整理網頁即可看到最新成果。
3. **Learning Lab 動態演算教學**：
   - 點擊投影片任一文字或圖解，右側抽屜（Learning Lab）將自動開啟概念拆解與公式演算。
   - 公式中的未知符號（如 $f_t, C_{t-1}, x_j(t), R, A(t)$ 等）與滑桿控制項採用一致的色碼標示，帶入數值以粗體突顯。
