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
  if (number === 22) {
    const left = nativeSearchOptions.slice(0, 5).map(([a, b]) => nativeCard(a, b)).join('');
    const right = nativeSearchOptions.slice(5).map(([a, b]) => nativeCard(a, b)).join('');
    slide.insertAdjacentHTML('beforeend', `<div class="native-search-grid"><div class="native-search-column">${left}</div><div class="native-search-column">${right}</div></div><p class="native-structure">固定結構：Input(20) → 可選 LSTM 層 → Dense → Dropout → Dense(1)</p>`);
    return true;
  }
  if (number === 9) {
    slide.insertAdjacentHTML('beforeend', `
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
      <div class="native-formula">C<sub>t</sub> = f<sub>t</sub> ⊙ C<sub>t−1</sub> + i<sub>t</sub> ⊙ C̃<sub>t</sub><span>h<sub>t</sub> = o<sub>t</sub> ⊙ tanh(C<sub>t</sub>)</span></div>
      <p class="native-note">⊙ 為逐元素相乘；σ（sigmoid）把門的輸出限制在 0–1。</p>
    `);
    return true;
  }
  if (number === 10) {
    const gates = [
      ['遺忘門', 'fₜ', 'σ(Wf[hₜ₋₁, xₜ] + bf)', 'tone-red'],
      ['輸入門', 'iₜ', 'σ(Wi[hₜ₋₁, xₜ] + bi)', 'tone-green'],
      ['候選記憶', 'C̃ₜ', 'tanh(Wc[hₜ₋₁, xₜ] + bc)', 'tone-blue'],
      ['輸出門', 'oₜ', 'σ(Wo[hₜ₋₁, xₜ] + bo)', 'tone-purple']
    ];
    slide.insertAdjacentHTML('beforeend', `
      <p class="native-lead">四個分支都讀取同一組輸入 [h<sub>t−1</sub>, x<sub>t</sub>]，各自學習權重與偏差。</p>
      <div class="gate-table">${gates.map(([name, symbol, equation, tone]) => `<article class="gate-row ${tone}"><div class="gate-name">${name}</div><div class="gate-input">[h<sub>t−1</sub>, x<sub>t</sub>]</div><span class="flow-arrow">→</span><div class="gate-activation">${name === '候選記憶' ? 'tanh' : 'σ'}</div><span class="flow-arrow">→</span><strong>${symbol}</strong><code>${equation}</code></article>`).join('')}</div>
      <div class="gate-footnotes"><span>σ：每個元素變成 0–1，控制通過多少</span><span>tanh：產生 −1 到 1 的候選記憶內容</span></div>
    `);
    return true;
  }
  if (number === 11) {
    slide.insertAdjacentHTML('beforeend', `
      <p class="native-lead">以下是教學假設數值，用來示範乘法與加法；不是論文的實驗結果。</p>
      <div class="calculation-steps">
        ${nativeCard('① 保留舊記憶', 'fₜ ⊙ Cₜ₋₁<br><strong>0.8 × 0.5 = 0.40</strong>', 'tone-red')}
        <span class="flow-arrow">→</span>
        ${nativeCard('② 寫入新資訊', 'iₜ ⊙ C̃ₜ<br><strong>0.6 × 0.7 = 0.42</strong>', 'tone-green')}
        <span class="flow-arrow">→</span>
        ${nativeCard('③ 合併新記憶', 'Cₜ = 0.40 + 0.42<br><strong>Cₜ = 0.82</strong>', 'tone-gold')}
      </div>
      <div class="calculation-output"><div>C<sub>t</sub> = 0.82</div><span class="flow-arrow">→</span><div>tanh(0.82) ≈ 0.675</div><span class="flow-arrow">→</span><div>o<sub>t</sub> = 0.5</div><span class="flow-arrow">→</span><div class="answer">h<sub>t</sub> ≈ 0.338</div></div>
      <p class="native-note">Cell state 是更新後的「記憶」；hidden state 是經 output gate 篩選後，傳給下一個時間步的「輸出」。</p>
    `);
    return true;
  }
  return false;
}
