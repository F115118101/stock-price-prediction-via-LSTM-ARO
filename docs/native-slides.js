// Web-native teaching slides. Text, cards, and arrows remain selectable DOM content.
const nativeSearchOptions = [
  ['LSTM 1 神經元 x₀', '1–20（整數）'],
  ['LSTM 2 是否存在 x₁', '0 或 1'],
  ['LSTM 2 神經元 x₂', '1–20（存在時）'],
  ['LSTM 3 是否存在 x₃', '0 或 1'],
  ['LSTM 3 神經元 x₄', '1–20（存在時）'],
  ['Dense 神經元 x₅', '1–20（整數）'],
  ['Dropout x₆', '0.3、0.4、0.5、0.6、0.7'],
  ['Optimizer', 'Adagrad、Adam、Adamax、RMSprop、SGD'],
  ['Learning rate', '0.01、0.001、0.0001、0.00001、0.000001']
];

function nativeCard(label, value, tone = '') {
  return `<article class="native-card ${tone}"><h2>${label}</h2><p>${value}</p></article>`;
}

function renderNativeSlide(number, slide) {
  // P03: 研究貢獻與整體架構（雙層閉環系統流程圖）
  if (number === 3) {
    slide.insertAdjacentHTML('beforeend', `
      <div class="p03-system-flow">
        <div class="p03-card aro">
          <div>
            <span class="p03-tag aro">外部調參</span>
            <h3>ARO 演算法</h3>
            <p class="p03-desc">群體啟發式搜尋最佳超參數組合。</p>
          </div>
          <p class="p03-sub">動態調整 LSTM 層數 (1~3)、神經元數 (1~20)、Dropout、優化器與學習率。</p>
        </div>

        <div class="p03-bridge">
          <div class="p03-arrow-box to-right">
            <div class="p03-arrow-title">送出超參數配置</div>
            <div class="p03-arrow-sub">網路架構與訓練設定</div>
          </div>
          <div class="p03-loop-badge">
            <span class="icon">🔄</span>
            <strong>50 代演化</strong>
          </div>
          <div class="p03-arrow-box to-left">
            <div class="p03-arrow-title">回傳適應度</div>
            <div class="p03-arrow-sub">測試集準確度與誤差</div>
          </div>
        </div>

        <div class="p03-card lstm">
          <div>
            <span class="p03-tag lstm">內部預測</span>
            <h3>Deep LSTM</h3>
            <p class="p03-desc">深層時間序列擬合模型。</p>
          </div>
          <p class="p03-sub">讀取過去 20 天連續股價，依候選架構訓練擬合，輸出隔天預測收盤價。</p>
        </div>

        <div class="p03-card best">
          <div>
            <span class="p03-tag best">最終成果</span>
            <h3>最佳模型</h3>
            <p class="p03-desc">保留搜尋過程中誤差最低的超參數組合，作為最終預測模型。</p>
          </div>
          <p class="p03-sub">以此模型預測 30 檔 DJIA 成分股的隔日收盤價。</p>
        </div>
      </div>
      <div class="p03-bottom-strip">
        重點：ARO 是調參器（負責外層搜尋）；LSTM 才是預測器（負責內層擬合）。
      </div>
    `);
    return true;
  }

  // P05: 滑動視窗（Sliding Window 動態網格）
  if (number === 5) {
    slide.insertAdjacentHTML('beforeend', `
      <div class="p05-sliding-window">
        <div class="p05-grid-card">
          <div class="p05-table">
            <div class="p05-timeline-head">
              <span class="p05-lbl">時間序列</span>
              <span class="p05-cell ellipsis">D1</span>
              <span class="p05-cell ellipsis">D2</span>
              <span class="p05-cell ellipsis">D3</span>
              <span class="p05-cell ellipsis">···</span>
              <span class="p05-cell ellipsis">D19</span>
              <span class="p05-cell ellipsis">D20</span>
              <span class="p05-cell ellipsis" style="color:#e07010">D21</span>
              <span class="p05-cell ellipsis" style="color:#e07010">D22</span>
              <span class="p05-cell ellipsis" style="color:#e07010">D23</span>
              <span class="p05-target-desc" style="color:#60708a">說明</span>
            </div>

            <!-- Row 1: 樣本 1 -->
            <div class="p05-row">
              <span class="p05-lbl">樣本 1</span>
              <span class="p05-cell filled">1</span>
              <span class="p05-cell filled">2</span>
              <span class="p05-cell filled">3</span>
              <span class="p05-cell ellipsis">···</span>
              <span class="p05-cell filled">19</span>
              <span class="p05-cell filled">20</span>
              <span class="p05-cell target">Day 21</span>
              <span class="p05-cell empty">22</span>
              <span class="p05-cell empty">23</span>
              <span class="p05-target-desc">➔ 預測第 21 天收盤價</span>
            </div>

            <!-- Row 2: 樣本 2 -->
            <div class="p05-row">
              <span class="p05-lbl">樣本 2</span>
              <span class="p05-cell empty">1</span>
              <span class="p05-cell filled">2</span>
              <span class="p05-cell filled">3</span>
              <span class="p05-cell ellipsis">···</span>
              <span class="p05-cell filled">19</span>
              <span class="p05-cell filled">20</span>
              <span class="p05-cell filled">21</span>
              <span class="p05-cell target">Day 22</span>
              <span class="p05-cell empty">23</span>
              <span class="p05-target-desc">➔ 預測第 22 天收盤價</span>
            </div>

            <!-- Row 3: 樣本 3 -->
            <div class="p05-row">
              <span class="p05-lbl">樣本 3</span>
              <span class="p05-cell empty">1</span>
              <span class="p05-cell empty">2</span>
              <span class="p05-cell filled">3</span>
              <span class="p05-cell ellipsis">···</span>
              <span class="p05-cell filled">19</span>
              <span class="p05-cell filled">20</span>
              <span class="p05-cell filled">21</span>
              <span class="p05-cell filled">22</span>
              <span class="p05-cell target">Day 23</span>
              <span class="p05-target-desc">➔ 預測第 23 天收盤價</span>
            </div>

            <!-- Row 4: ... -->
            <div class="p05-dots-row">
              <span>⋮ 視窗每日向右滑動 1 天（步長 Stride = 1），持續滾動生成全資料集樣本 ...</span>
            </div>
          </div>
        </div>

        <div class="p05-meta-grid">
          <div class="p05-meta-card">
            <h4>資料來源</h4>
            <p>Yahoo Finance｜DJIA 30 檔股票（2018–2022，約 1,258 交易日）</p>
          </div>
          <div class="p05-meta-card">
            <h4>資料切分</h4>
            <p>80% 訓練集 ／ 20% 測試集（嚴格保持時間順序，杜絕資料洩漏）</p>
          </div>
          <div class="p05-meta-card">
            <h4>樣本結構</h4>
            <p>連續時間序列重構為 3D Tensor 監督式學習樣本 (N, 20, 1)</p>
          </div>
        </div>
      </div>
    `);
    return true;
  }

  // P07: ANN vs RNN vs LSTM（結構演進圖解）
  if (number === 7) {
    slide.insertAdjacentHTML('beforeend', `
      <div class="p07-architecture-comparison">
        <div class="p07-card ann">
          <div>
            <div class="p07-head">
              <h3>ANN</h3>
              <span class="p07-sub">全連接網路</span>
            </div>
            <div class="p07-diagram-wrap">
              <svg viewBox="0 0 240 100" style="width:100%;height:100%">
                <circle cx="35" cy="30" r="10" fill="#fff" stroke="#3c66b9" stroke-width="2" />
                <circle cx="35" cy="70" r="10" fill="#fff" stroke="#3c66b9" stroke-width="2" />
                <line x1="45" y1="30" x2="110" y2="25" stroke="#cbd5e1" stroke-width="1.5" />
                <line x1="45" y1="30" x2="110" y2="50" stroke="#cbd5e1" stroke-width="1.5" />
                <line x1="45" y1="30" x2="110" y2="75" stroke="#cbd5e1" stroke-width="1.5" />
                <line x1="45" y1="70" x2="110" y2="25" stroke="#cbd5e1" stroke-width="1.5" />
                <line x1="45" y1="70" x2="110" y2="50" stroke="#cbd5e1" stroke-width="1.5" />
                <line x1="45" y1="70" x2="110" y2="75" stroke="#cbd5e1" stroke-width="1.5" />
                <circle cx="120" cy="25" r="10" fill="#fff" stroke="#6366f1" stroke-width="2" />
                <circle cx="120" cy="50" r="10" fill="#fff" stroke="#6366f1" stroke-width="2" />
                <circle cx="120" cy="75" r="10" fill="#fff" stroke="#6366f1" stroke-width="2" />
                <line x1="130" y1="25" x2="195" y2="50" stroke="#cbd5e1" stroke-width="1.5" />
                <line x1="130" y1="50" x2="195" y2="50" stroke="#cbd5e1" stroke-width="1.5" />
                <line x1="130" y1="75" x2="195" y2="50" stroke="#cbd5e1" stroke-width="1.5" />
                <circle cx="205" cy="50" r="10" fill="#fff" stroke="#f39a42" stroke-width="2" />
                <text x="205" y="54" font-size="12" font-weight="bold" text-anchor="middle" fill="#202b42">ŷ</text>
              </svg>
            </div>
            <div class="p07-main-trait">各時間點獨立，無序列記憶</div>
            <p class="p07-detail">單向前饋傳播，完全忽略股價先後的連續走勢。</p>
          </div>
          <div class="p07-badge-status bad">基準對照組：預測誤差最高</div>
        </div>

        <div class="p07-card rnn">
          <div>
            <div class="p07-head">
              <h3>RNN</h3>
              <span class="p07-sub">循環神經網路</span>
            </div>
            <div class="p07-diagram-wrap">
              <svg viewBox="0 0 240 100" style="width:100%;height:100%">
                <circle cx="40" cy="50" r="10" fill="#fff" stroke="#3c66b9" stroke-width="2" />
                <text x="40" y="54" font-size="12" font-weight="bold" text-anchor="middle" fill="#202b42">xₜ</text>
                <line x1="50" y1="50" x2="105" y2="50" stroke="#cbd5e1" stroke-width="2" />
                <rect x="105" y="32" width="40" height="36" rx="6" fill="#e0e7ff" stroke="#6366f1" stroke-width="2" />
                <text x="125" y="55" font-size="15" font-weight="bold" text-anchor="middle" fill="#312e81">hₜ</text>
                <path d="M 115 32 C 110 8, 140 8, 135 30" fill="none" stroke="#6366f1" stroke-width="2" stroke-dasharray="3,2" />
                <text x="125" y="10" font-size="11" font-weight="bold" text-anchor="middle" fill="#4338ca">循環 hₜ₋₁</text>
                <line x1="145" y1="50" x2="195" y2="50" stroke="#cbd5e1" stroke-width="2" />
                <circle cx="205" cy="50" r="10" fill="#fff" stroke="#f39a42" stroke-width="2" />
                <text x="205" y="54" font-size="12" font-weight="bold" text-anchor="middle" fill="#202b42">ŷₜ</text>
              </svg>
            </div>
            <div class="p07-main-trait">保留隱藏狀態，但易梯度消失</div>
            <p class="p07-detail">跨時間權重矩陣連乘，難以有效記憶超過數天的訊號。</p>
          </div>
          <div class="p07-badge-status fair">具時序性，但長距記憶失效</div>
        </div>

        <div class="p07-card lstm">
          <div>
            <div class="p07-head">
              <h3>LSTM</h3>
              <span class="p07-sub">長短期記憶網路</span>
            </div>
            <div class="p07-diagram-wrap">
              <svg viewBox="0 0 240 100" style="width:100%;height:100%">
                <rect x="20" y="16" width="200" height="24" rx="6" fill="#fff9df" stroke="#c99a27" stroke-width="2" />
                <text x="120" y="33" font-size="13" font-weight="bold" text-anchor="middle" fill="#946c00">Cell State Cₜ（加法輸送帶）</text>
                <circle cx="60" cy="58" r="9" fill="#fff" stroke="#d85b61" stroke-width="1.8" />
                <text x="60" y="62" font-size="11" font-weight="bold" text-anchor="middle" fill="#202b42">fₜ</text>
                <circle cx="120" cy="58" r="9" fill="#fff" stroke="#4c9b68" stroke-width="1.8" />
                <text x="120" y="62" font-size="11" font-weight="bold" text-anchor="middle" fill="#202b42">iₜ</text>
                <circle cx="180" cy="58" r="9" fill="#fff" stroke="#8b62c6" stroke-width="1.8" />
                <text x="180" y="62" font-size="11" font-weight="bold" text-anchor="middle" fill="#202b42">oₜ</text>
                <rect x="20" y="74" width="200" height="20" rx="5" fill="#f6efff" stroke="#8b62c6" stroke-width="1.5" />
                <text x="120" y="88" font-size="12" font-weight="bold" text-anchor="middle" fill="#6d28d9">Hidden State hₜ（當前輸出）</text>
              </svg>
            </div>
            <div class="p07-main-trait">雙軌加法記憶，突破長距依賴</div>
            <p class="p07-detail">三門控動態篩選，加法通道讓梯度長程流通不衰減。</p>
          </div>
          <div class="p07-badge-status good">論文預測核心：多層性能最佳</div>
        </div>
      </div>
      <div class="p07-strip">
        演進脈絡：無時序記憶（ANN） ➔ 循環連乘衰減（RNN） ➔ <strong>門控加法長效記憶（LSTM）</strong>
      </div>
    `);
    return true;
  }

  // P08: LSTM 核心概念（雙軌記憶機制與加法梯度高速公路）
  if (number === 8) {
    slide.insertAdjacentHTML('beforeend', `
      <div class="p08-memory-highway">
        <div class="p08-lane cell">
          <div class="p08-lane-title">
            <strong>長期記憶 Cell State Cₜ</strong>
            <span>加法輸送帶：平穩長久保存關鍵趨勢</span>
          </div>
          <div class="p08-track">
            <div class="p08-box memory">舊記憶 Cₜ₋₁</div>
            <span class="flow-arrow">→</span>
            <div class="p08-box op">× 忘記門 fₜ<small>決定遺忘多少舊資訊</small></div>
            <span class="flow-arrow">→</span>
            <div class="p08-box op">+ 輸入門 iₜ ⊙ C̃ₜ<small>加法寫入新候選資訊</small></div>
            <span class="flow-arrow">→</span>
            <div class="p08-box memory">新記憶 Cₜ</div>
          </div>
          <div class="p08-note">
            ★ 突破關鍵：以加法（+）更新記憶，梯度反向傳播時不會指數衰減，解決梯度消失！
          </div>
        </div>

        <div class="p08-lane hidden">
          <div class="p08-lane-title">
            <strong>目前輸出 Hidden State hₜ</strong>
            <span>門控過濾：當前時間步對外的具體表現</span>
          </div>
          <div class="p08-track">
            <div class="p08-box input">共同輸入 [hₜ₋₁, xₜ]</div>
            <span class="flow-arrow">→</span>
            <div class="p08-box op">輸出門 oₜ ⊙ tanh(Cₜ)<small>由輸出門篩選後的資訊</small></div>
            <span class="flow-arrow">→</span>
            <div class="p08-box output">輸出 hₜ（傳給下一步與 Dense 層）</div>
          </div>
        </div>

        <div class="p08-bottom-card">
          <div><strong>Cₜ（長期筆記本）</strong>：線性平穩流通，只讓經過認證的重大資訊留存。</div>
          <div><strong>hₜ（當前發言條）</strong>：經輸出門篩選後的精煉決策，負責當前預測。</div>
        </div>
      </div>
    `);
    return true;
  }

  // P09: LSTM 單元結構（互動式記憶流動圖解）
  if (number === 9) {
    slide.insertAdjacentHTML('beforeend', `
      <h1 class="slide-header-title">LSTM Cell：一個時間步內，資訊如何流動？</h1>
      <p class="native-lead">上方是記憶傳遞路徑；下方的門決定保留、寫入與輸出多少資訊。</p>
      <div class="cell-memory">
        <div class="flow-box memory">舊記憶 C<sub>t−1</sub></div><span class="flow-arrow">→</span>
        <div class="flow-box operation">×<small>forget gate</small></div><span class="flow-arrow">→</span>
        <div class="flow-box operation">+<small>新資訊</small></div><span class="flow-arrow">→</span>
        <div class="flow-box memory">新記憶 C<sub>t</sub></div><span class="flow-arrow">→</span>
        <div class="flow-box operation">tanh × o<sub>t</sub></div><span class="flow-arrow">→</span>
        <div class="flow-box output">輸出 h<sub>t</sub></div>
      </div>
      <div class="cell-input">共同輸入 <strong>[h<sub>t−1</sub>, x<sub>t</sub>]</strong></div>
      <div class="cell-gates">
        ${nativeCard('Forget Gate', 'fₜ：決定舊記憶保留多少', 'tone-red')}
        ${nativeCard('Input Gate', 'iₜ：決定寫入多少候選資訊', 'tone-green')}
        ${nativeCard('Candidate', 'C̃ₜ：產生候選記憶', 'tone-blue')}
        ${nativeCard('Output Gate', 'oₜ：決定輸出多少', 'tone-purple')}
      </div>
      <div class="native-formula">
        <div>C<sub>t</sub> = f<sub>t</sub> ⊙ C<sub>t−1</sub> + i<sub>t</sub> ⊙ C̃<sub>t</sub></div>
        <span class="formula-sep">｜</span>
        <div>h<sub>t</sub> = o<sub>t</sub> ⊙ tanh(C<sub>t</sub>)</div>
      </div>
      <p class="native-note">⊙ 為逐元素相乘；σ（sigmoid）把門的輸出限制在 0–1。</p>
    `);
    return true;
  }

  // P10: Gate 的內部計算
  if (number === 10) {
    const gates = [
      ['遺忘門', 'fₜ', 'σ(Wf[hₜ₋₁, xₜ] + bf)', 'tone-red'],
      ['輸入門', 'iₜ', 'σ(Wi[hₜ₋₁, xₜ] + bi)', 'tone-green'],
      ['候選記憶', 'C̃ₜ', 'tanh(Wc[hₜ₋₁, xₜ] + bc)', 'tone-blue'],
      ['輸出門', 'oₜ', 'σ(Wo[hₜ₋₁, xₜ] + bo)', 'tone-purple']
    ];
    slide.insertAdjacentHTML('beforeend', `
      <h1 class="slide-header-title">Gate 的內部：每個門如何計算</h1>
      <p class="native-lead">四個分支都讀取同一組輸入 [h<sub>t−1</sub>, x<sub>t</sub>]，各自學習權重與偏差。</p>
      <div class="gate-table">${gates.map(([name, symbol, equation, tone]) => `<article class="gate-row ${tone}"><div class="gate-name">${name}</div><div class="gate-input">[h<sub>t−1</sub>, x<sub>t</sub>]</div><span class="flow-arrow">→</span><div class="gate-activation">${name === '候選記憶' ? 'tanh' : 'σ'}</div><span class="flow-arrow">→</span><strong>${symbol}</strong><code>${equation}</code></article>`).join('')}</div>
      <div class="gate-footnotes"><span>σ：每個元素變成 0–1，控制通過多少</span><span>tanh：產生 −1 到 1 的候選記憶內容</span></div>
    `);
    return true;
  }

  // P11: 帶入數字算例（顯式呈現原始數學公式與運算符號）
  if (number === 11) {
    slide.insertAdjacentHTML('beforeend', `
      <h1 class="slide-header-title">帶入數字：一次 LSTM 更新怎麼算</h1>
      <div class="p11-formula-card">
        <div>
          <span class="f-gold">C<sub>t</sub></span> = 
          <span class="f-red">f<sub>t</sub> ⊙ C<sub>t−1</sub></span> + 
          <span class="f-green">i<sub>t</sub> ⊙ C̃<sub>t</sub></span>
        </div>
        <span class="sep">｜</span>
        <div>
          <span class="f-blue">h<sub>t</sub></span> = 
          <span class="f-purple">o<sub>t</sub></span> ⊙ tanh(<span class="f-gold">C<sub>t</sub></span>)
        </div>
      </div>
      <div class="p11-steps">
        <div class="p11-step-card tone-red">
          <h3>① 保留舊記憶</h3>
          <div class="p11-step-formula f-red">fₜ ⊙ Cₜ₋₁</div>
          <div class="p11-step-calc">0.8 × 0.5 = <strong class="f-red">0.40</strong></div>
        </div>
        <span class="calc-operator plus">+</span>
        <div class="p11-step-card tone-green">
          <h3>② 寫入新資訊</h3>
          <div class="p11-step-formula f-green">iₜ ⊙ C̃ₜ</div>
          <div class="p11-step-calc">0.6 × 0.7 = <strong class="f-green">0.42</strong></div>
        </div>
        <span class="calc-operator equals">=</span>
        <div class="p11-step-card tone-gold">
          <h3>③ 新記憶 Cₜ</h3>
          <div class="p11-step-formula f-gold">0.40 + 0.42</div>
          <div class="p11-step-calc"><span class="f-gold">Cₜ = <strong>0.82</strong></span></div>
        </div>
      </div>
      <div class="p11-output">
        <div class="p11-out-box">輸出門 <strong class="f-purple">o<sub>t</sub> = 0.5</strong></div>
        <span class="calc-operator times">×</span>
        <div class="p11-out-box">tanh(<span class="f-gold">C<sub>t</sub></span>) = tanh(0.82) ≈ <strong>0.675</strong></div>
        <span class="calc-operator equals">=</span>
        <div class="p11-out-box ans">輸出 <strong class="f-blue">h<sub>t</sub> ≈ 0.338</strong></div>
      </div>
      <p class="native-note">Cell state 是更新後的「記憶」；hidden state 是經 output gate 篩選後的「輸出」。</p>
    `);
    return true;
  }

  // P12: 同一個 LSTM Cell 沿時間展開
  if (number === 12) {
    slide.insertAdjacentHTML('beforeend', `
      <div class="p12-time-unrolling">
        <div class="p12-diagram">
          <div class="p12-shared-label">同一個 LSTM Cell · 共用同一組權重 W</div>
          <div class="p12-chain">
            <div class="p12-step">
              <span class="p12-step-tag">第 1 天</span>
              <div class="p12-input-box">輸入 x₁</div>
              <span class="p12-input-arrow">↓</span>
              <div class="p12-cell-box">LSTM Cell</div>
              <span class="p12-state">記憶 C₁、輸出 h₁</span>
            </div>
            <div class="p12-flow-bridge"><span>→</span><small>傳遞狀態</small></div>
            <div class="p12-step">
              <span class="p12-step-tag">第 2 天</span>
              <div class="p12-input-box">輸入 x₂</div>
              <span class="p12-input-arrow">↓</span>
              <div class="p12-cell-box">LSTM Cell</div>
              <span class="p12-state">記憶 C₂、輸出 h₂</span>
            </div>
            <div class="p12-flow-bridge p12-ellipsis"><span>···</span><small>依序重複</small></div>
            <div class="p12-step">
              <span class="p12-step-tag">第 20 天</span>
              <div class="p12-input-box">輸入 x₂₀</div>
              <span class="p12-input-arrow">↓</span>
              <div class="p12-cell-box">LSTM Cell</div>
              <span class="p12-state">最終輸出 h₂₀</span>
            </div>
            <div class="p12-flow-bridge"><span>→</span><small>輸出層</small></div>
            <div class="p12-pred-block">
              <span>預測第 21 天</span>
              <strong>ŷ₂₁</strong>
            </div>
          </div>
        </div>
        <div class="p12-bottom-banner">
          每一步更新記憶並傳給下一天；最後用 h₂₀ 預測第 21 天。
        </div>
      </div>
    `);
    return true;
  }

  // P22: ARO 搜尋空間全貌
  if (number === 22) {
    const left = nativeSearchOptions.slice(0, 5).map(([a, b]) => nativeCard(a, b)).join('');
    const right = nativeSearchOptions.slice(5).map(([a, b]) => nativeCard(a, b)).join('');
    slide.insertAdjacentHTML('beforeend', `<div class="native-search-grid"><div class="native-search-column">${left}</div><div class="native-search-column">${right}</div></div><p class="native-structure">固定結構：Input(20) → 可選 LSTM 層 → Dense → Dropout → Dense(1)</p>`);
    return true;
  }

  // P38: 結論與執行摘要
  if (number === 38) {
    slide.insertAdjacentHTML('beforeend', `
      <div class="p38-executive-conclusions">
        <div class="p38-grid">
          <div class="p38-card tone-teal">
            <div class="p38-header">
              <span class="p38-tag">方法創新</span>
              <h3>ARO 自動搜尋超參數</h3>
            </div>
            <p>全自動決定層數 (1~3)、神經元數、Dropout 與學習率，打破傳統人工調參盲目性。</p>
          </div>

          <div class="p38-card tone-blue">
            <div class="p38-header">
              <span class="p38-tag">實驗規模</span>
              <h3>30 檔股票 × 5 年數據</h3>
            </div>
            <p>涵蓋道瓊 30 檔成分股日線，全面對比 ANN、固定 1D/2D/3D LSTM 與基因演算法 (GA)。</p>
          </div>

          <div class="p38-card tone-gold">
            <div class="p38-header">
              <span class="p38-tag">量化成果</span>
              <h3>LSTM-ARO 表現最優</h3>
            </div>
            <p>在 30 檔股票中有 18 檔取得最低 MSE，MAE 與 MAPE 也是勝出檔數最多的模型（但非每檔皆勝，見第 32 頁）。</p>
          </div>

          <div class="p38-card tone-purple">
            <div class="p38-header">
              <span class="p38-tag">研究邊界</span>
              <h3>運算代價與交易限制</h3>
            </div>
            <p>離線搜尋需 8.7 天高算力；價格點預測誤差低，不等於扣除手續費滑點後實際獲利。</p>
          </div>
        </div>

        <div class="p38-strip">
          核心結論：群體最佳化能有效提升深度 LSTM 的預測品質，但實務落地仍需考量算力與交易成本。
        </div>
      </div>
    `);
    return true;
  }

  return false;
}
