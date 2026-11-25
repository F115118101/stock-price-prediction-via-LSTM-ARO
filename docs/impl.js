// 實作簡報：控制器 + 投影片內容 + Learning Lab。
// 外框、工具列、進度條、全部頁面、抽屜的 DOM 與 CSS 和 index.html 相同；切換頁面不做動畫。
// 程式碼一律從 impl-code.js（由 notebook 逐字擷取）讀取；投影片上的程式碼是節錄，抽屜「程式碼」分頁顯示完整函式。
(() => {
const $ = s => document.querySelector(s);
const CODE = window.IMPL_CODE || {};
const REPO = 'https://github.com/F115118101/stock-price-prediction-via-LSTM-ARO/blob/main/implementation/';
const NB = REPO + 'djia_reproduction.ipynb';
const COLAB = 'https://colab.research.google.com/github/F115118101/stock-price-prediction-via-LSTM-ARO/blob/main/implementation/djia_reproduction.ipynb';
const SRC = {
  nb: `<a class="source-link" href="${NB}" target="_blank" rel="noopener">djia_reproduction.ipynb（notebook）↗</a>`,
  results: `<a class="source-link" href="${REPO}djia_results.md" target="_blank" rel="noopener">djia_results.md（完整結果與分析）↗</a>`,
  plan: `<a class="source-link" href="${REPO}reproduction_plan.md" target="_blank" rel="noopener">reproduction_plan.md（重現計畫）↗</a>`,
  paper: `<a class="source-link" href="https://doi.org/10.1016/j.eswa.2023.120346" target="_blank" rel="noopener">Gülmez (2023), ESWA 227, 120346 ↗</a>`,
  relu: `<a class="source-link" href="${REPO}relu_vs_linear_test.md" target="_blank" rel="noopener">relu_vs_linear_test.md（Dense 激活測試）↗</a>`,
};

// ---------------------------------------------------------------- Python 語法上色
const KW = 'def|class|return|if|elif|else|for|while|in|not|and|or|is|None|True|False|import|from|as|with|try|except|lambda|raise|continue|pass|global|self';
const BI = 'len|range|int|float|min|max|round|list|dict|zip|enumerate|open|sum|abs|getattr|isinstance|print|str|bool|sorted|set';
const TOK = new RegExp(String.raw`(#[^\n]*)|("""[\s\S]*?"""|f?"(?:\\.|[^"\\\n])*"|f?'(?:\\.|[^'\\\n])*')|\b(\d[\d_]*(?:\.\d+)?(?:e-?\d+)?)\b|\b(${KW})\b|\b(${BI})(?=\()|(@\w+)|\b([A-Za-z_]\w*)\b`, 'g');
const esc = s => s.replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

// 縮寫對照（impl-glossary.js）：函式內的 local 表優先於 global 表
const GL = window.IMPL_GLOSSARY || {global: {}, local: {}, alias: {}};
function glossCtx(code, name) {
  const fn = (name && GL.local[name]) ? name : (code.match(/^\s*(?:def|class)\s+(\w+)/m) || [])[1];
  return GL.local[GL.alias[fn] || fn] || {};
}
const glossOf = (id, local) => local[id] || GL.global[id] || null;
function hl(code, name) {
  const local = glossCtx(code, name);
  let out = '', last = 0;
  code.replace(TOK, (m, c, s, n, k, b, dec, id, off) => {
    out += esc(code.slice(last, off));
    if (id) {
      const g = glossOf(id, local);
      out += g ? `<abbr class="gl" title="${esc(id)}：${esc(g[0])}｜${esc(g[1])}">${esc(m)}</abbr>` : esc(m);
    } else {
      const cls = c ? 'c' : s ? 's' : n ? 'n' : k ? 'k' : b ? 'f' : 'b';
      out += `<span class="tok-${cls}">${esc(m)}</span>`;
    }
    last = off + m.length;
    return m;
  });
  return out + esc(code.slice(last));
}
// 抽屜用：列出這段程式中出現的縮寫（依第一次出現的順序）
function glossTable(code, name) {
  const local = glossCtx(code, name), seen = new Map();
  code.replace(TOK, (m, c, s, n, k, b, dec, id) => {
    if (id && !seen.has(id)) { const g = glossOf(id, local); if (g) seen.set(id, [g, !!local[id]]); }
    return m;
  });
  if (!seen.size) return '';
  const rows = [...seen].map(([id, [g, isLocal]]) => `<tr><td><code>${esc(id)}</code>${isLocal ? '<small class="gl-local">此函式內</small>' : ''}</td><td><b>${esc(g[0])}</b><br>${esc(g[1])}</td></tr>`).join('');
  return `<details class="gl-table" open><summary>縮寫與變數（${seen.size}）</summary><table><thead><tr><th>名稱</th><th>展開與說明</th></tr></thead><tbody>${rows}</tbody></table></details>`;
}

// ---------------------------------------------------------------- 投影片元件
const card = (key, title, body, opt = {}) =>
  `<article class="native-card ${opt.tone || ''}" data-lesson="${key}"${opt.style ? ` style="${opt.style}"` : ''}>${opt.tag ? `<span class="tag ${opt.tagTone || ''}">${opt.tag}</span>` : ''}${opt.stat ? `<span class="stat ${opt.statTone || ''}">${opt.stat}</span>` : ''}${title ? `<h2>${title}</h2>` : ''}${body}</article>`;
const code = (key, name, note, src, opt = {}) =>
  `<div class="code-panel" data-lesson="${key}"${opt.style ? ` style="${opt.style}"` : ''}><div class="code-name"><span>${name}</span><small>${note}</small></div><pre${opt.lh ? ` style="line-height:${opt.lh}"` : ''}>${hl(src)}</pre></div>`;
const L = (cls, name, shape) => `<div class="layer ${cls}">${name}${shape ? `<small>${shape}</small>` : ''}</div>`;
const A = '<span class="arr">→</span>';
const seq = (key, name, sub, layers, params, extra = '') =>
  `<div class="seq ${extra}" data-lesson="${key}"><div class="seq-name">${name}${sub ? `<small>${sub}</small>` : ''}</div>${layers.join(A)}<div class="params">${params}</div></div>`;
const strip = (key, html, tone = '') => `<div class="impl-strip ${tone}" data-lesson="${key}">${html}</div>`;
const table = (key, head, rows, opt = {}) =>
  `<div class="impl-table ${opt.cls || ''}" data-lesson="${key}"${opt.style ? ` style="${opt.style}"` : ''}><table><thead><tr>${head.map(h => `<th${/^>/.test(h) ? ' class="r"' : ''}>${h.replace(/^>/, '')}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr${r.hl ? ' class="hl"' : ''}>${(r.cells || r).map((c, i) => `<td${/^>/.test(head[i]) ? ' class="r"' : ''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
function bars(key, rows, max, ref, both = true) {
  const w = v => `${(v / max * 84).toFixed(2)}%`;
  const legend = both ? '<span><i style="background:#9fb0c8"></i>我們 · 論文模式</span><span><i style="background:#0b9d98"></i>我們 · 驗證集模式</span>'
                      : '<span><i style="background:#9fb0c8"></i>我們 · 論文模式（無驗證集）</span>';
  return `<div class="impl-chart" data-lesson="${key}"><div class="legend">${legend}${ref ? `<span><i style="background:none;border-left:2px dashed #c2434a;border-radius:0;width:2px"></i>${ref.label}</span>` : ''}</div><div class="hbars"${both ? '' : ' style="gap:26px;margin-top:8px"'}>${rows.map(([n, p, v]) => `<div class="hbar"><span>${n}</span><div class="pair">${ref ? `<div class="ref-line" style="left:${w(ref.v)}"></div>` : ''}<div class="bar p" style="width:${w(p)}${both ? '' : ';height:32px'}"><em>${p.toFixed(2)}</em></div>${both ? `<div class="bar v" style="width:${w(v)}"><em>${v.toFixed(2)}</em></div>` : ''}</div></div>`).join('')}</div></div>`;
}
// MSFT 測試期最後 60 天（兩種模式共用座標）
const MSFT = {"paper": {"actual": "M48.0,83.3 L60.5,149.9 L73.1,176.4 L85.6,196.8 L98.2,195.0 L110.7,149.9 L123.3,180.1 L135.8,132.5 L148.3,127.3 L160.9,138.0 L173.4,139.8 L186.0,108.1 L198.5,80.9 L211.1,62.8 L223.6,165.4 L236.1,189.7 L248.7,141.3 L261.2,161.1 L273.8,182.2 L286.3,225.0 L298.8,256.1 L311.4,218.2 L323.9,183.8 L336.5,178.4 L349.0,201.6 L361.6,103.5 L374.1,81.6 L386.6,111.1 L399.2,108.9 L411.7,110.2 L424.3,110.4 L436.8,112.9 L449.4,108.5 L461.9,92.6 L474.4,79.1 L487.0,79.6 L499.5,110.0 L512.1,117.6 L524.6,39.0 L537.2,41.4 L549.7,39.6 L562.2,65.2 L574.8,92.2 L587.3,96.2 L599.9,80.1 L612.4,90.6 L624.9,52.9 L637.5,29.5 L650.0,27.9 L662.6,71.5 L675.1,94.5 L687.7,117.0 L700.2,109.8 L712.7,95.8 L725.3,129.0 L737.8,126.1 L750.4,135.5 L762.9,148.4 L775.5,114.0 L788.0,120.3", "naive": "M48.0,70.5 L60.5,83.3 L73.1,149.9 L85.6,176.4 L98.2,196.8 L110.7,195.0 L123.3,149.9 L135.8,180.1 L148.3,132.5 L160.9,127.3 L173.4,138.0 L186.0,139.8 L198.5,108.1 L211.1,80.9 L223.6,62.8 L236.1,165.4 L248.7,189.7 L261.2,141.3 L273.8,161.1 L286.3,182.2 L298.8,225.0 L311.4,256.1 L323.9,218.2 L336.5,183.8 L349.0,178.4 L361.6,201.6 L374.1,103.5 L386.6,81.6 L399.2,111.1 L411.7,108.9 L424.3,110.2 L436.8,110.4 L449.4,112.9 L461.9,108.5 L474.4,92.6 L487.0,79.1 L499.5,79.6 L512.1,110.0 L524.6,117.6 L537.2,39.0 L549.7,41.4 L562.2,39.6 L574.8,65.2 L587.3,92.2 L599.9,96.2 L612.4,80.1 L624.9,90.6 L637.5,52.9 L650.0,29.5 L662.6,27.9 L675.1,71.5 L687.7,94.5 L700.2,117.0 L712.7,109.8 L725.3,95.8 L737.8,129.0 L750.4,126.1 L762.9,135.5 L775.5,148.4 L788.0,114.0", "aro": "M48.0,99.0 L60.5,95.3 L73.1,122.8 L85.6,154.0 L98.2,180.9 L110.7,194.8 L123.3,182.0 L135.8,182.7 L148.3,165.4 L160.9,150.7 L173.4,147.1 L186.0,147.7 L198.5,135.8 L211.1,116.2 L223.6,96.5 L236.1,127.4 L248.7,162.5 L261.2,163.7 L273.8,167.3 L286.3,177.9 L298.8,202.2 L311.4,230.7 L323.9,232.4 L336.5,215.0 L349.0,199.7 L361.6,200.5 L374.1,163.4 L386.6,127.8 L399.2,120.0 L411.7,119.0 L424.3,120.5 L436.8,122.0 L449.4,123.9 L461.9,123.3 L474.4,116.0 L487.0,105.2 L499.5,98.7 L512.1,108.2 L524.6,119.0 L537.2,93.2 L549.7,74.2 L562.2,63.5 L574.8,69.3 L587.3,86.3 L599.9,99.3 L612.4,99.5 L624.9,102.0 L637.5,88.0 L650.0,68.0 L662.6,55.1 L675.1,66.8 L687.7,86.6 L700.2,108.4 L712.7,118.1 L725.3,116.0 L737.8,126.4 L750.4,132.8 L762.9,139.6 L775.5,148.8 L788.0,140.2", "mse_aro": 58.7, "mse_naive": 34.6}, "val": {"actual": "M48.0,83.3 L60.5,149.9 L73.1,176.4 L85.6,196.8 L98.2,195.0 L110.7,149.9 L123.3,180.1 L135.8,132.5 L148.3,127.3 L160.9,138.0 L173.4,139.8 L186.0,108.1 L198.5,80.9 L211.1,62.8 L223.6,165.4 L236.1,189.7 L248.7,141.3 L261.2,161.1 L273.8,182.2 L286.3,225.0 L298.8,256.1 L311.4,218.2 L323.9,183.8 L336.5,178.4 L349.0,201.6 L361.6,103.5 L374.1,81.6 L386.6,111.1 L399.2,108.9 L411.7,110.2 L424.3,110.4 L436.8,112.9 L449.4,108.5 L461.9,92.6 L474.4,79.1 L487.0,79.6 L499.5,110.0 L512.1,117.6 L524.6,39.0 L537.2,41.4 L549.7,39.6 L562.2,65.2 L574.8,92.2 L587.3,96.2 L599.9,80.1 L612.4,90.6 L624.9,52.9 L637.5,29.5 L650.0,27.9 L662.6,71.5 L675.1,94.5 L687.7,117.0 L700.2,109.8 L712.7,95.8 L725.3,129.0 L737.8,126.1 L750.4,135.5 L762.9,148.4 L775.5,114.0 L788.0,120.3", "naive": "M48.0,70.5 L60.5,83.3 L73.1,149.9 L85.6,176.4 L98.2,196.8 L110.7,195.0 L123.3,149.9 L135.8,180.1 L148.3,132.5 L160.9,127.3 L173.4,138.0 L186.0,139.8 L198.5,108.1 L211.1,80.9 L223.6,62.8 L236.1,165.4 L248.7,189.7 L261.2,141.3 L273.8,161.1 L286.3,182.2 L298.8,225.0 L311.4,256.1 L323.9,218.2 L336.5,183.8 L349.0,178.4 L361.6,201.6 L374.1,103.5 L386.6,81.6 L399.2,111.1 L411.7,108.9 L424.3,110.2 L436.8,110.4 L449.4,112.9 L461.9,108.5 L474.4,92.6 L487.0,79.1 L499.5,79.6 L512.1,110.0 L524.6,117.6 L537.2,39.0 L549.7,41.4 L562.2,39.6 L574.8,65.2 L587.3,92.2 L599.9,96.2 L612.4,80.1 L624.9,90.6 L637.5,52.9 L650.0,29.5 L662.6,27.9 L675.1,71.5 L687.7,94.5 L700.2,117.0 L712.7,109.8 L725.3,95.8 L737.8,129.0 L750.4,126.1 L762.9,135.5 L775.5,148.4 L788.0,114.0", "aro": "M48.0,85.7 L60.5,81.2 L73.1,81.6 L85.6,86.4 L98.2,94.6 L110.7,104.3 L123.3,110.8 L135.8,117.4 L148.3,120.0 L160.9,120.0 L173.4,119.2 L186.0,118.1 L198.5,114.6 L211.1,108.2 L223.6,99.3 L236.1,97.1 L248.7,100.1 L261.2,102.4 L273.8,106.0 L286.3,111.3 L298.8,120.3 L311.4,132.8 L323.9,143.6 L336.5,150.5 L349.0,154.2 L361.6,157.6 L374.1,153.5 L386.6,144.1 L399.2,134.4 L411.7,125.0 L424.3,116.6 L436.8,109.2 L449.4,103.3 L461.9,98.4 L474.4,93.1 L487.0,87.0 L499.5,81.0 L512.1,77.7 L524.6,76.6 L537.2,71.1 L549.7,64.0 L562.2,56.2 L574.8,50.5 L587.3,48.3 L599.9,48.3 L612.4,48.5 L624.9,49.7 L637.5,48.7 L650.0,44.7 L662.6,39.5 L675.1,36.9 L687.7,37.4 L700.2,41.3 L712.7,46.3 L725.3,50.5 L737.8,56.6 L750.4,62.8 L762.9,69.3 L775.5,76.5 L788.0,81.3", "mse_aro": 129.6, "mse_naive": 34.6}, "ticks": [[220, 225.5], [240, 119.4], [260, 13.2]], "xt": [[48.0, "10/06"], [298.8, "11/03"], [549.7, "12/02"], [788.0, "12/30"]]};
// 逐檔 MSE：[論文, 我們·論文模式, 我們·驗證集模式]；WMT 已 × 9 換算分割
const PER = {"LSTM-ARO": {"AXP": [24.29, 61.44, 17.81], "AMGN": [19.77, 33.5, 30.37], "AAPL": [22.73, 97.77, 23.5], "BA": [33.66, 98.27, 87.07], "CAT": [38.44, 27.61, 26.89], "CSCO": [0.99, 1.01, 1.09], "CVX": [23.97, 108.47, 157.42], "GS": [80.14, 193.56, 108.6], "HD": [62.53, 100.76, 82.9], "HON": [13.26, 15.75, 12.49], "IBM": [7.33, 8.37, 4.45], "INTC": [1.83, 5.04, 4.94], "JNJ": [5.7, 7.21, 4.85], "KO": [0.96, 2.67, 2.02], "JPM": [10.4, 8.33, 9.77], "MCD": [20.6, 50.65, 38.5], "MMM": [11.47, 547.78, 37.07], "MRK": [3.69, 18.97, 26.99], "MSFT": [63.32, 101.3, 134.47], "NKE": [14.07, 19.16, 16.59], "PG": [8.29, 9.05, 24.88], "TRV": [13.13, 19.01, 29.71], "UNH": [126.13, 266.78, 254.29], "CRM": [39.9, 40.43, 52.59], "VZ": [0.74, 42.74, 2.45], "V": [24.41, 21.56, 18.7], "WMT": [10.83, 14.83, 9.48], "DIS": [13.96, 26.79, 19.78], "DOW": [1.91, 3.47, 2.58]}, "LSTM-GA": {"AXP": [25.87, 64.68, 40.03], "AMGN": [20.27, 27.52, 28.92], "AAPL": [24.11, 54.76, 27.64], "BA": [40.22, 338.67, 96.83], "CAT": [36.33, 36.52, 40.65], "CSCO": [1.14, 1.2, 1.43], "CVX": [21.95, 131.56, 90.89], "GS": [80.83, 95.75, 70.45], "HD": [59.79, 121.2, 86.89], "HON": [14.59, 16.7, 16.1], "IBM": [7.29, 7.64, 4.68], "INTC": [1.99, 5.22, 6.98], "JNJ": [5.02, 8.81, 4.92], "KO": [0.93, 2.72, 2.02], "JPM": [12.93, 6.78, 16.68], "MCD": [21.52, 73.76, 21.9], "MMM": [10.38, 75.62, 20.48], "MRK": [2.35, 8.0, 18.7], "MSFT": [79.25, 89.78, 84.06], "NKE": [14.89, 38.21, 21.92], "PG": [8.04, 9.6, 10.51], "TRV": [13.08, 45.18, 11.92], "UNH": [96.37, 198.29, 198.31], "CRM": [52.95, 31.32, 50.94], "VZ": [0.73, 37.11, 1.56], "V": [25.67, 29.53, 19.15], "WMT": [11.05, 9.19, 8.08], "DIS": [14.59, 14.31, 25.84], "DOW": [2.0, 2.2, 4.72]}};
const PER_PICK = ['JPM', 'CAT', 'IBM', 'AAPL', 'AXP', 'MSFT', 'CVX', 'VZ'];
const PER_COLORS = ['#c99a27', '#9fb0c8', '#0b9d98'];
const PER_NAMES = ['論文', '我們 · 論文模式', '我們 · 論文模式＋驗證集'];
const fmtMse = v => v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2);
function tickerBars(model, tickers) {
  return `<div class="mini-row">${tickers.map(t => {
    const vals = PER[model][t], max = Math.max(...vals);
    return `<div class="mini"><div class="mini-plot">${vals.map((v, i) => `<div class="mini-col"><em>${fmtMse(v)}</em><i style="height:${Math.max(2, v / max * 100).toFixed(1)}%;background:${PER_COLORS[i]}"></i></div>`).join('')}</div><b>${t}</b></div>`;
  }).join('')}</div>`;
}
function perTable(model) {
  const rows = Object.entries(PER[model]).map(([t, [a, b, c]]) => `<tr><td>${t}</td><td>${fmtMse(a)}</td><td>${fmtMse(b)}</td><td>${fmtMse(c)}</td><td>${(b / a).toFixed(2)}</td><td>${(c / a).toFixed(2)}</td></tr>`).join('');
  return `<table><tr><th>股票</th><th>論文</th><th>論文模式</th><th>＋驗證集</th><th>論文模式 ÷ 論文</th><th>＋驗證集 ÷ 論文</th></tr>${rows}</table>`;
}
function msftChart(mode) {
  const d = MSFT[mode];
  const grid = MSFT.ticks.map(([, y]) => `<line x1="48" x2="788" y1="${y}" y2="${y}"/>`).join('');
  const ty = MSFT.ticks.map(([v, y]) => `<text x="40" y="${y + 4}" text-anchor="end">${v}</text>`).join('');
  const tx = MSFT.xt.map(([x, lab], i) => `<text x="${x}" y="294" text-anchor="${i === 0 ? 'start' : i === 3 ? 'end' : 'middle'}">${lab}</text>`).join('');
  return `<svg viewBox="0 0 800 300" role="img" aria-label="MSFT 測試期最後 60 個交易日" style="width:100%;height:auto"><g stroke="#dfe6f0" stroke-width="1">${grid}</g><g font-size="12" fill="#5d6c84">${ty}${tx}</g><path d="${d.actual}" fill="none" stroke="#101a30" stroke-width="2.6"/><path d="${d.naive}" fill="none" stroke="#9fb0c8" stroke-width="1.8" stroke-dasharray="5 4"/><path d="${d.aro}" fill="none" stroke="#e07a2e" stroke-width="2"/></svg>`;
}
const fullCode = (...names) => names.map(n => ({name: n, text: CODE[n] || `# 找不到 ${n}`}));

// ---------------------------------------------------------------- 投影片
const S1 = '01｜實作設定', S2 = '02｜模型與程式', S3 = '03｜數字對得上嗎', S4 = '04｜ARO 真的比較好嗎', S5 = '05｜贏得過 NAIVE 嗎';
const SLIDES = [
// 1 封面
{ cover: true, title: 'LSTM-ARO 重現實作：DJIA 29 檔股票', cat: '封面',
  html: `<div class="impl-cover-bar"></div>
  <p class="impl-cover-eyebrow">IMPLEMENTATION · 重現實作</p>
  <h1 class="impl-cover-title" data-lesson="page">LSTM-ARO 股價預測<br>在 DJIA 29 檔的重現實作</h1>
  <p class="impl-cover-sub">從頭實作論文的六種模型，另加「明天 = 今天」的 NAIVE 基準；同一套程式分別以論文的評估方式與嚴謹的驗證集方式各跑一次。</p>
  <div class="impl-cover-pill">Keras · GA · ARO</div>
  <a class="impl-cover-colab" href="${COLAB}" target="_blank" rel="noopener">▶ 在 Colab 開啟 notebook ↗</a>
  <div class="impl-cover-stats"><div><b>29</b>檔股票</div><div><b>7</b>種模型</div><div><b>2</b>種評估模式</div><div><b>406</b>組實驗</div></div>
  <div class="impl-cover-team"><small>指導教授</small><b>歐陽振森 教授</b><small>報告成員</small>F115119104　楊晟楷<br>F115118101　李郅陞<br>F115119131　葉日杰</div>`,
  lesson: { explain: `<p>這份簡報介紹我們如何在程式中重現 Gülmez (2023) 的 LSTM-ARO 方法，以及跑完 29 檔 × 7 種模型 × 2 種評估模式之後的結果。</p><p>點選投影片上的卡片、程式碼或圖表，可在這裡看到說明；有程式碼的項目可切到「程式碼」分頁看 notebook 裡的完整函式。</p>`, source: SRC.nb + SRC.results + SRC.paper } },

// 2 問題
{ section: S1, phase: 'one', title: '這次實作要回答三個問題', source: 'reproduction_plan.md §6',
  html: `<div class="impl-body"><div class="grid3" style="height:250px">
    ${card('q1', '數字對得上嗎？', '<p>同樣的資料與架構，我們的 MSE 是否接近論文 Table 7？</p>', {tag: 'Q1', tone: 'tone-blue', tagTone: 'blue'})}
    ${card('q2', 'ARO 真的比較好嗎？', '<p>論文中 LSTM-ARO 在 17 / 29 檔拿第一。換成較嚴謹的評估方式後，ARO 的領先是否仍然存在？</p>', {tag: 'Q2', tone: 'tone-purple', tagTone: 'purple'})}
    ${card('q3', '有沒有更簡單的基準？', '<p>論文沒有和「明天 = 今天」比較。神經網路能不能贏過這個不需要訓練的方法？</p>', {tag: 'Q3', tone: 'tone-gold', tagTone: 'gold'})}
  </div><div style="height:40px"></div>${strip('plan', '做法：同一套程式 × 兩種評估模式 × 29 檔 × 7 種模型 = 406 組完整實驗')}</div>`,
  lesson: { explain: '<p>重現的重點不是把數字抄對，而是檢查論文的<b>結論</b>在相同條件下是否成立。我們除了照論文的流程跑一次，也用「測試集只在最後用一次」的方式跑一次，並加入 NAIVE 基準。</p>', source: SRC.plan + SRC.paper },
  items: {
    q1: { title: 'Q1：數字對得上嗎？', explain: '<p>比較方式：每一檔股票算「我們的 MSE ÷ 論文的 MSE」，再取 29 檔的幾何平均。1.00 表示完全一致。</p><p>WMT 在 2024 年 1 拆 3，論文當時的價格約為現在的 3 倍，所以比較時我們的 MSE 要 × 9。</p>' },
    q2: { title: 'Q2：ARO 真的比較好嗎？', explain: '<p>論文的 LSTM-ARO 在搜尋超參數時直接用<b>測試集</b>誤差當 fitness，這會讓測試成績偏樂觀。我們另外跑一個驗證集版本，fitness 改用訓練集尾端的驗證集，測試集只在最後評估一次。</p><p>ARO 與 GA 的比較用 Wilcoxon signed-rank 檢定（29 檔配對）。</p>' },
    q3: { title: 'Q3：NAIVE 基準', explain: '<p>NAIVE 的預測值就是前一天的收盤價，不需要訓練。股價有很強的延續性，這是預測隔天價格時最基本的比較對象。</p>' },
    plan: { title: '實驗規模', explain: '<p>29 檔（WBA 已下市）× 7 種模型（NAIVE、ANN、LSTM1D、LSTM2D、LSTM3D、LSTM-GA、LSTM-ARO）× 2 種評估模式 = 406 組。每組的 ANN／LSTM 都用 5 個 seed 重訓取平均。</p>' },
  } },

// 3 程式架構
{ section: S1, phase: 'one', title: 'Notebook 的程式架構', source: 'djia_reproduction.ipynb · run_job()',
  html: `<div class="impl-body tall"><div class="pipe" style="height:124px">
    ${card('cfg', '① 實驗設定', '<p>Config、SHARD 分工</p>')}<span class="flow-arrow">→</span>
    ${card('data', '② 凍結資料', '<p>GitHub CSV＋md5 指紋</p>')}<span class="flow-arrow">→</span>
    ${card('bench', '③ 時間估算', '<p>CPU / GPU 選較快者</p>')}<span class="flow-arrow">→</span>
    ${card('jobs', '④ run_jobs', '<p>股票 × 模型平行執行</p>')}<span class="flow-arrow">→</span>
    ${card('merge', '⑤ 匯出／合併', '<p>zip，設定不同即拒收</p>')}<span class="flow-arrow">→</span>
    ${card('collect', '⑥ 彙整', '<p>Table 7–11、Wilcoxon</p>')}
  </div><div style="height:14px"></div>
  ${code('runjob', 'run_job()：一檔股票 × 一種模型', '節錄', `def run_job(cfg_dict: dict, ticker: str, model: str) -> dict:
    # …（略：已有 done.json 就直接讀回結果）
    data = prepare(load_prices(cfg, ticker), cfg)
    if model == "NAIVE":
        pred = data.prev_test
    elif model in BASELINES:
        rows, pred = final_eval(cfg, data, lambda: build_baseline(cfg, model))
    elif model in SEARCHERS:
        ss = search_seed(cfg, ticker)
        X0 = np.random.default_rng(ss).uniform(0, 1, (cfg.pop_size, DIM))  # GA 與 ARO 共用初始族群
        fobj = Fitness(cfg, data, os.path.join(out, "candidates.jsonl"), ss)
        algo, rng = (aro, np.random.default_rng(ss + 1)) if model == "LSTM-ARO" else (ga, np.random.default_rng(ss + 2))
        best_x, best_f, history = algo(fobj, X0, cfg.iterations, rng)
        arch = hp_to_arch(decode(best_x))
        rows, pred = final_eval(cfg, data, lambda: build_lstm(cfg, **arch))`)}</div>`,
  lesson: { explain: '<p>所有核心程式寫在 notebook 的一格，以 <code>%%writefile djia_lib.py</code> 存成模組，讓平行的 worker process 可以 import（Colab 與 Windows 都用 spawn 啟動）。</p><p>最小的工作單位是「一檔股票 × 一種模型」，由 <code>run_job()</code> 完成；完成後寫一個 <code>done.json</code>，重跑時直接讀回。</p>', code: fullCode('run_job'), source: SRC.nb },
  items: {
    cfg: { title: '① 實驗設定', explain: '<p>協作者只改 <code>SHARD</code>，其他設定所有人必須一致，否則結果無法合併。</p>', code: fullCode('settings', 'Config') },
    data: { title: '② 凍結資料', explain: '<p>負責人先用 yfinance 下載一次，存成長格式 CSV 放上 GitHub。每個人都從同一個網址下載，並計算 md5 前 8 碼（<code>22650beb</code>）放進設定，合併時用來確認大家用的是同一份資料。</p><p>計算 md5 前會先把 CRLF 換成 LF，避免 Windows／git 換行設定造成指紋不同。</p>' },
    bench: { title: '③ 時間估算', explain: '<p>同時開 WORKERS 個 process，各訓練幾個隨機候選與一個 LSTM2D，量出負載下的速度，推算本次負責的股票要跑多久。有 GPU 時 CPU、GPU 各量一次，選較快的。</p><p>這些 LSTM 很小（神經元 ≤ 20），GPU 不一定比較快。</p>' },
    jobs: { title: '④ run_jobs：平行執行', explain: '<p>以「股票 × 模型」為單位丟進 <code>ProcessPoolExecutor</code>。已有 <code>done.json</code> 且設定一致的直接跳過；設定不同的舊結果會移到 <code>.stale-時間</code> 再重跑。</p>', code: fullCode('run_jobs') },
    merge: { title: '⑤ 匯出與合併', explain: '<p>協作者把自己完成的結果打包成 zip；負責人把 zip 放進 <code>incoming/</code> 後合併。<code>compatible()</code> 會逐欄比對設定與資料指紋，不一致的拒收，已存在的不覆蓋。</p>', code: fullCode('compatible', 'merge_results') },
    collect: { title: '⑥ 彙整', explain: '<p>讀回所有 <code>done.json</code>，整理成論文 Table 7–10 的格式（列為股票、欄為模型），並計算各模型拿第一的檔數、平均名次、Wilcoxon 配對檢定與訓練時間（Table 11）。</p>' },
    runjob: { title: 'run_job()', explain: '<p>三種模型走三條路：</p><ul><li><b>NAIVE</b>：直接用前一天價格。</li><li><b>固定架構</b>：<code>final_eval</code> 用 5 個 seed 訓練。</li><li><b>GA／ARO</b>：先搜尋，再把最佳架構交給 <code>final_eval</code>。</li></ul><p>GA 與 ARO 使用<b>同一個初始族群 X0</b>，差別只在搜尋演算法。</p>', code: fullCode('run_job', 'search_seed') },
  } },

// 4 資料前處理
{ section: S1, phase: 'one', title: '資料前處理：20 天視窗、只用訓練段正規化', source: 'djia_reproduction.ipynb · prepare()',
  html: `<div class="impl-body"><div class="row">
    <div style="display:flex;width:750px;flex:none">${code('prepare', 'prepare()', '節錄', `def prepare(prices: pd.Series, cfg: Config) -> Data:
    raw = prices.values.astype(float)
    n = len(raw) - cfg.window
    n_train = int(n * cfg.train_ratio)
    lo, hi = raw[: n_train + cfg.window].min(), raw[: n_train + cfg.window].max()  # 只看訓練段
    z = (raw - lo) / (hi - lo)
    X = np.lib.stride_tricks.sliding_window_view(z[:-1], cfg.window).copy()
    X = X[:, :, None] if cfg.input_layout == "timesteps" else X[:, None, :]
    y = z[cfg.window:].copy()
    X_train, y_train, X_test, y_test = X[:n_train], y[:n_train], X[n_train:], y[n_train:]
    if cfg.use_validation:
        n_val = int(n_train * cfg.val_ratio)
        X_fit, y_fit = X_train[:-n_val], y_train[:-n_val]
        X_eval, y_eval = X_train[-n_val:], y_train[-n_val:]
    else:
        X_fit, y_fit, X_eval, y_eval = X_train, y_train, X_test, y_test`, {style: 'flex:1'})}</div>
    <div class="col f1">
      ${card('window', '20 天 → 隔天', '<p>輸入形狀 (20, 1)：20 個時間步，每步 1 個特徵（收盤價）。</p>', {tone: 'tone-blue'})}
      ${card('split', '80% / 20% 依時間切', '<p>訓練約 991 筆、測試 248 筆（≈ 2022 年）。</p>', {tone: 'tone-green'})}
      ${card('minmax', '只用訓練段正規化', '<p>lo、hi 只取訓練段，避免偷看測試集的價格範圍。</p>', {tone: 'tone-gold'})}
      ${card('tickers', '29 檔', '<p>WBA 已下市；DOW 2019-03 才上市；WMT 已 1 拆 3。</p>', {tone: 'tone-red'})}
    </div></div></div>`,
  lesson: { explain: '<p>每檔股票各自處理、各自訓練。資料期間 2018-01-01 ～ 2022-12-31，使用收盤價（只做分割調整，和論文較接近）。</p><p>評估指標都先用 <code>data.inverse()</code> 換回原始價格再計算，所以 MSE 的單位是「美元²」，可直接和論文表格比較。</p>', code: fullCode('prepare', 'metrics'), source: SRC.nb + SRC.plan },
  items: {
    prepare: { title: 'prepare()', explain: '<p>用 <code>sliding_window_view</code> 一次切出所有視窗：第 k 筆輸入是第 k～k+19 天，目標是第 k+20 天。</p><p><code>X_fit / X_eval</code> 是搜尋時用的資料：論文模式 eval = 測試集；驗證集模式從訓練集尾端切 20% 當 eval。</p>', code: fullCode('prepare') },
    window: { title: '20 天視窗', explain: '<p>論文只寫「Input 20」。我們預設解讀為 20 個時間步 × 1 個特徵，這也是 LSTM 能利用時間順序的形狀；另一種解讀（1 步 × 20 特徵）保留成設定 <code>INPUT_LAYOUT = "features"</code>。</p>' },
    split: { title: '依時間切分', explain: '<p>股價是時間序列，不能隨機打亂後切分，否則訓練集會包含測試期之後的資訊。<code>n_train = int(n × 0.8)</code>，前面是訓練、後面是測試。</p><p>DOW 上市較晚，訓練筆數較少。</p>' },
    minmax: { title: 'Min-Max 正規化', explain: '<p>z = (x − lo) / (hi − lo)。lo、hi 若用整段資料計算，模型就間接知道測試期的最高價與最低價，屬於資料洩漏。測試期價格可能超出 [0, 1]，這是正常的。</p>' },
    tickers: { title: '股票清單', explain: '<p>論文 Table 7 的 30 檔中，WBA（Walgreens）已從 Yahoo Finance 下市，拿不到 2018–2022 的資料，因此只有 29 檔。</p><p>DOW 2019-03-20 才上市。WMT 在 2024 年 1 拆 3，我們的價格約為論文當時的 1/3，比較 MSE 時要 × 9。</p>' },
  } },

// 5 實驗設定
{ section: S1, phase: 'one', title: '實驗設定：預算縮小，兩種評估模式', source: 'djia_reproduction.ipynb §1 實驗設定 · Config',
  html: `<div class="impl-body"><div class="row">
    ${table('budget', ['項目', '>論文', '>我們'], [
      ['族群 × 迭代', '50 × 50', '10 × 10'],
      ['每檔評估次數上限', '2,550', '110'],
      ['搜尋時 epochs', '未寫明', '20'],
      ['最終模型 epochs', '未寫明', '50'],
      ['最終模型 seed 數', '1', '5'],
      ['batch size', '未寫明', '32'],
      ['隱藏 Dense 激活', '未寫明', 'linear'],
    ], {cls: 'fill', style: 'flex:1'})}
    <div class="col" style="width:560px;flex:none">
      ${card('paper', '論文模式 USE_VALIDATION = False', '<ul><li>fitness = 候選架構在<b>測試集</b>的 MSE（論文 Fig. 2）</li><li>固定 epochs，不做 early stopping</li><li>用測試集挑超參數 → 結果偏樂觀</li></ul>', {tone: 'tone-red', tag: '照論文', tagTone: 'red'})}
      ${card('val', '驗證集模式 USE_VALIDATION = True', '<ul><li>fitness = 訓練集尾端 20% <b>驗證集</b>的 MSE</li><li>early stopping：搜尋 patience 5、最終 patience 10</li><li>測試集只在最後用一次</li></ul>', {tone: 'tone-green', tag: '嚴謹版'})}
      ${strip('final', '兩種模式都把最終架構用 5 個 seed 重訓 50 epochs，取測試集平均', 'left')}
    </div></div></div>`,
  lesson: { explain: '<p>論文每檔股票最多要訓練 2,550 個候選模型，30 檔約 8.7 天。我們把族群與迭代都縮成 10，每檔最多 110 次評估（相同架構只訓練一次，實際約 60–80 個）。</p><p>評估模式以 <code>USE_VALIDATION</code> 切換，兩種結果存在不同資料夾（<code>paper_…</code>、<code>val_…</code>），不會互相覆蓋。</p>', code: fullCode('settings', 'Config'), source: SRC.nb + SRC.plan },
  items: {
    budget: { title: '運算預算', explain: '<p>論文沒寫的訓練細節（epochs、batch、Dense 激活）由我們決定。Dense 激活先用 10 檔股票比較 linear 與 ReLU：linear 的 MSE 為論文的 1.14 倍，ReLU 為 3.71 倍，因此採用 Keras 預設的 linear。</p>', source: SRC.relu },
    paper: { title: '論文模式', explain: '<p>論文 Fig. 2 的流程：每個候選架構訓練後，直接用測試集的誤差當 fitness。這等於用測試集挑超參數，挑出的分數是「在測試集上看起來最好的那一次」。</p>' },
    val: { title: '驗證集模式', explain: '<p>從訓練集最後 20% 切出驗證集，搜尋時只看驗證集。最終模型以 <code>validation_split=0.1</code> 做 early stopping，<code>restore_best_weights=True</code>。測試集完全不參與挑選。</p>', code: fullCode('fit_model') },
    final: { title: '最終評估', explain: '<p>每個模型（含 ANN、LSTM1D/2D/3D）都用 seed 42–46 訓練 5 次，取 5 次測試指標的平均，並記錄標準差。只訓練一次的話，結果會受隨機初始化影響很大。</p>', code: fullCode('final_eval') },
  } },

// 6 模型總覽
{ section: S2, phase: 'two', title: '七種模型的層序列', source: '論文 Table 1–5 · build_baseline() / build_lstm()',
  html: `<div class="impl-body" style="gap:7px">
    ${seq('naive', 'NAIVE', '基準', [L('in', 'Input', '20 天'), L('naive', '取最後一天', 'x[t-1]')], '<b>0</b>參數')}
    ${seq('ann', 'ANN', 'Table 1', [L('in', 'Input', '(20, 1)'), L('flat', 'Flatten', '20'), L('dense', 'Dense 10'), L('dense', 'Dense 10'), L('drop', 'Dropout 0.5'), L('out', 'Dense 1')], '<b>331</b>參數')}
    ${seq('l1', 'LSTM1D', 'Table 2', [L('in', 'Input', '(20, 1)'), L('lstm', 'LSTM 10'), L('dense', 'Dense 10'), L('drop', 'Dropout 0.5'), L('out', 'Dense 1')], '<b>601</b>參數')}
    ${seq('l2', 'LSTM2D', 'Table 3', [L('in', 'Input', '(20, 1)'), L('lstm', 'LSTM 10'), L('lstm', 'LSTM 10'), L('dense', 'Dense 10'), L('drop', 'Dropout 0.5'), L('out', 'Dense 1')], '<b>1,441</b>參數')}
    ${seq('l3', 'LSTM3D', 'Table 4', [L('in', 'Input', '(20, 1)'), L('lstm', 'LSTM 10'), L('lstm', 'LSTM 10'), L('lstm', 'LSTM 10'), L('dense', 'Dense 10'), L('drop', 'Dropout 0.5'), L('out', 'Dense 1')], '<b>2,281</b>參數')}
    ${seq('search', 'GA / ARO', 'Table 5', [L('in', 'Input', '(20, 1)'), L('lstm', 'LSTM x₀'), L('lstm', 'LSTM x₂', 'x₁=1 才有'), L('lstm', 'LSTM x₄', 'x₃=1 才有'), L('dense', 'Dense x₅'), L('drop', 'Dropout x₆'), L('out', 'Dense 1')], '<b>依搜尋</b>x₇ optimizer、x₈ lr', 'search')}
  </div>`,
  lesson: { explain: '<p>所有模型都輸出一個數字（正規化後的隔天價格），損失函數為 MSE。固定架構一律用 Adam、學習率 0.001；GA／ARO 的 optimizer 與學習率也是搜尋對象。</p><h3>計算公式（Keras）</h3><ul><li><b>LSTM(u)</b>，輸入 d 維：4 個閘門（輸入、遺忘、輸出、候選）各有 W（d·u）、U（u·u）、b（u），共 <b>4·((d+u)·u + u)</b>。</li><li><b>Dense(n)</b>，輸入 d 維：權重 d·n ＋ 偏差 n = <b>d·n + n</b>。</li><li><b>Flatten、Dropout</b>：只改形狀或隨機遮蔽，<b>0</b> 個參數。</li><li>LSTM 的 d 是<b>每個時間步</b>的特徵數（這裡是 1），與序列長度 20 無關；ANN 先 Flatten 成 20 維，所以 Dense 的 d = 20。</li></ul><h3>NAIVE</h3><p>直接取前一天收盤價，沒有可學參數：<b>0</b>。</p><h3>ANN（Table 1）</h3><table><tr><th>層</th><th>計算</th><th>參數</th></tr><tr><td>Flatten</td><td>(20, 1) → 20</td><td>0</td></tr><tr><td>Dense 10（輸入 20 維）</td><td>20·10 + 10</td><td>210</td></tr><tr><td>Dense 10（輸入 10 維）</td><td>10·10 + 10</td><td>110</td></tr><tr><td>Dropout 0.5</td><td>無權重</td><td>0</td></tr><tr><td>Dense 1（輸入 10 維）</td><td>10·1 + 1</td><td>11</td></tr><tr><td><b>合計</b></td><td>210 + 110 + 11</td><td><b>331</b></td></tr></table><h3>LSTM1D（Table 2）</h3><table><tr><th>層</th><th>計算</th><th>參數</th></tr><tr><td>LSTM 10（輸入 1 維）</td><td>4·((1+10)·10 + 10)</td><td>480</td></tr><tr><td>Dense 10（輸入 10 維）</td><td>10·10 + 10</td><td>110</td></tr><tr><td>Dropout 0.5</td><td>無權重</td><td>0</td></tr><tr><td>Dense 1（輸入 10 維）</td><td>10·1 + 1</td><td>11</td></tr><tr><td><b>合計</b></td><td>480 + 110 + 11</td><td><b>601</b></td></tr></table><h3>LSTM2D（Table 3）</h3><table><tr><th>層</th><th>計算</th><th>參數</th></tr><tr><td>LSTM 10（輸入 1 維）</td><td>4·((1+10)·10 + 10)</td><td>480</td></tr><tr><td>LSTM 10（輸入 10 維）</td><td>4·((10+10)·10 + 10)</td><td>840</td></tr><tr><td>Dense 10（輸入 10 維）</td><td>10·10 + 10</td><td>110</td></tr><tr><td>Dropout 0.5</td><td>無權重</td><td>0</td></tr><tr><td>Dense 1（輸入 10 維）</td><td>10·1 + 1</td><td>11</td></tr><tr><td><b>合計</b></td><td>480 + 840 + 110 + 11</td><td><b>1,441</b></td></tr></table><h3>LSTM3D（Table 4）</h3><table><tr><th>層</th><th>計算</th><th>參數</th></tr><tr><td>LSTM 10（輸入 1 維）</td><td>4·((1+10)·10 + 10)</td><td>480</td></tr><tr><td>LSTM 10（輸入 10 維）</td><td>4·((10+10)·10 + 10)</td><td>840</td></tr><tr><td>LSTM 10（輸入 10 維）</td><td>4·((10+10)·10 + 10)</td><td>840</td></tr><tr><td>Dense 10（輸入 10 維）</td><td>10·10 + 10</td><td>110</td></tr><tr><td>Dropout 0.5</td><td>無權重</td><td>0</td></tr><tr><td>Dense 1（輸入 10 維）</td><td>10·1 + 1</td><td>11</td></tr><tr><td><b>合計</b></td><td>480 + 840 + 840 + 110 + 11</td><td><b>2,281</b></td></tr></table><h3>LSTM-GA / LSTM-ARO（Table 5）</h3><p>設各層 LSTM 神經元為 u₁、u₂、u₃（沒有的層略過），Dense 為 k，最後一層 LSTM 的神經元為 u_last：</p><ul><li>第 1 層 LSTM：4·((1+u₁)·u₁ + u₁)</li><li>第 2 層（x₁=1）：4·((u₁+u₂)·u₂ + u₂)</li><li>第 3 層（x₃=1）：4·((u₂+u₃)·u₃ + u₃)</li><li>Dense k：u_last·k + k</li><li>輸出 Dense 1：k + 1</li></ul><p>例：LSTM 13 → LSTM 7 → Dense 10 → Dense 1 = 4·(14·13+13) + 4·(20·7+7) + (7·10+10) + 11 = 780 + 588 + 80 + 11 = <b>1,459</b>。可到 GA／ARO 卡片的「動態演算」自己組合試算。</p>', code: fullCode('build_baseline', 'build_lstm'), source: SRC.nb + SRC.paper },
  items: {
    naive: { title: 'NAIVE', explain: '<p>預測值 = 前一天的實際收盤價（<code>data.prev_test</code>），不需要訓練。</p>' },
    ann: { title: 'ANN（Table 1）', explain: '<p>Flatten 把 (20, 1) 攤平成 20 維，接兩層 Dense 10。參數：20·10+10 = 210、10·10+10 = 110、10+1 = 11，共 331。</p>', code: fullCode('build_baseline') },
    l1: { title: 'LSTM1D（Table 2）', explain: '<p>LSTM 10（480）＋ Dense 10（110）＋ Dense 1（11）= 601 個參數。</p>', code: fullCode('build_lstm', 'build_baseline') },
    l2: { title: 'LSTM2D（Table 3）', explain: '<p>第二層 LSTM 的輸入是第一層的 10 維輸出：4·(20·10 + 10) = 840。總計 480 + 840 + 110 + 11 = 1,441。</p>', code: fullCode('build_lstm', 'build_baseline') },
    l3: { title: 'LSTM3D（Table 4）', explain: '<p>再多一層 LSTM 10（840）：480 + 840 + 840 + 110 + 11 = 2,281 個參數。層數最多，但在我們的實驗中表現最差。</p>', code: fullCode('build_lstm', 'build_baseline') },
    search: { title: 'LSTM-GA / LSTM-ARO（Table 5）', explain: '<p>架構與固定 LSTM 相同，只是每一層有沒有、幾個神經元、Dropout、optimizer、學習率都由 9 維向量 x₀…x₈ 決定。可切到「動態演算」自己組一個。</p>', code: fullCode('SEARCH_SPACE', 'decode', 'hp_to_arch', 'build_lstm'), widget: 'decode' },
  } },

// 7 ANN
{ section: S2, phase: 'two', title: 'ANN：Flatten 後接兩層 Dense', source: 'djia_reproduction.ipynb · build_baseline()',
  html: `<div class="impl-body" style="display:flex;flex-direction:column;gap:16px">
    ${seq('annseq', 'ANN', '331 參數', [L('in', 'Input', '(None, 20, 1)'), L('flat', 'Flatten', '(None, 20)'), L('dense', 'Dense 10', '(None, 10)'), L('dense', 'Dense 10', '(None, 10)'), L('drop', 'Dropout 0.5', '(None, 10)'), L('out', 'Dense 1', '(None, 1)')], '')}
    <div class="row">
      ${code('anncode', 'build_baseline("ANN")', '節錄', `def build_baseline(cfg: Config, name: str):
    if name == "ANN":
        k = _tf(cfg).keras
        m = k.Sequential([
            k.Input(shape=input_shape(cfg)),
            k.layers.Flatten(),
            k.layers.Dense(10, activation=_act(cfg)),
            k.layers.Dense(10, activation=_act(cfg)),
            k.layers.Dropout(0.5),
            k.layers.Dense(1),
        ])
        m.compile(optimizer=k.optimizers.Adam(learning_rate=1e-3), loss="mse")
        return m`, {style: 'width:640px;flex:none'})}
      <div class="col f1">
        ${card('flatten', 'Flatten', '<p>ANN 不看時間順序，20 天價格就是 20 個獨立輸入。</p>', {tone: 'tone-blue'})}
        ${card('linear', 'activation = linear', '<p>論文沒寫激活函數，用 Keras 預設（無激活）。</p>', {tone: 'tone-gold'})}
        ${card('dropout', 'Dropout 0.5', '<p>訓練時隨機關掉一半神經元，預測時不作用。</p>', {tone: 'tone-purple'})}
      </div></div></div>`,
  lesson: { explain: '<p>ANN 是論文中唯一不是 LSTM 的比較模型。因為隱藏層沒有激活函數，整個網路在預測時等同一個 20 天價格的<b>線性組合</b>，只是用三層矩陣表示。</p>', code: fullCode('build_baseline'), source: SRC.nb + SRC.relu },
  items: {
    annseq: { title: 'ANN 的形狀變化', explain: '<p>None 是 batch 維度。Flatten 把 (20, 1) 變成 20 維向量，之後每層 Dense 都輸出 10 維，最後 Dense 1 輸出一個價格。</p>' },
    anncode: { title: 'build_baseline("ANN")', explain: '<p><code>_act(cfg)</code> 在 <code>DENSE_ACTIVATION = "linear"</code> 時回傳 None，也就是 Keras 的預設值。</p>', code: fullCode('build_baseline') },
    flatten: { title: 'Flatten', explain: '<p>LSTM 依序讀 20 天，並把前面的資訊存在 cell state；ANN 則把 20 天同時丟進全連接層，沒有「先後」的概念。</p>' },
    linear: { title: '為什麼用 linear？', explain: '<p>我們用 10 檔股票測試：linear 的 MSE 中位數為論文的 1.14 倍，ReLU 為 3.71 倍。linear 和論文同一量級，因此推論論文使用 Keras 預設值。</p>', source: SRC.relu },
    dropout: { title: 'Dropout 0.5', explain: '<p>Dropout 放在最後一層 Dense 1 之前。訓練時每個神經元有 50% 機率輸出 0（其餘放大 2 倍），可降低過擬合；<code>predict()</code> 時不會丟棄。</p>' },
  } },

// 8 LSTM1D/2D/3D
{ section: S2, phase: 'two', title: 'LSTM1D / 2D / 3D：同一個函式疊不同層數', source: 'djia_reproduction.ipynb · build_lstm() / build_baseline()',
  html: `<div class="impl-body tall" style="display:flex;flex-direction:column;gap:9px">
    ${seq('s1', 'LSTM1D', '', [L('in', 'Input', '(20, 1)'), L('lstm', 'LSTM 10', '(10)'), L('dense', 'Dense 10', '(10)'), L('drop', 'Dropout', '(10)'), L('out', 'Dense 1', '(1)')], '<b>601</b>')}
    ${seq('s2', 'LSTM2D', '', [L('in', 'Input', '(20, 1)'), L('lstm', 'LSTM 10', '(20, 10) 序列'), L('lstm', 'LSTM 10', '(10)'), L('dense', 'Dense 10', '(10)'), L('drop', 'Dropout', '(10)'), L('out', 'Dense 1', '(1)')], '<b>1,441</b>')}
    ${seq('s3', 'LSTM3D', '', [L('in', 'Input', '(20, 1)'), L('lstm', 'LSTM 10', '(20, 10) 序列'), L('lstm', 'LSTM 10', '(20, 10) 序列'), L('lstm', 'LSTM 10', '(10)'), L('dense', 'Dense 10', '(10)'), L('drop', 'Dropout', '(10)'), L('out', 'Dense 1', '(1)')], '<b>2,281</b>')}
    <div class="row" style="height:270px">
      ${code('lstmcode', 'build_lstm()', '完整', `def build_lstm(cfg: Config, lstm_units, dense_units, dropout, optimizer="Adam", lr=1e-3):
    k = _tf(cfg).keras
    m = k.Sequential([k.Input(shape=input_shape(cfg))])
    for i, u in enumerate(lstm_units):
        m.add(k.layers.LSTM(u, return_sequences=i < len(lstm_units) - 1))
    m.add(k.layers.Dense(dense_units, activation=_act(cfg)))
    m.add(k.layers.Dropout(dropout))
    m.add(k.layers.Dense(1))
    m.compile(optimizer=getattr(k.optimizers, optimizer)(learning_rate=lr), loss="mse")
    return m`, {style: 'width:710px;flex:none'})}
      ${card('retseq', 'return_sequences', '<p>除了最後一層，LSTM 都輸出整段 20 步的序列，下一層才有 20 步可讀。</p><p>固定模型：<span class="mono">build_lstm(cfg, [10] * depth, 10, 0.5)</span>，depth = 1、2、3。</p>', {tone: 'tone-blue', style: 'flex:1'})}
    </div></div>`,
  lesson: { explain: '<p>三個固定 LSTM 模型與 GA／ARO 共用同一個 <code>build_lstm()</code>：傳入每層的神經元數清單即可。固定模型是 <code>[10]</code>、<code>[10, 10]</code>、<code>[10, 10, 10]</code>，Dense 10、Dropout 0.5、Adam 0.001。</p>', code: fullCode('build_lstm', 'build_baseline'), source: SRC.nb + SRC.paper },
  items: {
    s1: { title: 'LSTM1D', explain: '<p>單層 LSTM 讀完 20 天後，輸出最後一步的 hidden state（10 維）。</p>' },
    s2: { title: 'LSTM2D', explain: '<p>第一層 <code>return_sequences=True</code>，輸出 (20, 10)；第二層讀這 20 步，只輸出最後一步 (10)。</p>' },
    s3: { title: 'LSTM3D', explain: '<p>前兩層都輸出序列。層數加深後參數變多，但每檔只有約 990 筆訓練資料，3 層反而最差：平均名次 5.8（6 個模型中）。</p>' },
    lstmcode: { title: 'build_lstm()', explain: '<p><code>return_sequences=i &lt; len(lstm_units) - 1</code>：只有最後一層是 False。optimizer 以字串取得，例如 <code>getattr(k.optimizers, "RMSprop")</code>，讓搜尋結果可以直接套用。</p>', code: fullCode('build_lstm', 'build_baseline') },
    retseq: { title: 'return_sequences', explain: '<p>LSTM 疊層時，下一層需要一個序列當輸入。<code>return_sequences=True</code> 讓 LSTM 每個時間步都輸出 hidden state，形狀 (20, 10)；False 時只輸出最後一步，形狀 (10)。</p>' },
  } },

// 9 編碼
{ section: S2, phase: 'two', title: '搜尋空間：[0, 1]⁹ 的向量 → 一個 LSTM 架構', source: '論文 Table 6 · SEARCH_SPACE / decode() / hp_to_arch()',
  html: `<div class="impl-body"><div class="row">
    ${table('space', ['維度', '選項'], [
      ['x₀ LSTM 1 神經元', '1–20'], ['x₁ 有無 LSTM 2', '0、1'], ['x₂ LSTM 2 神經元', '1–20'], ['x₃ 有無 LSTM 3', '0、1'], ['x₄ LSTM 3 神經元', '1–20'],
      ['x₅ Dense 神經元', '1–20'], ['x₆ Dropout', '0.3–0.7（5 種）'], ['x₇ Optimizer', 'Adagrad、Adam、Adamax、RMSprop、SGD'], ['x₈ Learning rate', '10⁻²～10⁻⁶（5 種）'],
    ], {cls: 'compact fill', style: 'width:552px;flex:none'})}
    <div class="col f1">
      ${code('decode', 'decode() / hp_to_arch()', '節錄', `def decode(x: np.ndarray) -> dict:
    return {name: ch[min(max(int(float(v) * len(ch)), 0), len(ch) - 1)]
            for v, (name, ch) in zip(x, SEARCH_SPACE)}

def hp_to_arch(hp: dict) -> dict:
    units = [hp["x0_lstm1_units"]]
    if hp["x1_lstm2_exists"]:
        units.append(hp["x2_lstm2_units"])
    if hp["x3_lstm3_exists"]:
        units.append(hp["x4_lstm3_units"])
    return dict(lstm_units=units, dense_units=hp["x5_dense_units"], ...)`, {style: 'flex:none'})}
      ${card('example', '例：x = [0.62, 0.71, 0.33, 0.12, 0.90, 0.48, 0.25, 0.30, 0.05]', '<p>→ LSTM 13 → LSTM 7 → Dense 10 → Dropout 0.4，Adam，lr 0.01</p><p style="color:#60708a">0.62 × 20 = 12.4 → 第 12 個選項（13）；x₃ = 0.12 → 0，沒有第 3 層</p>', {tone: 'tone-green', style: 'flex:1'})}
    </div></div></div>`,
  lesson: { explain: '<p>GA 與 ARO 都在連續空間 [0, 1]⁹ 中移動。<code>decode()</code> 把每一維等分成「選項數」個區間，落在第幾個區間就取第幾個選項。這樣兩種演算法可以共用同一套編碼與 fitness。</p><p>不存在的 LSTM 層，其神經元數（x₂ 或 x₄）不影響架構，所以不同的 x 可能對應到同一個架構。</p>', code: fullCode('SEARCH_SPACE', 'decode', 'hp_to_arch', 'arch_key'), widget: 'decode', source: SRC.nb + SRC.paper },
  items: {
    space: { title: '9 維搜尋空間（Table 6）', explain: '<p>每一維都是離散選項。總組合數約 20 × (1 + 20) × (1 + 20) × 20 × 5 × 5 × 5 ≈ 2,200 萬種（不計重複）。我們每檔只評估約 60–80 個。</p>', code: fullCode('SEARCH_SPACE'), widget: 'decode' },
    decode: { title: 'decode() 與 hp_to_arch()', explain: '<p><code>int(v × len(ch))</code> 把 [0, 1) 映射到 0 … len−1；v = 1.0 時用 <code>min(…, len−1)</code> 夾住。</p>', code: fullCode('decode', 'hp_to_arch', 'arch_key'), widget: 'decode' },
    example: { title: '解碼範例', explain: '<p>逐維計算：</p><table><tr><th>維度</th><th>計算</th><th>結果</th></tr><tr><td>x₀</td><td>int(0.62×20)=12</td><td>13 個神經元</td></tr><tr><td>x₁</td><td>int(0.71×2)=1</td><td>有第 2 層</td></tr><tr><td>x₂</td><td>int(0.33×20)=6</td><td>7 個神經元</td></tr><tr><td>x₃</td><td>int(0.12×2)=0</td><td>沒有第 3 層</td></tr><tr><td>x₅</td><td>int(0.48×20)=9</td><td>Dense 10</td></tr><tr><td>x₆</td><td>int(0.25×5)=1</td><td>Dropout 0.4</td></tr><tr><td>x₇</td><td>int(0.30×5)=1</td><td>Adam</td></tr><tr><td>x₈</td><td>int(0.05×5)=0</td><td>lr 0.01</td></tr></table>', widget: 'decode' },
  } },

// 10 Fitness
{ section: S2, phase: 'two', title: 'Fitness：訓練候選架構、回傳 MSE', source: 'djia_reproduction.ipynb · class Fitness',
  html: `<div class="impl-body"><div class="row">
    ${code('fitcode', 'Fitness.__call__()', '節錄', `    def __call__(self, x: np.ndarray) -> float:
        self.n_calls += 1
        arch = hp_to_arch(decode(x))
        key = arch_key(arch)
        if key in self.cache:
            return self.cache[key]
        cfg, d = self.cfg, self.data
        _tf(cfg).keras.backend.clear_session()
        set_seed(cfg, self.base_seed + zlib.crc32(key.encode()) % 100_000)
        model = build_lstm(cfg, **arch)
        t = time.time()
        if cfg.use_validation:
            ep = fit_model(cfg, model, d.X_fit, d.y_fit, cfg.search_epochs,
                           patience=cfg.search_patience, val=(d.X_eval, d.y_eval))
        else:
            ep = fit_model(cfg, model, d.X_fit, d.y_fit, cfg.search_epochs)
        mse = float(np.mean((d.inverse(d.y_eval) - d.inverse(predict(cfg, model, d.X_eval))) ** 2))
        # …（略：寫入快取與 candidates.jsonl）`, {style: 'width:790px;flex:none'})}
    <div class="col f1">
      ${card('cache', '相同架構只訓練一次', '<p>ARO 平均每檔 110 次呼叫只需訓練 81 個，GA 62 個。</p>', {tone: 'tone-green'})}
      ${card('seed', 'seed 由架構決定', '<p>同一架構不論何時被評估，結果都相同。</p>', {tone: 'tone-blue'})}
      ${card('resume', '可續跑', '<p>每次評估寫入 candidates.jsonl，斷線後讀回當快取。</p>', {tone: 'tone-gold'})}
      ${card('evalset', 'eval 集', '<p>論文模式：測試集<br>驗證集模式：驗證集</p>', {tone: 'tone-red'})}
    </div></div></div>`,
  lesson: { explain: '<p>GA 與 ARO 都把 <code>Fitness</code> 當成黑盒函式：給一個 x，回傳 MSE（越小越好）。每次呼叫會解碼成架構、訓練 20 epochs，再算 eval 集在原始價格尺度上的 MSE。</p><p>這裡的 MSE 就是之後結果中的 <code>best_fitness</code>。</p>', code: fullCode('Fitness', 'fit_model'), source: SRC.nb },
  items: {
    fitcode: { title: 'Fitness.__call__()', explain: '<p>每次訓練前先 <code>clear_session()</code> 清掉前一個模型，避免記憶體越用越多。fitness 不是 NaN 或 inf 才寫入快取，發散的模型直接得到 inf。</p>', code: fullCode('Fitness') },
    cache: { title: '快取', explain: '<p>族群收斂後，很多兔子／染色體會解碼成同一個架構。用 <code>arch_key()</code>（架構的 JSON 字串）當 key，直接回傳舊的 MSE。</p><p>GA 收斂得比較快，重複較多，所以實際訓練數比 ARO 少。</p>', code: fullCode('arch_key') },
    seed: { title: '架構決定 seed', explain: '<p>seed = 股票的搜尋 seed + crc32(架構 key) mod 100,000。這讓 GA 和 ARO 若評估到同一個架構，得到完全相同的 MSE，比較才公平；也讓中斷續跑的結果和一次跑完相同。</p>' },
    resume: { title: '續跑', explain: '<p>Colab 免費版會斷線。重跑時 <code>Fitness</code> 會先讀回 <code>candidates.jsonl</code>，搜尋演算法用同一個亂數 seed 重新走一遍，已訓練的架構直接命中快取，所以最多損失正在訓練的那一個模型。</p>' },
    evalset: { title: 'eval 集', explain: '<p>由 <code>prepare()</code> 決定：論文模式 <code>X_eval = X_test</code>；驗證集模式 <code>X_eval</code> 是訓練集最後 20%，此時候選模型只用前 80% 訓練。</p>', code: fullCode('prepare') },
  } },

// 11 ARO
{ section: S2, phase: 'two', title: 'ARO：論文 Eq. 6–20 的實作', source: 'djia_reproduction.ipynb · aro()',
  html: `<div class="impl-body tall" style="display:flex;flex-direction:column;gap:12px">
    ${code('arocode', 'aro()', '節錄：主迴圈', `    for t in range(1, T + 1):
        for i in range(n):
            L = (math.e - math.exp(((t - 1) / T) ** 2)) * math.sin(2 * math.pi * rng.random())  # Eq. 8
            c = np.zeros(d)
            c[rng.permutation(d)[: math.ceil(rng.random() * d)]] = 1                             # Eq. 9–10
            R = L * c                                                                            # Eq. 7
            A = 4 * (1 - t / T) * math.log(1 / max(rng.random(), 1e-12))                        # Eq. 20
            if A > 1:   # 迂迴覓食（探索）Eq. 6
                j = rng.choice([k for k in range(n) if k != i])
                v = X[j] + R * (X[i] - X[j]) + round(0.5 * (0.05 + rng.random())) * rng.standard_normal()
            else:       # 隨機躲藏（開發）Eq. 13, 16–18
                H = (T - t + 1) / T * rng.standard_normal()
                g = np.zeros(d)
                g[math.ceil(rng.random() * d) - 1] = 1
                b = X[i] + H * g * X[i]
                v = X[i] + R * (rng.random() * b - X[i])
            v = np.clip(v, lb, ub)
            fv = fobj(v)
            if fv < fit[i]:  # Eq. 19
                X[i], fit[i] = v, fv
                if fv < best_f:
                    best_x, best_f = v.copy(), float(fv)`, {lh: '1.42'})}
    <div class="grid3" style="flex:none;height:44px">
      ${strip('energy', 'A &gt; 1 → 繞路覓食（探索）', '')}
      ${strip('hide', 'A ≤ 1 → 隨機躲藏（開發）', 'gold')}
      ${strip('greedy', '變好才取代（貪婪選擇）', 'red')}
    </div></div>`,
  lesson: { explain: '<p>每一代、每一隻兔子都先算能量 A：前期 A 多半大於 1，偏向參考其他兔子的位置（探索）；後期 A 變小，偏向在自己附近搜尋（開發）。新位置經 Fitness 評估後，只有比原本好才取代。</p><p>每一代評估 n 次，加上初始族群，共 n × (T + 1) = 110 次呼叫。</p>', code: fullCode('aro'), widget: 'energy', source: SRC.nb + SRC.paper },
  items: {
    arocode: { title: 'aro()', explain: '<p>對照論文：</p><ul><li><b>L</b>（Eq. 8）：奔跑長度，隨迭代遞減。</li><li><b>c</b>（Eq. 9–10）：隨機選幾個維度設為 1，只在這些維度移動。</li><li><b>R = L·c</b>（Eq. 7）。</li><li><b>A</b>（Eq. 20）：能量因子。</li></ul><p>最後用 <code>np.clip</code> 夾回 [0, 1]，避免解碼越界。</p>', code: fullCode('aro'), widget: 'energy' },
    energy: { title: '繞路覓食（Eq. 6）', explain: '<p>v = X<sub>j</sub> + R·(X<sub>i</sub> − X<sub>j</sub>) + round(0.5·(0.05 + r))·N(0, 1)。隨機挑另一隻兔子 j，往牠附近移動，並偶爾加上常態擾動。</p>', widget: 'energy' },
    hide: { title: '隨機躲藏（Eq. 13–18）', explain: '<p>在自己的位置上隨機挑一個維度產生「洞穴」b = X<sub>i</sub> + H·g·X<sub>i</sub>，H 隨迭代遞減，再往洞穴移動。這是在目前解附近的小範圍搜尋。</p>', widget: 'energy' },
    greedy: { title: '貪婪選擇（Eq. 19）', explain: '<p>新位置的 fitness 比原本小才取代，否則保留原位置。所以每隻兔子的 fitness 只會變好或不變，全域最佳 best_f 也單調下降。</p>' },
  } },

// 12 GA
{ section: S2, phase: 'two', title: 'GA：論文未給細節，採常見設定', source: 'djia_reproduction.ipynb · ga()',
  html: `<div class="impl-body"><div class="row">
    ${code('gacode', 'ga()', '節錄', `    def select():
        idx = rng.choice(n, size=min(tournament, n), replace=False)
        return P[idx[np.argmin(fit[idx])]]

    for _ in range(max_iter):
        children = [P[np.argmin(fit)].copy()]  # 菁英保留 1
        while len(children) < n:
            p1, p2 = select(), select()
            child = np.where(rng.random(d) < 0.5, p1, p2) if rng.random() < pc else p1.copy()
            mask = rng.random(d) < pm
            child[mask] = rng.uniform(lb, ub, mask.sum())
            children.append(child)
        P = np.array(children)
        fit = np.array([fobj(x) for x in P])
        history.append(float(fit.min()))`, {style: 'width:740px;flex:none'})}
    <div class="col f1">
      ${card('tour', '選擇：tournament 3', '<p>隨機抽 3 個，取最好的當父母。</p>', {tone: 'tone-blue'})}
      ${card('cross', '交配：uniform 0.8', '<p>80% 機率逐維隨機從兩個父母取值。</p>', {tone: 'tone-green'})}
      ${card('mut', '突變：1/9', '<p>每一維有 1/9 機率重設為 [0, 1] 的亂數。</p>', {tone: 'tone-gold'})}
      ${card('elite', '菁英保留 1', '<p>上一代最好的個體直接進入下一代。</p>', {tone: 'tone-purple'})}
    </div></div></div>`,
  lesson: { explain: '<p>論文只說用 GA 當比較對象，沒有給選擇、交配、突變的設定，我們採用常見的組合。GA 與 ARO 使用<b>相同的初始族群、族群大小與迭代數</b>，fitness 也共用同一個快取機制，差別只在產生新候選的方式。</p><p>GA 每代整批換掉（只保留 1 個菁英）；ARO 是每隻兔子各自「變好才換」。</p>', code: fullCode('ga'), source: SRC.nb + SRC.paper },
  items: {
    gacode: { title: 'ga()', explain: '<p>每一代：保留最好的 1 個，其餘 9 個由「選擇 → 交配 → 突變」產生，然後整代重新評估。已評估過的架構會命中快取，不會重新訓練。</p>', code: fullCode('ga') },
    tour: { title: 'Tournament selection', explain: '<p>從族群隨機抽 3 個（不重複），取 fitness 最小的。抽到好個體的機率較高，但差的個體仍有機會，避免太快收斂。</p>' },
    cross: { title: 'Uniform crossover', explain: '<p>以 0.8 的機率交配：每一維擲硬幣，決定從 p1 或 p2 取值；否則直接複製 p1。</p>' },
    mut: { title: '突變', explain: '<p>pm = 1 / 維度數 = 1/9，平均每個子代有一維被重設為均勻亂數，用來跳出局部最佳。</p>' },
    elite: { title: '菁英保留', explain: '<p>沒有菁英保留的話，最好的解可能在下一代消失。保留 1 個讓每代的最佳 fitness 不會變差。</p>' },
  } },

// 13 final_eval
{ section: S2, phase: 'two', title: '最終評估：5 個 seed 重訓取平均', source: 'djia_reproduction.ipynb · final_eval() / fit_model()',
  html: `<div class="impl-body"><div class="row">
    ${code('finalcode', 'final_eval()', '節錄', `def final_eval(cfg: Config, data: Data, build_fn):
    rows, preds = [], []
    y_true = data.inverse(data.y_test)
    for s in range(cfg.final_seeds):
        _tf(cfg).keras.backend.clear_session()
        set_seed(cfg, cfg.seed + s)
        model = build_fn()
        t = time.time()
        if cfg.use_validation:
            ep = fit_model(cfg, model, data.X_train, data.y_train, cfg.final_epochs,
                           patience=cfg.final_patience, val_split=0.1)
        else:
            ep = fit_model(cfg, model, data.X_train, data.y_train, cfg.final_epochs)
        p = data.inverse(predict(cfg, model, data.X_test))
        rows.append(dict(seed=cfg.seed + s, **metrics(y_true, p), epochs=ep,
                         train_s=round(time.time() - t, 2)))
        preds.append(p)
    return rows, np.mean(preds, axis=0)`, {style: 'width:680px;flex:none'})}
    <div class="col f1">
      ${card('seeds', '5 個 seed', '<p>seed 42–46，指標取平均並記錄標準差。</p>', {tone: 'tone-blue'})}
      ${card('modepaper', '論文模式', '<p>固定 50 epochs。</p>', {tone: 'tone-red'})}
      ${card('modeval', '驗證集模式', '<p>early stopping patience 10，還原最佳權重。</p>', {tone: 'tone-green'})}
      ${card('metrics', '四個指標', '<p>MSE、MAE、MAPE、R²，原始價格尺度。</p>', {tone: 'tone-gold'})}
    </div></div></div>`,
  lesson: { explain: '<p>所有模型（固定架構與搜尋出的架構）都走同一個 <code>final_eval()</code>，用全部訓練集重新訓練 50 epochs，再在測試集上評估。這是我們報告的主要數字（<code>MSE</code>）；搜尋時那一次的 MSE 另外記為 <code>best_fitness</code>。</p>', code: fullCode('final_eval', 'fit_model', 'metrics'), source: SRC.nb },
  items: {
    finalcode: { title: 'final_eval()', explain: '<p><code>build_fn</code> 是一個建立模型的函式，所以同一段程式可以評估 ANN、LSTM1D/2D/3D 或搜尋出的架構。預測圖用的是 5 個 seed 的平均預測值。</p>', code: fullCode('final_eval') },
    seeds: { title: '為什麼要 5 個 seed？', explain: '<p>小型 LSTM 對初始權重很敏感。我們的結果中，同一架構換 seed 的 MSE 標準差約為平均的 15–44%。只跑一次的結果可能剛好很好或很差。</p>' },
    modepaper: { title: '論文模式：固定 epochs', explain: '<p><code>fit_model(..., patience=None)</code> 直接跑滿 50 epochs，不看驗證集。</p>', code: fullCode('fit_model') },
    modeval: { title: '驗證集模式：early stopping', explain: '<p>從訓練集最後 10% 切出驗證資料，監看 val_loss；連續 10 個 epoch 沒有改善就停止，並還原 val_loss 最低時的權重。實際平均訓練 33–41 epochs。</p>', code: fullCode('fit_model') },
    metrics: { title: '評估指標（Eq. 21–24）', explain: '<p>MAPE 以比例回報（0.02 = 2%），和論文表格的數值格式一致。R² = 1 − SSE / SST。</p>', code: fullCode('metrics') },
  } },

// 14 分工
{ section: S2, phase: 'two', title: '三人分工：Colab 平行跑、可續跑、可合併', source: 'djia_reproduction.ipynb · shard_tickers() / compatible()',
  html: `<div class="impl-body tall" style="gap:16px"><div class="row">
      ${code('shard', 'shard_tickers() / compatible()', '完整', `def shard_tickers(tickers: List[str], shard: Optional[str]) -> List[str]:
    """shard = "k/n"：輪流分配（第 k 份取 tickers[k-1::n]），各份的股票數與長短都較平均。"""
    if not shard:
        return list(tickers)
    k, n = (int(v) for v in shard.split("/"))
    if not 1 <= k <= n:
        raise ValueError(f"SHARD 應為 k/n 且 1 ≤ k ≤ n，收到 {shard!r}")
    return list(tickers)[k - 1::n]

def compatible(cfg: Config, info: dict) -> List[str]:
    """回傳與目前設定不一致的欄位（空 list = 可合併）。"""
    c = info.get("config", {})
    keys = list(FP_FIELDS) + (["pop_size", "iterations"] if info.get("model") in SEARCHERS else [])
    return [k for k in keys if c.get(k) != getattr(cfg, k)]`, {style: 'width:790px;flex:none'})}
      ${card('drive', '斷線可續跑', '<p>結果存在 Google Drive；重新「全部執行」會從中斷處接著跑。</p><p>三人分工後每人約 3.4 小時（論文模式，Colab T4）。</p>', {tone: 'tone-green', style: 'flex:1'})}
    </div>
    ${table('time', ['搜尋時間（29 檔合計）', '>論文模式', '>驗證集', '>每檔訓練架構數'], [['LSTM-ARO', '10.5 h', '8.7 h', '81'], ['LSTM-GA', '9.7 h', '6.7 h', '62']])}
    </div>`,
  lesson: { explain: '<p>29 檔輪流分成 3 份（10 / 10 / 9 檔），每人在自己的 Colab 上跑同一份 notebook，只改 <code>SHARD</code>。每個結果都附上完整設定與資料指紋，合併時逐欄比對。</p>', code: fullCode('shard_tickers', 'compatible', 'merge_results'), source: SRC.nb + SRC.plan },
  items: {
    shard: { title: '分工與相容性檢查', explain: '<p>輪流分配（第 k 份取 <code>tickers[k-1::n]</code>）讓每份的股票數接近，資料較短的 DOW 也不會集中在同一份。</p><p><code>FP_FIELDS</code> 包含所有會影響結果的設定（epochs、seed、評估模式、Dense 激活、資料指紋等）；執行緒數、是否用 GPU 不影響結果，不列入。</p>', code: fullCode('shard_tickers', 'compatible') },
    drive: { title: '斷線續跑', explain: '<p>每個「股票 × 模型」完成時寫 <code>done.json</code>；搜尋中的候選寫在 <code>candidates.jsonl</code>。重新執行時已完成的跳過、搜尋中的從快取接著跑。</p>' },
    time: { title: '執行時間', explain: '<p>驗證集模式的搜尋比較快，因為 early stopping 讓候選模型提早停止。每檔實際訓練的架構數兩種模式幾乎相同。</p>' },
  } },

// 15 Q1：我們 ÷ 論文（兩種模式並列）
{ section: S3, phase: 'three', title: '固定架構和論文一致，GA / ARO 差 1.5–2 倍', source: 'djia_results.md §2、§8.1',
  html: `<div class="impl-body" style="gap:14px">
    <p class="impl-lead" style="margin:0">我們的 MSE ÷ 論文 Table 7 的 MSE（29 檔幾何平均；虛線 = 1.00，完全一致）</p>
    ${bars('ratio', [['LSTM1D', .93, .87], ['LSTM2D', .92, 1.17], ['ANN', 1.10, 1.18], ['LSTM3D', 1.46, 1.49], ['LSTM-GA', 2.00, 1.48], ['LSTM-ARO', 2.19, 1.58]], 2.4, {v: 1, label: '論文 = 1.00'})}
    ${strip('fitness', '論文模式搜尋時那一次的測試 MSE（best_fitness）：GA 為論文的 1.04 倍、ARO 為 1.18 倍，幾乎一致', 'gold')}
  </div>`,
  lesson: { explain: '<p>固定架構（LSTM1D／2D／3D、ANN）不做超參數搜尋，兩種模式的 MSE 都和論文同一量級，表示資料、前處理、模型結構都對得上。</p><p>差距集中在 GA／ARO：論文模式約為論文的 2 倍，驗證集模式約 1.5 倍。但論文模式搜尋時的 <code>best_fitness</code> 和論文幾乎一致，論文報告的很可能就是這個數字。接下來兩頁說明原因。</p><p>幾何平均之下各檔差異很大，可到「動態演算」逐檔查看。</p>', widget: 'perTicker', source: SRC.results },
  items: {
    ratio: { title: 'MSE ÷ 論文', widget: 'perTicker', explain: '<p>每一檔先算「我們 ÷ 論文」，再取 29 檔的幾何平均（比值適合用幾何平均，不會被少數極端值主導）。WMT 已乘 9 換算分割。</p><table><tr><th>模型</th><th>論文模式</th><th>（中位數）</th><th>驗證集</th></tr><tr><td>LSTM1D</td><td>0.93</td><td>1.01</td><td>0.87</td></tr><tr><td>LSTM2D</td><td>0.92</td><td>1.05</td><td>1.17</td></tr><tr><td>ANN</td><td>1.10</td><td>0.95</td><td>1.18</td></tr><tr><td>LSTM3D</td><td>1.46</td><td>1.40</td><td>1.49</td></tr><tr><td>LSTM-GA</td><td>2.00</td><td>1.75</td><td>1.48</td></tr><tr><td>LSTM-ARO</td><td>2.19</td><td>1.69</td><td>1.58</td></tr></table><p>固定架構兩種模式唯一的差別是最終訓練是否 early stopping，只有 LSTM2D 顯著變差（26 / 29 檔），其他三個的差異都不顯著。</p>' },
    fitness: { title: 'best_fitness', explain: '<p><code>best_fitness</code> 是 Fitness 在搜尋過程中回傳的最小 MSE。論文模式下 eval 集就是測試集，所以它是「用測試集挑出來的那一次訓練」在測試集上的成績，和論文的流程完全相同。</p><p>驗證集模式的 best_fitness 是驗證集（2021 年前後）的 MSE，價格水準和測試集不同，不能和論文直接比，所以不列。</p>' },
  } },

// 16 論文模式的選擇偏誤
{ section: S3, phase: 'three', title: '論文模式用測試集挑架構，挑到的是「碰巧好的那一次」', source: 'djia_results.md §4',
  html: `<div class="impl-body"><div class="row" style="height:290px">
    <div class="col f1" style="gap:10px">
      ${card('m1', '① 搜尋', '<p>每個架構只訓練一次，直接拿測試集 MSE 當 fitness</p>', {tone: 'tone-blue'})}
      ${card('m2', '② 挑選', '<p>從約 80 個「架構 × 隨機初始化」中挑出測試集上最好的</p>', {tone: 'tone-gold'})}
      ${card('m3', '③ 重訓', '<p>同一架構換 5 個 seed，表現回到平均水準</p>', {tone: 'tone-red'})}
    </div>
    ${card('gap', '最終 ÷ 搜尋時 fitness', '<p>中位數：ARO 1.47、GA 1.51</p>', {stat: '× 1.5', statTone: 'red', style: 'width:270px;flex:none'})}
    ${card('cv', 'seed 間標準差 ÷ 平均', '<p>GA／ARO 選出的架構；固定架構只有 15–30%</p>', {stat: '41–44%', statTone: 'red', style: 'width:270px;flex:none'})}
  </div><div style="height:16px"></div>
  ${table('worst', ['落差最大的例子', '選出的架構', '>搜尋時 fitness', '>5-seed MSE'], [
    ['MMM · ARO', 'LSTM [1]、Adagrad / 0.01', '12.90', '<span class="bad">547.78 ± 420.61</span>'],
    ['VZ · ARO', 'LSTM [6]、SGD / 0.001', '2.51', '<span class="bad">42.74 ± 29.07</span>'],
    ['BA · GA', 'LSTM [7]、RMSprop / 0.01', '33.92', '<span class="bad">338.67 ± 578.44</span>'],
    ['CVX · GA', 'LSTM [18]、RMSprop / 0.01', '15.22', '<span class="bad">131.56 ± 138.85</span>'],
  ])}</div>`,
  lesson: { explain: '<p>這是「用測試集挑超參數」的選擇偏誤：候選越多、每個候選越不穩定，挑出來的分數就越樂觀。換 seed 重訓後，分數會回到這個架構真正的平均水準。</p><p>可切到「動態演算」模擬：從 N 個有雜訊的候選中挑最好的，再重訓一次會差多少。</p>', widget: 'selection', source: SRC.results },
  items: {
    m1: { title: '搜尋', explain: '<p>每個架構只用一個 seed 訓練一次。小型 LSTM 的結果受初始權重影響很大，同一架構換 seed 可能差好幾倍。</p>', widget: 'selection' },
    m2: { title: '挑選', explain: '<p>從約 80 個候選中取最小值，會偏向「架構還可以、這次又剛好很幸運」的候選。</p>', widget: 'selection' },
    m3: { title: '重訓', explain: '<p>重訓時運氣成分重新抽一次，平均下來就失去了挑選時的好運。</p>', widget: 'selection' },
    gap: { title: '重訓落差', explain: '<p>每一檔算「5-seed 平均 MSE ÷ best_fitness」，29 檔的中位數約 1.5。</p>' },
    cv: { title: 'seed 間波動', explain: '<p>固定架構的 seed 間波動：LSTM2D 0.15、LSTM3D 0.20、LSTM1D 0.26、ANN 0.30。搜尋選出的架構更不穩定，因為挑選過程偏好「這次剛好好」的架構。</p>' },
    worst: { title: '落差最大的例子', explain: '<p>共同點：神經元很少（1 個）、SGD 或 Adagrad 這類在 20 epochs 內不一定收斂的設定。這些架構在某個 seed 下碰巧很好，就被選中。</p>' },
  } },

// 17 驗證集模式
{ section: S3, phase: 'three', title: '改用驗證集挑架構，GA / ARO 反而更好', source: 'djia_results.md §8.1、§8.3',
  html: `<div class="impl-body"><div class="grid4" style="height:190px">
    ${card('aro', 'ARO 最終 MSE', '<p>21 / 29 檔變好</p>', {stat: '−28%'})}
    ${card('ga', 'GA 最終 MSE', '<p>18 / 29 檔變好</p>', {stat: '−26%'})}
    ${card('stab', 'seed 間波動 ARO / GA', '<p>論文模式為 41% / 44%</p>', {stat: '24 / 23%'})}
    ${card('l2', 'LSTM2D 最終 MSE', '<p>唯一明顯變差（26 / 29 檔）</p>', {stat: '+27%', statTone: 'gold', tone: 'tone-gold'})}
  </div><div style="height:18px"></div>
  <div class="row">
    ${table('opt', ['選出的 optimizer / lr（58 個）', '>論文模式', '>驗證集'], [['Adam / 0.01', '28', '36'], ['RMSprop / 0.01', '14', '13'], ['Adamax / 0.01', '6', '3'], ['SGD、Adagrad', '有', '0'], ['最終訓練 epochs', '50', '33–41']], {cls: 'fill', style: 'flex:1'})}
    <div class="col" style="width:470px;flex:none">
      ${card('why1', '挑到的架構比較穩定', '<p>驗證集的 fitness 和測試集無關，碰巧成分不會帶到測試成績。</p>', {tone: 'tone-green'})}
      ${card('why2', '最終訓練有 early stopping', '<p>還原驗證 loss 最低的權重，減少大學習率後期震盪。</p>', {tone: 'tone-blue'})}
    </div></div></div>`,
  lesson: { explain: '<p>驗證集版本只改了兩件事：fitness 改用驗證集、訓練加上 early stopping。結果 GA／ARO 的最終 MSE 平均下降約 3 成，和論文的差距從約 2 倍縮小到約 1.5 倍。</p><p>這表示用測試集挑超參數不只讓分數偏樂觀，還會挑到重訓後比較差的架構。</p>', source: SRC.results },
  items: {
    aro: { title: 'ARO：驗證集 ÷ 論文模式', explain: '<p>幾何平均 0.72、中位數 0.87；21 / 29 檔變好，Wilcoxon p = 0.053。</p>' },
    ga: { title: 'GA：驗證集 ÷ 論文模式', explain: '<p>幾何平均 0.74、中位數 0.74；18 / 29 檔變好，Wilcoxon p = 0.022。</p>' },
    stab: { title: '穩定度', explain: '<p>選出架構的 seed 間標準差 ÷ 平均，中位數從 0.41 / 0.44 降到 0.24 / 0.23，接近固定架構的水準。</p>' },
    l2: { title: 'LSTM2D 變差', explain: '<p>幾何平均 1.27，29 檔中 26 檔變差（p &lt; 0.001）。可能是 early stopping 只看訓練集最後 10%，讓這個架構太早停止，目前還沒驗證。其他固定架構的變化都不顯著。</p>' },
    opt: { title: '選出的設定', explain: '<p>搜尋時只訓練 20 epochs，學習率 0.01 收斂最快，兩種模式都以它為主。驗證集模式完全沒有選到 SGD 或 Adagrad。</p>' },
    why1: { title: '為什麼比較穩定？', explain: '<p>驗證集模式的 fitness 一樣會挑到「在驗證集上碰巧好」的候選，但這份好運和測試集無關，不會讓測試成績變差；同時驗證集上表現好的架構，多半本身就比較穩定。</p>' },
    why2: { title: 'early stopping 的效果', explain: '<p>學習率 0.01 的模型在後期容易震盪，固定跑滿 50 epochs 可能停在一個較差的位置。<code>restore_best_weights=True</code> 會回到驗證 loss 最低的那個 epoch。</p>', code: fullCode('fit_model') },
  } },

// 18 Q2：排名（三方）
{ section: S4, phase: 'three', title: '排名：自動搜尋 ＞ 固定架構，ARO 與 GA 相當', source: 'djia_results.md §3、§8.2',
  html: `<div class="impl-body">
    ${table('rank', ['6 個論文模型，最終 MSE', '論文報告', '我們 · 論文模式', '我們 · 驗證集'], [
      ['拿第一的檔數', 'ARO 17、GA 10、1D 2', 'ARO 12、GA 11、其他 6', '<b>ARO 15、GA 13、ANN 1</b>'],
      ['平均名次 ARO / GA', '1.48 / 1.66', '2.03 / 2.34', '<b>1.66 / 1.59</b>'],
      ['平均名次 1D / 2D / 3D / ANN', '4.10 / 4.59 / 4.72 / 4.45', '3.07 / 3.55 / 5.83 / 4.17', '3.10 / 4.59 / 5.76 / 4.31'],
      {hl: true, cells: ['GA 或 ARO 勝過全部固定模型', '27 / 29', '23 / 29', '28 / 29']},
      ['ARO 比 GA 好的檔數', '17 / 29', '15 / 29（p = 0.80）', '15 / 29（p = 0.55）'],
    ])}
    <div style="height:18px"></div>
    <div class="grid2" style="height:180px">
      ${card('yes', '成立：自動搜尋 ＞ 固定架構','<p>ARO 對 LSTM1D／2D／3D／ANN 分別贏 25 / 24 / 27 / 24 檔（論文模式）、26 / 29 / 29 / 27 檔（驗證集），Wilcoxon 皆 p &lt; 0.01。</p>', {tone: 'tone-green'})}
      ${card('no', '沒有出現：ARO 的領先', '<p>論文中 ARO 拿第一 17 檔、GA 10 檔；我們兩種模式下 ARO 都在 15 / 29 檔勝過 GA（p = 0.80、0.55），兩者互有勝負，差異不顯著。</p>', {tone: 'tone-gold'})}
    </div></div>`,
  lesson: { explain: '<p>名次是每一檔股票在 6 個論文模型中依 MSE 排序，再取 29 檔的平均。論文的結果中，搜尋架構明顯優於固定架構，ARO 拿第一的次數最多。前者在我們兩種模式下都成立；後者沒有出現，ARO 和 GA 互有勝負。</p>', source: SRC.results },
  items: {
    rank: { title: '排名比較', explain: '<p>方向和論文一致：ARO、GA 排前兩名，LSTM3D 最後。論文模式的 GA／ARO 平均名次（2.03 / 2.34）比論文差，有 6 檔被固定架構贏過，原因是搜尋挑到重訓後不穩定的架構。</p><p>驗證集模式的 ARO／GA 平均名次（1.66 / 1.59）和論文（1.48 / 1.66）最接近。</p>' },
    yes: { title: 'Wilcoxon 檢定', explain: '<p>Wilcoxon signed-rank 檢定把 29 檔的 MSE 兩兩配對，檢查差值的中位數是否為 0。不假設常態分布，適合這種跨股票、數值尺度差很多的比較。</p><table><tr><th>ARO vs</th><th>論文模式</th><th>驗證集</th></tr><tr><td>LSTM1D</td><td>25 檔，p=0.006</td><td>26 檔，p&lt;0.001</td></tr><tr><td>LSTM2D</td><td>24 檔，p=0.003</td><td>29 檔，p&lt;0.001</td></tr><tr><td>LSTM3D</td><td>27 檔，p&lt;0.001</td><td>29 檔，p&lt;0.001</td></tr><tr><td>ANN</td><td>24 檔，p&lt;0.001</td><td>27 檔，p&lt;0.001</td></tr></table>' },
    no: { title: 'ARO vs GA', explain: '<p>兩種模式都是 15 / 29 檔，p = 0.80 與 0.55。在相同的初始族群與評估次數下，ARO 和 GA 找到的架構品質沒有顯著差別。用論文 Table 7 的數字做同樣的檢定，ARO 對 GA 為 17 / 29（p = 0.27），也不顯著。</p>' },
  } },

// 19 Q2：加大搜尋 15 × 15
{ section: S4, phase: 'three', title: '加大搜尋到 15 × 15：GA 改善較多，結論不變', source: 'djia_results.md §9 · results/djia_val_p15/all_results.csv',
  html: `<div class="impl-body"><p class="impl-lead" style="margin:0 0 12px">驗證集模式，族群 × 迭代從 10 × 10 加到 15 × 15（每檔評估 110 → 240 次）；固定架構與 NAIVE 沿用原結果</p>
  <div class="grid4" style="height:170px">
    ${card('ga', 'GA 最終 MSE', '<p>20 / 29 檔變好（p = 0.04）</p>', {stat: '−14%'})}
    ${card('aro', 'ARO 最終 MSE', '<p>14 / 29 檔變好（p = 0.23）</p>', {stat: '−8%', statTone: 'gold', tone: 'tone-gold'})}
    ${card('gar', 'GA ÷ 論文', '<p>10 × 10 為 1.48</p>', {stat: '1.27'})}
    ${card('aror', 'ARO ÷ 論文', '<p>10 × 10 為 1.58</p>', {stat: '1.46'})}
  </div><div style="height:18px"></div>
  <div class="row">
    ${table('vs', ['驗證集模式，最終 MSE', '>10 × 10', '>15 × 15'], [
      ['ARO 勝過 GA 的檔數', '15 / 29', '10 / 29（1 檔平手）'],
      ['Wilcoxon p（ARO vs GA）', '0.55', '0.09'],
      ['6 個論文模型中拿第一 ARO / GA', '15 / 13', '11 / 16'],
      ['ARO 勝過 LSTM1D／2D／3D／ANN', '26 / 29 / 29 / 27', '26 / 29 / 29 / 26'],
      {hl: true, cells: ['勝過 NAIVE 的檔數', '0 / 29', '0 / 29']},
    ], {cls: 'fill', style: 'flex:1'})}
    <div class="col" style="width:440px;flex:none">
      ${card('flip', '17 檔換了勝出者', '<p>ARO 和 GA 誰在某一檔勝出，主要取決於這次搜尋的隨機性。</p>', {tone: 'tone-gold'})}
      ${card('same', '結論不變', '<p>自動搜尋 ＞ 固定架構；ARO 與 GA 相當；仍未勝過 NAIVE。</p>', {tone: 'tone-green'})}
    </div></div></div>`,
  lesson: { explain: '<p>為了確認「ARO 與 GA 相當」不是搜尋預算太小造成的，我們把驗證集模式的族群與迭代加到 15，其他設定完全不變，同樣三人分工在 Colab 跑完 29 檔。</p><p>兩者和論文的差距都縮小，但改善幅度不同：GA 的最終 MSE 幾何平均下降 14%（顯著），ARO 只下降 8%（不顯著）。ARO 和 GA 的勝負從 15 比 14 變成 10 比 18，仍不顯著。</p>', source: SRC.results },
  items: {
    ga: { title: 'GA：15 × 15 ÷ 10 × 10', explain: '<p>最終 MSE 幾何平均 0.86，29 檔中 20 檔變好，Wilcoxon p = 0.041。搜尋時驗證集的最佳 fitness 有 23 / 29 檔變低。</p>' },
    aro: { title: 'ARO：15 × 15 ÷ 10 × 10', explain: '<p>最終 MSE 幾何平均 0.92，只有 14 / 29 檔變好，p = 0.23。</p><p>搜尋時驗證集的最佳 fitness 有 25 / 29 檔變低，但測試誤差沒有跟著下降：更大的搜尋找到了在驗證集上更好的架構，這個優勢沒有完全帶到測試集。變差最多的是 INTC（論文的 2.69 倍 → 12.0 倍）與 NKE（1.18 → 2.64）。</p>' },
    gar: { title: 'GA ÷ 論文', explain: '<p>29 檔幾何平均 1.48 → 1.27，中位數 1.31 → 1.12；比論文好的檔數 7 → 9。三種設定中最接近論文的一組。</p>' },
    aror: { title: 'ARO ÷ 論文', explain: '<p>29 檔幾何平均 1.58 → 1.46，中位數 1.36 → 1.32；比論文好的檔數 8 → 6。</p><p>15 × 15 選出的架構：24 / 29 檔只有 1 層 LSTM，28 / 29 檔學習率 0.01。</p>' },
    vs: { title: 'ARO vs GA', explain: '<p>四個指標的趨勢相同：15 × 15 時 GA 在 6 個論文模型中拿第一 14–16 檔，ARO 11–13 檔。</p><p>TRV 平手是因為兩者選到同一個架構，最終訓練的 seed 也相同，所以 MSE 完全一樣。</p>' },
    flip: { title: '勝出者的變動', explain: '<table><tr><th>10 × 10 → 15 × 15</th><th>檔數</th><th>股票</th></tr><tr><td>ARO → GA</td><td>11</td><td>AAPL AXP BA CSCO DIS HD HON IBM INTC NKE V</td></tr><tr><td>GA → ARO</td><td>6</td><td>AMGN CRM GS KO MCD PG</td></tr><tr><td>GA → 平手</td><td>1</td><td>TRV</td></tr><tr><td>都是 ARO</td><td>4</td><td>CAT DOW JNJ JPM</td></tr><tr><td>都是 GA</td><td>7</td><td>CVX MMM MRK MSFT UNH VZ WMT</td></tr></table><p>GA 與 ARO 每檔只搜尋一次（各一個演算法 seed），單一檔的勝負有很大的運氣成分；要比較演算法本身，需要同一檔用多個 seed 重複搜尋。</p>' },
    same: { title: '結論不變', explain: '<p>加大搜尋讓數字更接近論文，但沒有改變任何結論。考量每多一級預算的時間成本（15 × 15 約為 10 × 10 的 2 倍，25 × 25 估計再 2.5 倍），報告以 10 × 10 為主要結果，15 × 15 作為補充驗證。</p>' },
  } },

// 20 Q3：NAIVE 圖
{ section: S5, phase: 'three', title: '所有神經網路都輸給「明天 = 今天」', source: 'djia_results.md §5 · MSFT predictions.csv（論文模式）',
  html: `<div class="impl-body"><div class="row" style="height:520px">
    <div class="impl-chart f1" data-lesson="chart" style="display:flex;flex-direction:column">
      <div class="legend"><span><i style="background:#101a30"></i>實際</span><span><i style="background:#9fb0c8"></i>NAIVE（前一天）</span><span><i style="background:#e07a2e"></i>LSTM-ARO（論文模式，5 seed 平均）</span></div>
      ${msftChart('paper')}
      <p class="impl-lead" style="margin:10px 0 0;font-size:16px">MSFT 2022-10-06 ～ 12-30（測試期最後 60 天）。整段測試期 MSE：NAIVE ${MSFT.paper.mse_naive}、LSTM-ARO ${MSFT.paper.mse_aro}。ARO 的預測較平滑，轉折會慢一步。</p>
    </div>
    <div class="col" style="width:330px;flex:none">
      ${card('win', 'NAIVE 每一檔都第一', '<p>MSE、MAE、MAPE、R² 四個指標、兩種模式皆然。</p>', {stat: '29 / 29'})}
      ${card('mape', 'NAIVE 平均 MAPE', '<p>論文模式最好的 LSTM-GA 為 3.23%。</p>', {stat: '1.41%'})}
      ${card('paperaro', '也贏過論文的數字', '<p>NAIVE 的 MSE 低於論文報告的 LSTM-ARO（29 / 29 檔）。</p>', {tone: 'tone-red'})}
    </div></div></div>`,
  lesson: { explain: '<p>NAIVE 不需要訓練，卻在全部 29 檔、MSE／MAE／MAPE／R² 都排第一，論文模式和驗證集模式都一樣。論文沒有和這個基準比較。</p><p>股價接近隨機漫步：明天的價格最好的估計就是今天的價格。只用過去 20 天收盤價，模型很難找到比這更多的資訊。</p>', source: SRC.results },
  items: {
    chart: { title: 'MSFT 預測圖', explain: '<p>NAIVE 的線就是實際價格往右平移一天。LSTM-ARO 的預測比較平滑：它從 20 天的價格學到「近期平均」，所以在急漲急跌時反應較慢，誤差反而比單純沿用昨天價格大。</p>' },
    win: { title: 'NAIVE 全勝', explain: '<p>7 個模型一起排名時，NAIVE 在 29 檔的 MSE、MAE、MAPE、R² 都排第一。</p>' },
    mape: { title: 'MAPE 比較（論文模式）', explain: '<p>平均 MAPE：NAIVE 1.41%、LSTM-GA 3.23%、LSTM1D 3.61%、LSTM-ARO 3.67%、ANN 3.93%、LSTM2D 4.08%、LSTM3D 5.28%。</p>' },
    paperaro: { title: '和論文數字比較', explain: '<p>我們把論文 Table 7 的 LSTM-ARO MSE 逐格抄錄（<code>data/paper_tables.csv</code>），NAIVE 的 MSE 在 29 檔都比它低。所以即使接受論文偏樂觀的數字，LSTM-ARO 也沒有贏過 NAIVE。</p>' },
  } },

// 21 Q3：MSE ÷ NAIVE（兩種模式並列）
{ section: S5, phase: 'three', title: '和 NAIVE 比：最好的模型誤差仍是 NAIVE 的約 3 倍', source: 'djia_results.md §5、§8',
  html: `<div class="impl-body" style="gap:14px">
    <p class="impl-lead" style="margin:0">各模型 MSE ÷ NAIVE MSE（29 檔幾何平均；虛線 = 1，和 NAIVE 一樣好）</p>
    ${bars('naiveratio', [['LSTM-GA', 3.78, 2.79], ['LSTM-ARO', 4.08, 2.94], ['LSTM1D', 5.16, 4.87], ['ANN', 6.31, 6.78], ['LSTM2D', 6.03, 7.64], ['LSTM3D', 10.33, 10.57]], 11.5, {v: 1, label: 'NAIVE = 1'})}
    ${strip('r2', '最好的 LSTM-GA 仍是 NAIVE 的 2.79 倍（論文模式 3.78 倍）；R² 看起來很高，主要是因為股價本身的延續性')}
  </div>`,
  lesson: { explain: '<p>把每個模型的 MSE 除以同一檔 NAIVE 的 MSE，可以排除股價水準的差異（高價股的 MSE 本來就大）。驗證集模式讓 GA／ARO 更接近 NAIVE，但仍差將近 3 倍。</p>', source: SRC.results },
  items: {
    naiveratio: { title: 'MSE ÷ NAIVE', explain: '<table><tr><th>模型</th><th>論文模式</th><th>驗證集</th></tr><tr><td>LSTM-GA</td><td>3.78</td><td>2.79</td></tr><tr><td>LSTM-ARO</td><td>4.08</td><td>2.94</td></tr><tr><td>LSTM1D</td><td>5.16</td><td>4.87</td></tr><tr><td>ANN</td><td>6.31</td><td>6.78</td></tr><tr><td>LSTM2D</td><td>6.03</td><td>7.64</td></tr><tr><td>LSTM3D</td><td>10.33</td><td>10.57</td></tr></table>' },
    r2: { title: '為什麼 R² 很高還是輸？', explain: '<p>R² 是和「預測整段測試期的平均價格」比。股價在測試期內波動很大，所以只要預測值大致跟著走，R² 就很高。</p><p>平均 R²：NAIVE 0.952；論文模式 LSTM-GA 0.774、LSTM1D 0.737、LSTM2D 0.722、LSTM-ARO 0.697；驗證集模式 LSTM-GA 0.871、LSTM-ARO 0.842。</p>' },
  } },

// 22 結論
{ dark: true, title: '重現得到的五個發現', cat: '結論', source: 'djia_results.md',
  html: `<p class="impl-dark-eyebrow">結論</p><h1 class="impl-dark-title" data-lesson="page">重現得到的五個發現</h1>
  <div class="impl-body dark-cards" style="top:132px"><div class="grid2" style="height:330px;grid-template-rows:1fr 1fr">
    ${card('c1', '1 · 固定架構可以重現', '<p>LSTM1D／2D、ANN 的 MSE 約為論文的 0.9–1.2 倍。</p>')}
    ${card('c2', '2 · 論文的 GA／ARO 數字偏樂觀', '<p>搜尋時的分數和論文只差 4–18%，換 seed 重訓後差約 2 倍。</p>')}
    ${card('c3', '3 · 自動搜尋確實優於固定架構', '<p>驗證集模式下 28 / 29 檔勝過全部固定模型。</p>')}
    ${card('c4', '4 · ARO 與 GA 表現相當', '<p>兩者互有勝負（15 / 29），加大到 15 × 15 後為 10 / 29，差異都不顯著。</p>')}
  </div><div style="height:16px"></div>
  ${card('c5', '5 · 沒有模型贏過 NAIVE', '<p>「明天 = 今天」在 29 檔、四個指標全部第一。要說模型能預測股價，至少要先贏過這個基準。</p>', {style: 'border-color:#7bdbd3'})}
  <p style="margin:16px 0 0;color:#8a9bb5;font-size:var(--fs-footnote)">限制：主要結果的搜尋預算約為論文的 1/23（10 × 10 vs 50 × 50），另以 15 × 15 驗證，結論不變；論文未寫明的 epochs、GA 設定、Dense 激活由我們決定；WBA 無資料。</p></div>`,
  lesson: { explain: '<p>報告建議：以驗證集模式作為主要結果；論文模式（含 <code>best_fitness</code>）用來和論文對照。結論以「ARO ≈ GA ＞ 固定架構」陳述，並說明所有模型都未勝過 NAIVE。</p>', source: SRC.results + SRC.nb + SRC.paper },
  items: {
    c1: { title: '固定架構可以重現', explain: '<p>論文模式：LSTM1D 0.93、LSTM2D 0.92、ANN 1.10；驗證集模式：0.87、1.17、1.18（我們 ÷ 論文，幾何平均）。LSTM3D 約 1.5 倍。</p>' },
    c2: { title: '選擇偏誤', explain: '<p>用測試集挑超參數，挑出的是「測試集上碰巧最好的那一次」。報告時應同時列出論文式的 best_fitness 與 5-seed 重訓平均，兩者的落差就是這個偏誤。</p>' },
    c3: { title: '搜尋的價值', explain: '<p>即使預算只有論文的 1/23，搜尋出的架構仍明顯優於固定的 10 神經元架構。主要差別在學習率：搜尋多半選 0.01，固定架構用 0.001。</p>' },
    c4: { title: 'ARO vs GA', explain: '<p>在相同初始族群、相同評估次數下，兩者找到的架構品質沒有顯著差別。加大到 15 × 15 後，ARO 和 GA 的勝出者有 17 檔改變，表示單一檔的勝負受搜尋的隨機性影響很大。若要比較最佳化演算法本身，需要更大的預算與多次獨立重複。</p>' },
    c5: { title: 'NAIVE 基準', explain: '<p>預測隔天價格的研究應該把「明天 = 今天」列為必要的比較基準；也可以改預測報酬率或漲跌方向，這時 NAIVE 不再有優勢。</p>' },
  } },
];

// ---------------------------------------------------------------- 動態演算（Learning Lab）
const body = $('#drawerBody');
function widgetBox(html) { const d = document.createElement('div'); d.className = 'widget'; d.innerHTML = html; body.append(d); return d; }
const WIDGETS = {
  perTicker() {
    const d = widgetBox(`<strong>逐檔 MSE：論文 vs 我們</strong><p>每張小圖各自的縱軸。WMT 已 × 9 換算分割。</p>
      <label>模型</label><select id="pm"><option>LSTM-ARO</option><option>LSTM-GA</option></select>
      <label>排序</label><select id="ps"><option value="ticker">論文 Table 7 的順序</option><option value="gap">論文模式 ÷ 論文（落差大的在前）</option><option value="fix">驗證集帶來的改善（改善多的在前）</option></select>
      <div class="legend" style="margin:14px 0 6px">${PER_NAMES.map((n, i) => `<span><i style="background:${PER_COLORS[i]}"></i>${n}</span>`).join('')}</div>
      <div id="pgrid" class="lab-mini-grid"></div><div id="ptab" style="margin-top:14px"></div>`);
    function update() {
      const m = d.querySelector('#pm').value, sort = d.querySelector('#ps').value, data = PER[m];
      let ts = Object.keys(data);
      if (sort === 'gap') ts.sort((a, b) => data[b][1] / data[b][0] - data[a][1] / data[a][0]);
      if (sort === 'fix') ts.sort((a, b) => data[b][1] / data[b][2] - data[a][1] / data[a][2]);
      d.querySelector('#pgrid').innerHTML = ts.map(t => {
        const vals = data[t], max = Math.max(...vals);
        return `<div class="mini"><div class="mini-plot">${vals.map((v, i) => `<div class="mini-col"><em>${fmtMse(v)}</em><i style="height:${Math.max(2, v / max * 100).toFixed(1)}%;background:${PER_COLORS[i]}"></i></div>`).join('')}</div><b>${t}</b></div>`;
      }).join('');
      d.querySelector('#ptab').innerHTML = perTable(m);
    }
    d.querySelectorAll('select').forEach(x => x.oninput = update);
    update();
  },

  decode() {
    const names = ['x₀ LSTM 1 神經元', 'x₁ 有無 LSTM 2', 'x₂ LSTM 2 神經元', 'x₃ 有無 LSTM 3', 'x₄ LSTM 3 神經元', 'x₅ Dense 神經元', 'x₆ Dropout', 'x₇ Optimizer', 'x₈ Learning rate'];
    const ch = [[...Array(20)].map((_, i) => i + 1), [0, 1], [...Array(20)].map((_, i) => i + 1), [0, 1], [...Array(20)].map((_, i) => i + 1), [...Array(20)].map((_, i) => i + 1), [0.3, 0.4, 0.5, 0.6, 0.7], ['Adagrad', 'Adam', 'Adamax', 'RMSprop', 'SGD'], ['0.01', '0.001', '0.0001', '0.00001', '0.000001']];
    const init = [0.62, 0.71, 0.33, 0.12, 0.90, 0.48, 0.25, 0.30, 0.05];
    const d = widgetBox(`<strong>decode()：拖動 9 個維度</strong><p>和 notebook 相同的規則：值 × 選項數取整數，落在第幾格就取第幾個選項。</p>${names.map((n, i) => `<label>${n}：<span class="value" id="dv${i}"></span></label><input type="range" min="0" max="1" step="0.01" value="${init[i]}" id="dx${i}">`).join('')}<div class="quote" id="dres"></div><button type="button" class="try-formula" id="drand">隨機一隻兔子</button>`);
    const pick = (v, c) => c[Math.min(Math.max(Math.floor(v * c.length), 0), c.length - 1)];
    function update() {
      const v = init.map((_, i) => +d.querySelector('#dx' + i).value);
      const hp = v.map((x, i) => pick(x, ch[i]));
      v.forEach((x, i) => { d.querySelector('#dv' + i).textContent = `${x.toFixed(2)} → ${hp[i]}`; });
      const units = [hp[0]]; if (hp[1]) units.push(hp[2]); if (hp[3]) units.push(hp[4]);
      d.querySelector('#dx2').disabled = !hp[1]; d.querySelector('#dx4').disabled = !hp[3];
      let p = 0, inp = 1; units.forEach(u => { p += 4 * ((inp + u) * u + u); inp = u; }); p += (inp + 1) * hp[5] + hp[5] + 1;
      d.querySelector('#dres').innerHTML = `Input(20, 1) → ${units.map(u => `LSTM(${u})`).join(' → ')} → Dense(${hp[5]}) → Dropout(${hp[6]}) → Dense(1)<br>Optimizer：<b>${hp[7]}</b>；Learning rate：<b>${hp[8]}</b><br>參數量：<b>${p.toLocaleString()}</b>`;
    }
    d.querySelectorAll('input').forEach(i => i.oninput = update);
    d.querySelector('#drand').onclick = () => { d.querySelectorAll('input').forEach(i => { i.value = Math.random().toFixed(2); }); update(); };
    update();
  },
  energy() {
    const d = widgetBox('<strong>ARO 能量因子 A(t)（Eq. 20）</strong><p>A = 4·(1 − t/T)·ln(1/r)。我們的 T = 10。</p><label>迭代 t：<span class="value" id="et"></span></label><input id="eti" type="range" min="1" max="10" step="1" value="2"><label>隨機數 r：<span class="value" id="er"></span></label><input id="eri" type="range" min="0.01" max="0.99" step="0.01" value="0.40"><div class="quote" id="eres"></div><p><b>這一代選到探索的機率</b>（A &gt; 1 ⇔ r &lt; e<sup>−1/(4(1−t/T))</sup>）：</p><div class="mini-bars" id="ebars"></div>');
    function update() {
      const t = +d.querySelector('#eti').value, r = +d.querySelector('#eri').value, T = 10, a = 4 * (1 - t / T) * Math.log(1 / r);
      d.querySelector('#et').textContent = `${t} / ${T}`; d.querySelector('#er').textContent = r.toFixed(2);
      d.querySelector('#eres').innerHTML = `A = 4 × (1 − ${t}/${T}) × ln(1/${r.toFixed(2)}) = <b>${a.toFixed(3)}</b><br>${a > 1 ? 'A &gt; 1 → <b>繞路覓食（探索）</b>' : 'A ≤ 1 → <b>隨機躲藏（開發）</b>'}`;
      d.querySelector('#ebars').innerHTML = Array.from({length: T}, (_, k) => { const tt = k + 1, pr = tt === T ? 0 : Math.exp(-1 / (4 * (1 - tt / T))); return `<div class="mini-bar"><span>t = ${tt}${tt === t ? ' ◀' : ''}</span><i style="width:${(pr * 100).toFixed(1)}%"></i><strong>${Math.round(pr * 100)}%</strong></div>`; }).join('');
    }
    d.querySelectorAll('input').forEach(i => i.oninput = update); update();
  },
  selection() {
    const d = widgetBox('<strong>挑最好的那一次：選擇偏誤模擬</strong><p>每個候選架構的「真實」MSE 不同，但每次訓練都會乘上一個隨機誤差（seed 間波動）。從 N 個候選挑出這次分數最低的，再用新的 seed 重訓。</p><label>候選數 N：<span class="value" id="sn"></span></label><input id="sni" type="range" min="1" max="120" step="1" value="80"><label>seed 間波動（標準差 ÷ 平均）：<span class="value" id="ss"></span></label><input id="ssi" type="range" min="0" max="0.8" step="0.02" value="0.40"><div class="quote" id="sres"></div><p>示意模型：真實 MSE ~ 對數常態，每次訓練再乘上 exp(σ·z)；重複 2,000 次取中位數。不是我們的實驗資料。</p>');
    let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const z = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
    function update() {
      const N = +d.querySelector('#sni').value, cv = +d.querySelector('#ssi').value, s = Math.sqrt(Math.log(1 + cv * cv));
      d.querySelector('#sn').textContent = N; d.querySelector('#ss').textContent = `${Math.round(cv * 100)}%`;
      seed = 7; const ratios = [];
      for (let k = 0; k < 2000; k++) {
        let best = Infinity, bestTrue = 0;
        for (let j = 0; j < N; j++) { const tr = Math.exp(0.5 * z()), obs = tr * Math.exp(s * z() - s * s / 2); if (obs < best) { best = obs; bestTrue = tr; } }
        ratios.push(bestTrue / best);
      }
      ratios.sort((a, b) => a - b); const med = ratios[1000];
      d.querySelector('#sres').innerHTML = `重訓後的 MSE ÷ 挑選時的 MSE（中位數）：<b>× ${med.toFixed(2)}</b><br>${med > 1.3 ? '挑選時的分數明顯偏樂觀' : med > 1.05 ? '有一些樂觀偏誤' : '幾乎沒有偏誤'}。我們實驗中的實際值約 × 1.5。`;
    }
    d.querySelectorAll('input').forEach(i => i.oninput = update); update();
  },
};

// ---------------------------------------------------------------- 控制器（對應 app.js，切換不做動畫）
const slideEl = $('#slide'), drawer = $('#drawer');
let index = 0, tab = 'explain', lesson = null;
const slideTitle = s => s.title;
const category = s => s.cat || (s.section || '').replace(/^\d+｜/, '');

function setIndex(n) {
  const next = Math.max(0, Math.min(SLIDES.length - 1, n));
  if (next === index && slideEl.childElementCount) return;
  index = next;
  if (drawer.classList.contains('open')) closeDrawer();
  const hash = `#slide-${index + 1}`;
  if (location.hash !== hash) history.replaceState(null, '', hash);
  render();
}
function render() {
  const s = SLIDES[index];
  slideEl.replaceChildren();
  slideEl.style.background = s.cover || s.dark ? '#101A30' : '#F8FAFD';
  slideEl.setAttribute('aria-label', `第 ${index + 1} 頁，共 ${SLIDES.length} 頁：${s.title}`);
  let html = '';
  if (!s.cover && !s.dark) {
    html += `<div class="slide-top-rule phase-${s.phase}"></div><p class="slide-section-label phase-${s.phase}" data-lesson="page">${s.section}</p><h1 class="slide-header-title" data-lesson="page">${s.title}</h1>`;
  }
  html += s.html;
  if (s.source && !s.cover) html += `${s.dark ? '' : '<div class="impl-rule"></div>'}<p class="impl-source"${s.dark ? ' style="color:#8a9bb5"' : ''}>${s.source}</p>`;
  html += `<div class="slide-page-number${s.cover || s.dark ? ' on-dark' : ''}">${String(index + 1).padStart(2, '0')}</div>`;
  slideEl.innerHTML = html;
  slideEl.querySelectorAll('[data-lesson]').forEach(el => {
    el.classList.add('interactive'); el.tabIndex = 0; el.setAttribute('role', 'button');
    const go = () => openLesson(el.dataset.lesson);
    makeInteractive(el, go);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
  $('#pageLabel').textContent = `${index + 1} / ${SLIDES.length}`;
  const fraction = SLIDES.length > 1 ? index / (SLIDES.length - 1) : 0;
  $('#progressBar').style.width = `${fraction * 100}%`;
  $('#progressThumb').style.left = `${fraction * 100}%`;
  $('#progressTrack').setAttribute('aria-valuenow', String(index + 1));
  $('#progressTrack').setAttribute('aria-valuetext', `第 ${index + 1} 頁，共 ${SLIDES.length} 頁`);
  $('#prevBtn').disabled = index === 0; $('#nextBtn').disabled = index === SLIDES.length - 1;
  scale();
}
function makeInteractive(el, action) {
  let isDown = false, downX = 0, downY = 0;
  el.addEventListener('mousedown', e => { if (e.button !== 0) return; isDown = true; downX = e.clientX; downY = e.clientY; });
  el.addEventListener('click', e => {
    e.stopPropagation();
    if (e.detail === 0) { action(e); return; }
    if (!isDown) return; isDown = false;
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 8) return;
    if (getSelection && String(getSelection()).length > 2) return;
    action(e);
  });
}
function scale() { const f = $('#slideFrame'); slideEl.style.transform = `scale(${f.clientWidth / 1280})`; }

// 抽屜
function openLesson(key) {
  const s = SLIDES[index];
  const page = s.lesson || {};
  const it = key === 'page' ? null : (s.items || {})[key];
  lesson = it ? {title: it.title, explain: it.explain, code: it.code, widget: it.widget, source: it.source || page.source}
              : {title: s.title, explain: page.explain, code: page.code, widget: page.widget, source: page.source, page: true};
  openDrawer('explain');
}
function openDrawer(t) { tab = t; drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); $('#overlay').hidden = false; renderDrawer(); $('#closeDrawer').focus(); }
function closeDrawer() { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); $('#overlay').hidden = true; $('#slideFrame').focus(); }
function renderDrawer() {
  const l = lesson; if (!l) return;
  const has = {explain: true, code: !!(l.code && l.code.length), widget: !!l.widget, source: true};
  if (!has[tab]) tab = 'explain';
  document.querySelectorAll('.drawer-tabs button').forEach(b => {
    b.hidden = !has[b.dataset.tab];
    b.classList.toggle('active', b.dataset.tab === tab); b.setAttribute('aria-selected', String(b.dataset.tab === tab));
  });
  drawer.classList.toggle('wide', tab === 'code' || tab === 'widget');
  $('#drawerTitle').textContent = l.title;
  body.replaceChildren(); body.scrollTop = 0;
  if (tab === 'explain') {
    body.insertAdjacentHTML('beforeend', l.explain || '<p>點投影片上的卡片、程式碼或圖表，可查看對應說明。</p>');
    const go = [];
    if (has.code) go.push(['code', '看完整程式碼 →']);
    if (has.widget) go.push(['widget', '動手試試 →']);
    if (go.length) {
      const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:8px';
      go.forEach(([t, txt]) => { const b = document.createElement('button'); b.className = 'try-formula'; b.textContent = txt; b.onclick = () => { tab = t; renderDrawer(); }; row.append(b); });
      body.append(row);
    }
    if (l.page && SLIDES[index].items) body.insertAdjacentHTML('beforeend', '<p style="margin-top:16px;color:#60708a">點投影片中的各個卡片、程式碼或圖表，可查看該項目的說明。</p>');
  } else if (tab === 'code') {
    l.code.forEach(c => body.insertAdjacentHTML('beforeend', `<div class="drawer-code-title"><span>${esc(c.name)}</span><small>djia_lib.py · ${c.text.split('\n').length} 行</small></div>${glossTable(c.text, c.name)}<div class="drawer-code"><pre>${hl(c.text, c.name)}</pre></div>`));
    body.insertAdjacentHTML('beforeend', '<p style="color:#60708a;font-size:13px">程式碼中有虛線底線的名稱，滑鼠移上去也會顯示展開。</p>');
    body.insertAdjacentHTML('beforeend', `<p style="color:#60708a;font-size:13px">程式碼由 notebook 逐字擷取（impl-code.js），與 <a href="${NB}" target="_blank" rel="noopener">djia_reproduction.ipynb</a> 相同。</p>`);
  } else if (tab === 'widget') {
    WIDGETS[l.widget]();
  } else {
    body.insertAdjacentHTML('beforeend', `<p>本頁對照：<strong>${esc(SLIDES[index].source || 'djia_reproduction.ipynb')}</strong></p>${l.source || SRC.nb}`);
  }
}
$('#closeDrawer').onclick = closeDrawer; $('#overlay').onclick = closeDrawer;
document.querySelectorAll('.drawer-tabs button').forEach(b => b.onclick = () => { tab = b.dataset.tab; renderDrawer(); });

// 全部頁面
function showOverview() {
  const grid = $('#overviewGrid'); grid.replaceChildren();
  SLIDES.forEach((s, i) => {
    const b = document.createElement('button'); b.className = i === index ? 'current' : '';
    b.innerHTML = `<small>${String(i + 1).padStart(2, '0')} · ${category(s)}</small><span></span>`;
    b.querySelector('span').textContent = slideTitle(s);
    b.onclick = () => { setIndex(i); hideOverview(); }; grid.append(b);
  });
  $('#overview').hidden = false; $('#closeOverview').focus();
}
function hideOverview() { $('#overview').hidden = true; $('#overviewBtn').focus(); }
$('#overviewBtn').onclick = showOverview; $('#closeOverview').onclick = hideOverview;
$('#overview').addEventListener('click', e => { if (e.target.id === 'overview') hideOverview(); });

// 鍵盤、滾輪、觸控、進度條
$('#prevBtn').onclick = () => setIndex(index - 1); $('#nextBtn').onclick = () => setIndex(index + 1);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (!$('#overview').hidden) hideOverview(); else if (drawer.classList.contains('open')) closeDrawer(); return; }
  if (drawer.classList.contains('open') || !$('#overview').hidden || /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); setIndex(index - 1); }
  if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); setIndex(index + 1); }
});
addEventListener('resize', scale);
addEventListener('hashchange', () => { const m = location.hash.match(/^#slide-(\d+)$/); if (m && +m[1] >= 1 && +m[1] <= SLIDES.length && +m[1] - 1 !== index) setIndex(+m[1] - 1); });
let touchX = 0;
$('#slideFrame').addEventListener('touchstart', e => { touchX = e.changedTouches[0].screenX; }, {passive: true});
$('#slideFrame').addEventListener('touchend', e => { const dx = e.changedTouches[0].screenX - touchX; if (Math.abs(dx) > 70) setIndex(index + (dx < 0 ? 1 : -1)); }, {passive: true});
let wheelSmallTotal = 0, wheelLastTime = 0, wheelDirection = 0;
$('.workspace').addEventListener('wheel', e => {
  if (drawer.classList.contains('open') || !$('#overview').hidden) return;
  e.preventDefault();
  const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1), direction = Math.sign(delta);
  if (!direction) return;
  const now = performance.now(), newGesture = now - wheelLastTime > 250 || direction !== wheelDirection;
  wheelLastTime = now; wheelDirection = direction;
  let pages = 0;
  if (Math.abs(delta) >= 40) { pages = Math.max(1, Math.round(Math.abs(delta) / 100)); wheelSmallTotal = 0; }
  else if (newGesture) { pages = 1; wheelSmallTotal = 0; }
  else { wheelSmallTotal += Math.abs(delta); pages = Math.floor(wheelSmallTotal / 100); wheelSmallTotal %= 100; }
  if (pages) setIndex(index + direction * Math.min(pages, 10));
}, {passive: false});
const track = $('#progressTrack');
function scrub(e) { const r = track.getBoundingClientRect(); const f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); setIndex(Math.round(f * (SLIDES.length - 1))); }
let dragging = false;
track.addEventListener('pointerdown', e => { dragging = true; track.setPointerCapture(e.pointerId); scrub(e); e.preventDefault(); });
track.addEventListener('pointermove', e => { if (dragging) scrub(e); });
track.addEventListener('pointerup', e => { if (!dragging) return; scrub(e); dragging = false; track.releasePointerCapture(e.pointerId); });
track.addEventListener('pointercancel', () => { dragging = false; });
track.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); setIndex(index - 1); }
  else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); setIndex(index + 1); }
  else if (e.key === 'Home') { e.preventDefault(); setIndex(0); }
  else if (e.key === 'End') { e.preventDefault(); setIndex(SLIDES.length - 1); }
});

// 啟動
$('#loading').hidden = true;
document.querySelector('.overview-head h2').textContent = `全部 ${SLIDES.length} 頁`;
track.setAttribute('aria-valuemax', String(SLIDES.length));
const m = location.hash.match(/^#slide-(\d+)$/);
index = -1;
setIndex(m && +m[1] >= 1 && +m[1] <= SLIDES.length ? +m[1] - 1 : 0);
})();
