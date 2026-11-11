# LSTM × ARO 互動式論文簡報

這個靜態網站逐頁呈現原始 PPTX 的 39 張投影片，並加入鍵盤切頁、頁面總覽和延伸教材。網站檔案位於 `docs/`，不需要建置工具或後端。

## 本機預覽

在專案根目錄執行：

```powershell
node serve.mjs
```

開啟 `http://127.0.0.1:4173`。直接以 `file://` 開啟 `index.html` 時，瀏覽器可能阻擋 `slides.json` 載入。

## 操作

- `←` / `→` 或滑鼠滾輪：切換上一頁／下一頁。
- 點擊或拖曳下方進度條：跳到對應頁面。
- 點選投影片標題：查看該頁概念總覽；點選公式、指標或架構元件：開啟對應的動態演算與拆解。
- 拖動教材中的 slider：即時更新公式代入值、結果與圖表；有圖表時桌面版會將圖與控制項並排。
- 實驗結果頁的「論文數據」可查看 Table 7、10、11 的原值摘錄與逐股差值。
- 「全部頁面」：直接跳到指定投影片。
- 手機版可左右滑動投影片切頁。

互動示例是教學用計算器，不會訓練模型或取得即時股價。論文數字與原簡報內容保留在對應頁面；來源側欄連到期刊 DOI。

## 發布到 GitHub Pages

將整個專案推送到 GitHub repository。在 repository 的 **Settings → Pages → Build and deployment**，選擇 **Deploy from a branch**，分支選 `main`、資料夾選 `/docs`，再儲存。此專案使用相對路徑，也適用於 `username.github.io/repository-name/`。

## 更新 PPT 後重新抽取

以相同檔名替換根目錄的 PPTX，執行：

```powershell
powershell -ExecutionPolicy Bypass -File .\extract-slides.ps1
```

此腳本會重建 `docs/slides.json` 與 `docs/assets/` 中的投影片圖片。若投影片數量有變，請同步檢查 `extract-slides.ps1` 的頁數迴圈，以及網頁中的頁數文字。
