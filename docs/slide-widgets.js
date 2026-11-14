// Specialized, independent Learning Lab widgets for each presentation slide.
// Replaces generic shared widgets with tailored, concept-specific educational tools.

(function () {
  'use strict';

  // Slide → widget mapping lives in app.js (widgetType). It is a top-level `let`,
  // so assigning window.widgetType here would be shadowed and never used.

  // Register widget titles for drawer header
  const newLessonNames = {
    motivation: '雙層最佳化系統架構',
    benchmarks: '對照模型特點比較',
    ann_rnn_lstm: 'ANN → RNN → LSTM 演進',
    unroll: 'LSTM 沿時間展開 (20 步)',
    time_depth: '時間 × 深度 雙向資訊流',
    arch_compare: '1D / 2D / 3D 架構堆疊',
    ga_simulation: 'GA 遺傳演算法機制模擬',
    rabbit_population: 'ARO 兔群行為模擬',
    greedy_selection: '貪婪接受準則與維度選擇',
    burrow_map: '多維隱蔽洞穴生成',
    optimization_loop: 'LSTM-ARO 完整調參循環',
    metrics_compare: '四大誤差指標對比試算',
    stock_mse: '30 檔股票 MSE 成果統計',
    stock_mae: '30 檔股票 MAE 成果統計',
    stock_mape: '30 檔股票 MAPE 成果統計',
    stock_r2: '30 檔股票 R² 成果統計',
    exceptions: '例外案例深入分析 (CAT/CVX/UNH)',
    curves: '預測走勢與殘差擬合分析',
    offline_cost: '離線搜尋計算量分解',
    limitations: '研究限制與再現性檢驗',
    conclusion: '論文核心發現與總結'
  };
  if (typeof lessonNames === 'object') {
    Object.assign(lessonNames, newLessonNames);
  }

  // Hook into renderLessonWidget
  const priorRenderWidget = typeof renderLessonWidget === 'function' ? renderLessonWidget : () => {};
  window.renderLessonWidget = function (k) {
    if (k === 'motivation') motivationLesson();
    else if (k === 'benchmarks') benchmarksLesson();
    else if (k === 'ann_rnn_lstm') annRnnLstmLesson();
    else if (k === 'unroll') unrollLesson();
    else if (k === 'time_depth') timeDepthLesson();
    else if (k === 'arch_compare') archCompareLesson();
    else if (k === 'ga_simulation') gaSimulationLesson();
    else if (k === 'rabbit_population') rabbitPopulationLesson();
    else if (k === 'greedy_selection') greedySelectionLesson();
    else if (k === 'burrow_map') burrowMapLesson();
    else if (k === 'optimization_loop') optimizationLoopLesson();
    else if (k === 'metrics_compare') metricsCompareLesson();
    else if (k === 'stock_mse') stockMseLesson();
    else if (k === 'stock_mae') stockMaeLesson();
    else if (k === 'stock_mape') stockMapeLesson();
    else if (k === 'stock_r2') stockR2Lesson();
    else if (k === 'exceptions') exceptionsLesson();
    else if (k === 'curves') curvesLesson();
    else if (k === 'offline_cost') offlineCostLesson();
    else if (k === 'limitations') limitationsLesson();
    else if (k === 'conclusion') conclusionLesson();
    else priorRenderWidget(k);
  };

  // 1. Slide 2 & 3: Motivation / Dual Loop Architecture
  function motivationLesson() {
    const d = lessonBox(`
      <div style="width:100%;max-width:440px;margin:0 auto 12px">
        <svg viewBox="0 0 440 175" style="width:100%;height:auto;display:block">
          <defs>
            <marker id="loopArrowDown" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#7c48ad" />
            </marker>
            <marker id="loopArrowUp" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#0b9d98" />
            </marker>
          </defs>

          <!-- Top Block: ARO (Slender) -->
          <rect id="p2BoxAro" x="120" y="15" width="200" height="48" rx="8" fill="#fff" stroke="#7c48ad" stroke-width="2" style="transition:all .2s"/>
          <text x="220" y="35" text-anchor="middle" font-size="13" font-weight="700" fill="#101a30">🐰 ARO 最佳化演算法 (外層)</text>
          <text id="p2AroSub" x="220" y="52" text-anchor="middle" font-size="11" font-weight="600" fill="#7c48ad">提出超參數候選解</text>

          <!-- Bottom Block: Deep LSTM (Slender) -->
          <rect id="p2BoxLstm" x="120" y="112" width="200" height="48" rx="8" fill="#fff" stroke="#0b9d98" stroke-width="2" style="transition:all .2s"/>
          <text x="220" y="132" text-anchor="middle" font-size="13" font-weight="700" fill="#101a30">🧠 Deep LSTM 預測模型 (內層)</text>
          <text id="p2LstmSub" x="220" y="149" text-anchor="middle" font-size="11" font-weight="600" fill="#0b726e">網路擬合與適應度評估</text>

          <!-- Right Curved Arrow: ARO -> LSTM (Downwards) -->
          <path id="p2ArrowDown" d="M 320 39 C 415 39, 415 136, 328 136" fill="none" stroke="#7c48ad" stroke-width="2.5" marker-end="url(#loopArrowDown)" style="transition:all .2s"/>
          <text id="p2TextDown" x="367" y="92" text-anchor="middle" font-size="12" font-weight="750" fill="#7c48ad">傳送超參數 →</text>

          <!-- Left Curved Arrow: LSTM -> ARO (Upwards) -->
          <path id="p2ArrowUp" d="M 120 136 C 25 136, 25 39, 112 39" fill="none" stroke="#0b9d98" stroke-width="2.5" marker-end="url(#loopArrowUp)" style="transition:all .2s"/>
          <text id="p2TextUp" x="73" y="92" text-anchor="middle" font-size="12" font-weight="750" fill="#0b726e">← 回傳適應度</text>
        </svg>
      </div>

      <div id="controls"></div>
      <div class="formula-display" id="p2StatusCard"></div>
      <p class="lesson-note">外層 ARO 負責提出超參數，內層 LSTM 負責模型評估；兩者透過參數傳遞與適應值回饋形成雙層閉環。</p>
    `);

    const c = d.querySelector('#controls');
    control(c, 'p2Focus', '流程切換 (ARO ⇄ Deep LSTM)', 1, 2, 1, 1);

    function update() {
      const step = +d.querySelector('#p2Focus').value;
      const boxAro = d.querySelector('#p2BoxAro');
      const boxLstm = d.querySelector('#p2BoxLstm');
      const arrowDown = d.querySelector('#p2ArrowDown');
      const arrowUp = d.querySelector('#p2ArrowUp');
      const textDown = d.querySelector('#p2TextDown');
      const textUp = d.querySelector('#p2TextUp');

      if (step === 1) {
        d.querySelector('#p2FocusValue').textContent = '1. 上方 ARO 外層搜尋';
        boxAro.setAttribute('fill', '#faf5ff');
        boxAro.setAttribute('stroke', '#7c48ad');
        boxAro.setAttribute('stroke-width', '2.8');
        boxAro.style.opacity = '1';

        boxLstm.setAttribute('fill', '#fff');
        boxLstm.setAttribute('stroke', '#c7d4e4');
        boxLstm.setAttribute('stroke-width', '1.5');
        boxLstm.style.opacity = '0.55';

        arrowDown.setAttribute('stroke', '#7c48ad');
        arrowDown.setAttribute('stroke-width', '3.5');
        arrowDown.style.opacity = '1';
        textDown.style.opacity = '1';
        textDown.setAttribute('fill', '#7c48ad');

        arrowUp.setAttribute('stroke', '#c7d4e4');
        arrowUp.setAttribute('stroke-width', '1.5');
        arrowUp.style.opacity = '0.35';
        textUp.style.opacity = '0.35';
        textUp.setAttribute('fill', '#60708a');

        d.querySelector('#p2StatusCard').innerHTML = `
          <small>當前焦點 · 上方 ARO 演算法 (外層)</small>
          <div style="margin-top:4px">🐰 <b>【外層搜尋】</b>兔群演算法在超參數空間搜尋，產生候選設定並傳送至內層模型。</div>
        `;
      } else {
        d.querySelector('#p2FocusValue').textContent = '2. 下方 LSTM 內層擬合';
        boxAro.setAttribute('fill', '#fff');
        boxAro.setAttribute('stroke', '#c7d4e4');
        boxAro.setAttribute('stroke-width', '1.5');
        boxAro.style.opacity = '0.55';

        boxLstm.setAttribute('fill', '#f0faf8');
        boxLstm.setAttribute('stroke', '#0b9d98');
        boxLstm.setAttribute('stroke-width', '2.8');
        boxLstm.style.opacity = '1';

        arrowDown.setAttribute('stroke', '#c7d4e4');
        arrowDown.setAttribute('stroke-width', '1.5');
        arrowDown.style.opacity = '0.35';
        textDown.style.opacity = '0.35';
        textDown.setAttribute('fill', '#60708a');

        arrowUp.setAttribute('stroke', '#0b9d98');
        arrowUp.setAttribute('stroke-width', '3.5');
        arrowUp.style.opacity = '1';
        textUp.style.opacity = '1';
        textUp.setAttribute('fill', '#0b726e');

        d.querySelector('#p2StatusCard').innerHTML = `
          <small>當前焦點 · 下方 Deep LSTM 預測模型 (內層)</small>
          <div style="margin-top:4px">🧠 <b>【內層擬合】</b>Deep LSTM 依接收到的超參數建構並訓練，再將適應度回傳給 ARO。</div>
        `;
      }
      animateFormula(d);
    }

    c.oninput = update;
    update();
  }

  // 2. Slide 6: Model Benchmarks Comparison
  function benchmarksLesson() {
    const models = [
      { name: 'ANN', type: '全連接網路', memory: '無時間序列記憶單元', search: '手動預設 (無調參)', pros: '訓練推論速度最快 (136.5s)', cons: '忽略歷史時間依賴性，預測誤差最高' },
      { name: 'LSTM1D / 2D / 3D', type: '固定深度 LSTM', memory: '具備門控時間狀態 (Cₜ, hₜ)', search: '固定架構 (未演化搜尋)', pros: '能學到序列相依特徵', cons: '層數與神經元固定，無法適應不同股票波動特徵' },
      { name: 'LSTM-GA', type: '遺傳演算法調參 LSTM', memory: '具備門控時間狀態', search: 'GA (選擇、交配、突變)', pros: '自動搜尋超參數，誤差顯著低於固定模型', cons: '收斂速度較慢，易早熟收斂至局部最佳解' },
      { name: 'LSTM-ARO (本文)', type: '兔群最佳化深度 LSTM', memory: '具備門控時間狀態', search: 'ARO (繞路覓食 + 隨機躲藏)', pros: '30 檔股票中有 18 檔 MSE 最低', cons: '離線搜尋時間較長 (約 8.74 天)' }
    ];
    const d = lessonBox(`
      <label class="lesson-control"><span>選擇對照模型查看特點：</span>
        <select id="benchmarkPicker">
          ${models.map((m, i) => `<option value="${i}">${m.name}</option>`).join('')}
        </select>
      </label>
      <div id="benchmarkCard" class="widget-card"></div>
      <p class="lesson-note">論文在 30 檔道瓊成分股上將上述四類模型全面對標比較。</p>
    `);
    const picker = d.querySelector('#benchmarkPicker');
    function show() {
      const m = models[+picker.value];
      d.querySelector('#benchmarkCard').innerHTML = `
        <div style="font-size:16px;font-weight:750;color:#0b726e;margin-bottom:8px">${m.name}</div>
        <div style="font-size:13px;line-height:1.6">
          <div>• <strong>架構型態：</strong>${m.type}</div>
          <div>• <strong>序列記憶：</strong>${m.memory}</div>
          <div>• <strong>調參機制：</strong>${m.search}</div>
          <div style="color:#0b726e">• <strong>主要優點：</strong>${m.pros}</div>
          <div style="color:#c66817">• <strong>限制代價：</strong>${m.cons}</div>
        </div>
      `;
    }
    picker.onchange = show;
    show();
  }

  // 3. Slide 7 & 8: ANN -> RNN -> LSTM Evolution
  function annRnnLstmLesson() {
    const d = lessonBox(`
      <div class="formula-display" id="evoFormula"></div>
      <div id="controls"></div>
      <div class="term-bars" id="evoBars"></div>
      <p class="lesson-note">傳統 RNN 因連乘導數導致梯度隨步長呈指數衰減；LSTM 透過 Cell State 的加法長廊確保梯度無損傳播。</p>
    `);
    const c = d.querySelector('#controls');
    control(c, 'seqLen', '時間序列長度 (Time Steps T)', 1, 20, 1, 10);
    control(c, 'decayRate', '單步權重衰減係數 W', 0.5, 0.95, 0.05, 0.85);
    function update() {
      const T = +d.querySelector('#seqLen').value;
      const W = +d.querySelector('#decayRate').value;
      d.querySelector('#seqLenValue').textContent = `${T} 步`;
      d.querySelector('#decayRateValue').textContent = W.toFixed(2);
      const rnnGrad = Math.pow(W, T);
      const lstmGrad = 0.95; // Additive highway maintains near unity
      d.querySelector('#evoFormula').innerHTML = `
        <small>傳播到第 ${param('seqLen', T)} 步時的梯度殘存比例</small>
        <div>傳統 RNN 乘法流：Wᵀ = ${param('decayRate', W.toFixed(2))}<sup>${param('seqLen', T)}</sup> = <b>${rnnGrad < 0.001 ? '< 0.001 (梯度消失)' : (rnnGrad * 100).toFixed(1) + '%'}</b></div>
        <div>LSTM 加法長廊：∂Cₜ/∂Cₜ₋₁ ≈ fₜ ··· 保留率 ≈ <b>${(lstmGrad * 100).toFixed(0)}% (無衰減通道)</b></div>
      `;
      d.querySelector('#evoBars').innerHTML = `
        <div><span>傳統 RNN</span><i style="width:${Math.max(2, rnnGrad * 100)}%;background:#d85b61"></i></div>
        <div><span>LSTM (本文)</span><i style="width:${lstmGrad * 100}%;background:#0b9d98"></i></div>
      `;
      animateFormula(d);
    }
    c.oninput = update;
    update();
  }

  // 4. Slide 12: LSTM Unrolling Step-by-Step
  function unrollLesson() {
    const d = lessonBox(`
      <div class="formula-display" id="unrollFormula"></div>
      <div class="unroll-step-display" id="unrollStepBox"></div>
      <div id="controls"></div>
      <p class="lesson-note">核心特點：沿著 20 個時間步推進時，使用的全都是同一組權重矩陣（權重共享），模型參數量不隨視窗長度增長。</p>
    `);
    const c = d.querySelector('#controls');
    control(c, 'stepT', '當前時間步 (Step t)', 1, 20, 1, 5);
    function update() {
      const t = +d.querySelector('#stepT').value;
      d.querySelector('#stepTValue').textContent = `第 ${t} / 20 步`;
      d.querySelector('#unrollFormula').innerHTML = `
        <small>時間步 t = ${param('stepT', t)} 的單元運算</small>
        <div>輸入：第 ${param('stepT', t)} 天股價 x₍${t}₎ 搭配前一步記憶 (h₍${t - 1}₎, C₍${t - 1}₎)</div>
        <div>輸出：新記憶 C₍${t}₎ 與隱藏輸出 h₍${t}₎ 傳遞給第 ${t < 20 ? t + 1 : 20} 步</div>
      `;
      const dots = Array.from({ length: 20 }, (_, i) => {
        const active = i + 1 === t;
        const passed = i + 1 < t;
        return `<span style="display:inline-block;width:18px;height:18px;line-height:18px;border-radius:50%;text-align:center;font-size:10px;font-weight:700;margin:2px;background:${active ? '#0b9d98' : passed ? '#a3d9d5' : '#e0e7f1'};color:${active ? '#fff' : '#334e68'}">${i + 1}</span>`;
      }).join('');
      d.querySelector('#unrollStepBox').innerHTML = `
        <div style="margin:10px 0;text-align:center">${dots}</div>
        <div style="font-size:13px;color:#52637c;text-align:center">${t === 20 ? '🎉 抵達第 20 步：最終隱藏狀態 h₂₀ 將輸出給 Dense 層進行第 21 日價格預測' : `狀態遞歸傳遞中：(h${t}, C${t}) → 下一步`}</div>
      `;
      animateFormula(d);
    }
    c.oninput = update;
    update();
  }

  // 5. Slide 13: Time x Depth 2D Grid
  function timeDepthLesson() {
    const d = lessonBox(`
      <div class="formula-display" id="tdFormula"></div>
      <div id="controls"></div>
      <div id="tdGrid" class="widget-card" style="margin-top:12px"></div>
      <p class="lesson-note">橫向代表序列記憶的跨時間傳遞（時序關係）；縱向代表高階特徵的逐層抽象萃取（空間深度）。</p>
    `);
    const c = d.querySelector('#controls');
    control(c, 'tdTime', '聚焦時間步 (Time t)', 1, 4, 1, 2);
    control(c, 'tdLayer', '聚焦層數 (Layer l)', 1, 3, 1, 2);
    function update() {
      const t = +d.querySelector('#tdTime').value;
      const l = +d.querySelector('#tdLayer').value;
      d.querySelector('#tdTimeValue').textContent = `t = ${t}`;
      d.querySelector('#tdLayerValue').textContent = `第 ${l} 層`;
      d.querySelector('#tdFormula').innerHTML = `
        <small>單元 (t=${param('tdTime', t)}, Layer=${param('tdLayer', l)}) 的兩個輸入源</small>
        <div>1. 橫向時序輸入：來自同層前一步之 ${param('tdTime', `h₍${t - 1}₎`)}<sup>⟨${l}⟩</sup></div>
        <div>2. 縱向深度輸入：來自下層同時間之 ${param('tdLayer', `h₍${t}₎`)}<sup>⟨${l - 1}⟩</sup></div>
      `;
      // Render 3 layers x 4 steps grid
      let gridHtml = '<div style="display:grid;grid-template-columns:60px repeat(4, 1fr);gap:6px;align-items:center;font-size:12px;font-weight:700">';
      gridHtml += '<div></div><div>t=1</div><div>t=2</div><div>t=3</div><div>t=4</div>';
      for (let lay = 3; lay >= 1; lay--) {
        gridHtml += `<div>Layer ${lay}</div>`;
        for (let step = 1; step <= 4; step++) {
          const isTarget = lay === l && step === t;
          const isTimeIn = lay === l && step === t - 1;
          const isLayerIn = lay === l - 1 && step === t;
          const bg = isTarget ? '#0b9d98' : isTimeIn ? '#e0802a' : isLayerIn ? '#315fd1' : '#f0f4f9';
          const fg = (isTarget || isTimeIn || isLayerIn) ? '#fff' : '#52637c';
          gridHtml += `<div style="padding:10px 4px;border-radius:6px;background:${bg};color:${fg};text-align:center">h₍${step}₎<sup>⟨${lay}⟩</sup></div>`;
        }
      }
      gridHtml += '</div>';
      d.querySelector('#tdGrid').innerHTML = gridHtml;
      animateFormula(d);
    }
    c.oninput = update;
    update();
  }

  // 6. Slide 14: 1D vs 2D vs 3D Architecture Comparison (Based on Paper Tables 2, 3, 4, 6)
  function archCompareLesson() {
    const d = lessonBox(`
      <div class="preset-buttons">
        <button type="button" class="preset-btn" data-preset="tab2">載入 Table 2 · 1D 基準 (10神經元)</button>
        <button type="button" class="preset-btn" data-preset="tab3">載入 Table 3 · 2D 基準 (10+10神經元)</button>
        <button type="button" class="preset-btn" data-preset="tab4">載入 Table 4 · 3D 基準 (10+10+10神經元)</button>
      </div>

      <div class="widget-card" style="margin-bottom:12px">
        <div style="font-weight:750;color:#0b726e;margin-bottom:8px">原論文 Table 6 搜尋空間合法範圍滑桿：</div>
        <div id="controls"></div>
      </div>

      <div id="archDiagram" class="architecture"></div>
      <div class="formula-display" id="archParams"></div>
      <p class="lesson-note">論文 Table 6 規定搜尋空間：神經元 1~20、Dropout 0.3~0.7、優化器 5 種、學習率 5 種。上方按鈕可一鍵套用 Tables 2, 3, 4 固定基準。</p>
    `);

    const c = d.querySelector('#controls');
    control(c, 'pL1', '第 1 層 LSTM 神經元 (Table 6 可選 1~20)', 1, 20, 1, 10);
    control(c, 'pL2', '第 2 層 LSTM 神經元 (Table 6 可選 0~20，0表停用)', 0, 20, 1, 10);
    control(c, 'pL3', '第 3 層 LSTM 神經元 (Table 6 可選 0~20，0表停用)', 0, 20, 1, 0);
    control(c, 'pDense', 'Dense 層神經元 (Table 6 可選 1~20)', 1, 20, 1, 10);
    control(c, 'pDrop', 'Dropout 拋棄率 (Table 6 可選 0.3~0.7)', 0.3, 0.7, 0.05, 0.5);

    c.insertAdjacentHTML('beforeend', `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
        <label class="lesson-control"><span>Optimizer (Table 6 可選 5 種)：</span>
          <select id="pOpt"><option selected>Adam</option><option>Adagrad</option><option>Adamax</option><option>RMSprop</option><option>SGD</option></select>
        </label>
        <label class="lesson-control"><span>Learning Rate (Table 6 可選 5 種)：</span>
          <select id="pLr"><option>0.01</option><option selected>0.001</option><option>0.0001</option><option>0.00001</option><option>0.000001</option></select>
        </label>
      </div>
    `);

    const presetBtns = d.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
      btn.onclick = () => {
        const mode = btn.dataset.preset;
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (mode === 'tab2') {
          d.querySelector('#pL1').value = 10;
          d.querySelector('#pL2').value = 0;
          d.querySelector('#pL3').value = 0;
          d.querySelector('#pDense').value = 10;
          d.querySelector('#pDrop').value = 0.5;
        } else if (mode === 'tab3') {
          d.querySelector('#pL1').value = 10;
          d.querySelector('#pL2').value = 10;
          d.querySelector('#pL3').value = 0;
          d.querySelector('#pDense').value = 10;
          d.querySelector('#pDrop').value = 0.5;
        } else if (mode === 'tab4') {
          d.querySelector('#pL1').value = 10;
          d.querySelector('#pL2').value = 10;
          d.querySelector('#pL3').value = 10;
          d.querySelector('#pDense').value = 10;
          d.querySelector('#pDrop').value = 0.5;
        }
        update();
      };
    });

    function update() {
      const n1 = +d.querySelector('#pL1').value;
      const n2 = +d.querySelector('#pL2').value;
      const n3 = +d.querySelector('#pL3').value;
      const dense = +d.querySelector('#pDense').value;
      const drop = +d.querySelector('#pDrop').value;
      const opt = d.querySelector('#pOpt').value;
      const lr = d.querySelector('#pLr').value;

      d.querySelector('#pL1Value').textContent = `${n1} 神經元`;
      d.querySelector('#pL2Value').textContent = n2 > 0 ? `${n2} 神經元` : '0 (停用/1D)';
      d.querySelector('#pL3Value').textContent = n3 > 0 ? `${n3} 神經元` : '0 (停用)';
      d.querySelector('#pDenseValue').textContent = `${dense} 神經元`;
      d.querySelector('#pDropValue').textContent = drop.toFixed(2);

      const hasL2 = n2 > 0;
      const hasL3 = n3 > 0 && hasL2;

      // Exact parameter calculation based on LSTM formula: 4 * ((din + dout) * dout + dout)
      const p1 = 4 * ((1 + n1) * n1 + n1);
      const p2 = hasL2 ? 4 * ((n1 + n2) * n2 + n2) : 0;
      const p3 = hasL3 ? 4 * ((n2 + n3) * n3 + n3) : 0;
      const lastN = hasL3 ? n3 : hasL2 ? n2 : n1;
      const pDense = (lastN + 1) * dense;
      const pOut = (dense + 1) * 1;
      const totalParams = p1 + p2 + p3 + pDense + pOut;

      const layers = [
        ['輸入層 (Input)', '20 日收盤價序列 · 張量維度: [20, 1] · 0 參數']
      ];
      layers.push(['LSTM 1', `${n1} 神經元 · 輸出維度: [20, ${n1}] · ${p1} 參數 (4×[(${1}+${n1})×${n1}+${n1}])`]);
      if (hasL2) {
        layers.push(['LSTM 2', `${n2} 神經元 · 輸出維度: [${hasL3 ? '20, ' : ''}${n2}] · ${p2} 參數 (4×[(${n1}+${n2})×${n2}+${n2}])`]);
      }
      if (hasL3) {
        layers.push(['LSTM 3', `${n3} 神經元 · 輸出維度: [${n3}] · ${p3} 參數 (4×[(${n2}+${n3})×${n3}+${n3}])`]);
      }
      layers.push(['全連接層 (Dense)', `${dense} 神經元 + ReLU · 維度: [${dense}] · ${pDense} 參數`]);
      layers.push(['隨機丟棄 (Dropout)', `拋棄率 ${drop.toFixed(2)} · 防止過擬合 · 0 參數`]);
      layers.push(['輸出層 (Dense)', `1 個預測值 (次日價格 ŷ) · ${pOut} 參數`]);

      d.querySelector('#archDiagram').innerHTML = layers.map(([n, desc], i) => `
        <div class="architecture-node"><strong>${n}</strong><span>${desc}</span></div>
        ${i < layers.length - 1 ? '<div class="architecture-arrow">↓</div>' : ''}
      `).join('') + `<div class="architecture-meta">優化器：${opt} ｜ 學習率：${lr} ｜ 當前架構：${hasL3 ? '3D' : hasL2 ? '2D' : '1D'} LSTM</div>`;

      d.querySelector('#archParams').innerHTML = `
        <small>架構參數量精確試算（對標論文 Tables 2, 3, 4, 6）</small>
        <div>模型總可訓練參數：<b>${totalParams.toLocaleString()} 個權重參數</b></div>
        <div>參數組成：LSTM 層 (${(p1 + p2 + p3).toLocaleString()}) + 全連接層 (${(pDense + pOut).toLocaleString()})</div>
        <div style="font-size:12px;color:#60708a;margin-top:4px">
          論文固定基準對照：Table 2 (1D) = 601 參數 ｜ Table 3 (2D) = 1,441 參數 ｜ Table 4 (3D) = 2,281 參數
        </div>
      `;
      animateFormula(d);
    }

    c.oninput = update;
    c.onchange = update;
    update();
  }

  // 7. Slide 15: GA Chromosome Crossover & Mutation (Pure Visual, Zero Fluff)
  function gaSimulationLesson() {
    const d = lessonBox(`
      <div class="widget-card" style="margin-bottom:12px;padding:12px">
        <!-- Parent A -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
          <strong style="color:#184a8a;font-size:13px">👨 爸爸模型 (Parent A)</strong>
          <span style="font-size:11px;font-weight:750;color:#184a8a;background:#e9f4ff;padding:2px 8px;border-radius:10px">實測 MSE = 24.1</span>
        </div>
        <div class="chromo-strip" id="stripParentA"></div>

        <!-- Scissor Cut Marker -->
        <div class="scissor-marker" id="scissorNotice" style="margin:8px 0;font-size:13px">
          ✂️ 剪刀在第 3 格後剪開！
        </div>

        <!-- Parent B -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
          <strong style="color:#5a1e8a;font-size:13px">👩 媽媽模型 (Parent B)</strong>
          <span style="font-size:11px;font-weight:750;color:#5a1e8a;background:#f7eefe;padding:2px 8px;border-radius:10px">實測 MSE = 29.5</span>
        </div>
        <div class="chromo-strip" id="stripParentB"></div>

        <!-- Recombined Offspring -->
        <div style="margin-top:14px;padding-top:10px;border-top:2px dashed #0b9d9855">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <strong style="color:#0b726e;font-size:13px">👶 拼裝出的子代模型 (Offspring)</strong>
            <b id="offspringMseBadge" style="background:#0b9d98;color:#fff;padding:2px 8px;border-radius:12px;font-size:12px">實測 MSE = 22.8 ★</b>
          </div>
          <div class="chromo-strip" id="stripOffspring"></div>
          <div id="p15SourceTag" style="font-size:11px;color:#60708a;margin-top:6px;text-align:center">
            前 3 格繼承爸爸 A（藍色）＋ 後 3 格繼承媽媽 B（紫色）
          </div>
        </div>
      </div>

      <div id="controls"></div>
      <div class="formula-display" id="gaFormula"></div>
      <p class="lesson-note">核心差異：GA 用剪刀粗暴切斷積木拼接；ARO 則是兔子在連續空間朝同伴飛奔滑動，收斂更平滑穩定。</p>
    `);

    const c = d.querySelector('#controls');
    control(c, 'crossCut', '✂️ 剪刀切點 (在第幾格後剪開)', 1, 5, 1, 3);
    c.insertAdjacentHTML('beforeend', '<label class="switch-line"><input type="checkbox" id="gaMutate" checked> ⚡ 隨機突變 (Mutation)</label>');

    const geneLabels = ['第1層神經元', '第2層神經元', 'Dense神經元', 'Dropout', '優化器', '學習率'];
    const pA = ['16', '12', '14', '0.4', 'Adam', '0.001'];
    const pB = ['8', '0 (停用)', '8', '0.5', 'RMSprop', '0.0001'];

    function update() {
      const cut = +d.querySelector('#crossCut').value;
      const mut = d.querySelector('#gaMutate').checked;
      d.querySelector('#crossCutValue').textContent = `前 ${cut} 格繼承爸爸 A，後 ${6 - cut} 格繼承媽媽 B`;
      d.querySelector('#scissorNotice').textContent = `✂️ 剪刀在第 ${cut} 格「${geneLabels[cut - 1]}」後切斷！`;

      // Render Parent A
      d.querySelector('#stripParentA').innerHTML = geneLabels.map((label, i) => `
        <div class="gene-box gene-parent-a" style="${i < cut ? 'box-shadow:0 0 0 2px #367af6;' : 'opacity:0.5;'}">
          <small>${label}</small>
          <strong>${pA[i]}</strong>
        </div>
      `).join('');

      // Render Parent B
      d.querySelector('#stripParentB').innerHTML = geneLabels.map((label, i) => `
        <div class="gene-box gene-parent-b" style="${i >= cut ? 'box-shadow:0 0 0 2px #9333ea;' : 'opacity:0.5;'}">
          <small>${label}</small>
          <strong>${pB[i]}</strong>
        </div>
      `).join('');

      // Build Offspring
      const offspring = [];
      const sources = [];
      for (let i = 0; i < 6; i++) {
        if (i < cut) {
          offspring.push(pA[i]);
          sources.push('a');
        } else {
          offspring.push(pB[i]);
          sources.push('b');
        }
      }

      if (mut) {
        offspring[5] = '0.00001 ⚡';
        sources[5] = 'mut';
      }

      // Render Offspring Strip
      d.querySelector('#stripOffspring').innerHTML = offspring.map((val, i) => {
        const src = sources[i];
        const cls = src === 'mut' ? 'gene-mutated' : src === 'a' ? 'gene-child-a' : 'gene-child-b';
        return `
          <div class="gene-box ${cls}">
            <small>${geneLabels[i]}</small>
            <strong>${val}</strong>
          </div>
        `;
      }).join('');

      // Compute offspring performance
      let childMse = 24.1;
      if (cut === 3 && mut) childMse = 22.8;
      else if (cut >= 3 && !mut) childMse = 23.5;
      else if (cut < 3 && mut) childMse = 25.2;
      else childMse = 27.6;

      const badge = d.querySelector('#offspringMseBadge');
      badge.textContent = `實測 MSE = ${childMse.toFixed(1)} ${childMse < 24.1 ? '★ 超越雙親！' : ''}`;
      badge.style.background = childMse < 24.1 ? '#0b9d98' : '#7c48ad';

      d.querySelector('#p15SourceTag').innerHTML = `
        前 ${cut} 格來自爸爸 A（藍）＋ 後 ${6 - cut} 格來自媽媽 B（紫）${mut ? ' ＋ <span style="color:#d87b00;font-weight:750">⚡ 學習率突變</span>' : ''}
      `;

      d.querySelector('#gaFormula').innerHTML = `
        <small>成果成績單</small>
        <div>爸爸 MSE 24.1 ｜ 媽媽 MSE 29.5 ｜ <b>子代 MSE ${childMse.toFixed(1)}</b> ${childMse < 24.1 ? '<span style="color:#0b726e;font-weight:750">（成功結合雙親優勢，誤差更低！）</span>' : ''}</div>
      `;
      animateFormula(d);
    }

    c.oninput = update;
    c.onchange = update;
    update();
  }

  // 8. Slide 16: ARO Rabbit Population Simulation
  function rabbitPopulationLesson() {
    const d = lessonBox(`
      <div class="formula-display" id="popFormula"></div>
      <div id="controls"></div>
      <div id="popField" class="widget-card" style="margin-top:12px;text-align:center"></div>
      <p class="lesson-note">前期能量 A(t) > 1，兔子大幅繞路覓食以探索未知的超參數區域；後期 A(t) ≤ 1，轉為就近躲藏進行精細局部微調。</p>
    `);
    const c = d.querySelector('#controls');
    control(c, 'popProgress', '搜尋迭代進度 t/T', 0, 1, 0.05, 0.3);
    function update() {
      const t = +d.querySelector('#popProgress').value;
      d.querySelector('#popProgressValue').textContent = `${Math.round(t * 100)}%`;
      const exploreCount = Math.round(50 * Math.max(0, 1 - t * 1.2));
      const exploitCount = 50 - exploreCount;
      d.querySelector('#popFormula').innerHTML = `
        <small>50 隻兔子之群體行為動態分工</small>
        <div>繞路覓食 (探索)：${param('popProgress', exploreCount)} 隻兔子 · 廣域搜尋不同網路深度</div>
        <div>隨機躲藏 (開發)：${param('popProgress', exploitCount)} 隻兔子 · 洞穴鄰域精修最佳解</div>
      `;
      let dots = '';
      for (let i = 0; i < 50; i++) {
        const isExp = i < exploreCount;
        dots += `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;margin:3px;background:${isExp ? '#315fd1' : '#0b9d98'};box-shadow:0 0 4px ${isExp ? '#315fd166' : '#0b9d9866'}"></span>`;
      }
      d.querySelector('#popField').innerHTML = `
        <div style="margin-bottom:8px">${dots}</div>
        <div style="font-size:12px;color:#52637c">🔵 探索個體 (Exploration) ｜ 🟢 開發個體 (Exploitation)</div>
      `;
      animateFormula(d);
    }
    c.oninput = update;
    update();
  }

  // 9. Slide 18: Greedy Selection & Dimension Mask
  function greedySelectionLesson() {
    const d = lessonBox(`
      <div class="formula-display" id="greedyFormula"></div>
      <div class="decision" id="greedyBadge"></div>
      <div id="controls"></div>
      <p class="lesson-note">貪婪選擇（Greedy Selection）確保適應度絕不倒退：只有候選位置的預測誤差較低時，兔子才會移動。</p>
    `);
    const c = d.querySelector('#controls');
    control(c, 'currMse', '目前兔子位置誤差 f(xᵢ)', 10, 80, 1, 35);
    control(c, 'candMse', '候選新位置誤差 f(vᵢ)', 10, 80, 1, 28);
    function update() {
      const cur = +d.querySelector('#currMse').value;
      const cand = +d.querySelector('#candMse').value;
      d.querySelector('#currMseValue').textContent = `${cur}`;
      d.querySelector('#candMseValue').textContent = `${cand}`;
      const accept = cand < cur;
      d.querySelector('#greedyFormula').innerHTML = `
        <small>貪婪選擇公式：xᵢ(t+1) = vᵢ 若 f(vᵢ) < f(xᵢ) 否則維持 xᵢ</small>
        <div>目前誤差 f(xᵢ) = ${param('currMse', cur)} ｜ 候選誤差 f(vᵢ) = ${param('candMse', cand)}</div>
        <div>誤差差值 Δ = ${cand - cur > 0 ? '+' : ''}${(cand - cur).toFixed(1)}</div>
      `;
      const badge = d.querySelector('#greedyBadge');
      if (accept) {
        badge.textContent = '✅ 誤差降低！接受候選位置 (Update to vᵢ)';
        badge.style.background = '#0b9d98';
      } else {
        badge.textContent = '❌ 誤差未改善！捨棄候選解，留在原位 (Keep xᵢ)';
        badge.style.background = '#d85b61';
      }
      animateFormula(d);
    }
    c.oninput = update;
    update();
  }

  // 10. Slide 20: Burrow Map Generation
  function burrowMapLesson() {
    const d = lessonBox(`
      <div class="formula-display" id="burrowFormula"></div>
      <div id="controls"></div>
      <div id="burrowList" class="widget-card" style="margin-top:12px"></div>
      <p class="lesson-note">每隻兔子在每個超參數維度附近挖一個洞穴；隨迭代 t 增加，洞穴半徑 H 縮小，實現從粗調到微調的收斂。</p>
    `);
    const c = d.querySelector('#controls');
    control(c, 'bIter', '目前迭代 t (T=50)', 1, 50, 1, 15);
    control(c, 'bPos', '兔子在維度 j 的目前位置 xᵢ', 1, 20, 1, 12);
    function update() {
      const t = +d.querySelector('#bIter').value;
      const pos = +d.querySelector('#bPos').value;
      d.querySelector('#bIterValue').textContent = `t = ${t}`;
      d.querySelector('#bPosValue').textContent = pos;
      const H = ((51 - t) / 50 * 0.7); // scale with sample r4
      const bLeft = Math.max(1, Math.round(pos - H * pos * 0.5));
      const bRight = Math.min(20, Math.round(pos + H * pos * 0.5));
      d.querySelector('#burrowFormula').innerHTML = `
        <small>洞穴半徑係數 H = ((T − t + 1) / T) × r₄</small>
        <div>半徑 H = ((50 − ${param('bIter', t)} + 1) / 50) × 0.7 = <b>${H.toFixed(3)}</b></div>
        <div>第 j 維洞穴分佈範圍：[${param('bPos', bLeft)}, ${param('bPos', bRight)}]</div>
      `;
      d.querySelector('#burrowList').innerHTML = `
        <div style="font-size:13px;line-height:1.6">
          <div>• 兔子所在位置：<span class="chip" style="background:#eaf1ff;color:#214cae">xᵢ = ${pos}</span></div>
          <div>• 產生的洞穴候選位置：<span class="chip" style="background:#e6f7f4;color:#0b726e">bᵢ,₁ ≈ ${bLeft}</span> <span class="chip" style="background:#e6f7f4;color:#0b726e">bᵢ,₂ ≈ ${bRight}</span></div>
          <div style="color:#60708a;margin-top:4px">收斂特性：當 t 接近 50 時，H → 0，洞穴緊貼目前最優解微幅抖動。</div>
        </div>
      `;
      animateFormula(d);
    }
    c.oninput = update;
    update();
  }

  // 11. Slide 24: 5-Stage ARO Optimization Loop
  function optimizationLoopLesson() {
    const stages = [
      { step: 1, name: '族群初始化', desc: '在超參數邊界內隨機生成 50 隻兔子（每隻代表一組 [層數, 神經元, Dropout, LR 等]）' },
      { step: 2, name: '建構網路', desc: '解碼兔子向量為 Keras/TensorFlow 多層 LSTM 網路模型' },
      { step: 3, name: '訓練與評估', desc: '以 80% 交易日資料訓練各網路，以 20% 測試資料計算 MSE 作為適應值' },
      { step: 4, name: 'ARO 更新', desc: '計算能量 A(t)，依 A>1 執行繞路覓食或 A≤1 執行隨機躲藏，貪婪選擇保留較優位置' },
      { step: 5, name: '輸出最優解', desc: '重複 50 次迭代後，輸出全域最佳適應值兔子，建立最終股價預測模型' }
    ];
    const d = lessonBox(`
      <div id="controls"></div>
      <div class="formula-display" id="stageInfo"></div>
      <div id="stageTimeline" style="display:flex;justify-content:space-between;margin-top:14px"></div>
      <p class="lesson-note">論文中 30 檔股票均獨立執行此完整 5 階段最佳化循環。</p>
    `);
    const c = d.querySelector('#controls');
    control(c, 'stageIdx', '選擇運作流程步驟', 1, 5, 1, 3);
    function update() {
      const idx = +d.querySelector('#stageIdx').value;
      const s = stages[idx - 1];
      d.querySelector('#stageIdxValue').textContent = `步驟 ${idx}：${s.name}`;
      d.querySelector('#stageInfo').innerHTML = `
        <small>流程階段 ${idx} / 5</small>
        <div style="font-size:16px;font-weight:750;color:#0b726e">${s.name}</div>
        <div style="margin-top:5px">${s.desc}</div>
      `;
      d.querySelector('#stageTimeline').innerHTML = stages.map(st => `
        <div style="text-align:center;flex:1">
          <div style="width:26px;height:26px;line-height:26px;border-radius:50%;margin:auto;font-size:12px;font-weight:700;background:${st.step === idx ? '#0b9d98' : st.step < idx ? '#7dd3cb' : '#e4eaf2'};color:${st.step <= idx ? '#fff' : '#60708a'}">${st.step}</div>
          <div style="font-size:11px;margin-top:4px;color:${st.step === idx ? '#0b726e' : '#60708a'}">${st.name}</div>
        </div>
      `).join('');
      animateFormula(d);
    }
    c.oninput = update;
    update();
  }

  // 12. Slide 26: 4 Error Metrics Head-to-Head
  function metricsCompareLesson() {
    const DEFAULTS = [[100, 102], [105, 103], [110, 118]]; // [實際 y, 預測 ŷ]
    const MIN = 80, MAX = 130;
    const C_ACT = '#315fd1', C_PRD = '#c66817', C_ERR = '#d85b61';
    const C_SAMPLE = ['#0b9d98', '#7c48ad', '#64748b'];
    const SUB = ['₁', '₂', '₃'];
    const slider = (cls, k, sym, color, v) => `
      <label class="lesson-control" style="--param-color:${color}">
        <span>${sym}${SUB[k]} <b class="${cls}Value" style="color:${color}">${v}</b></span>
        <input type="range" class="${cls}" min="${MIN}" max="${MAX}" step="1" value="${v}" aria-label="第 ${k + 1} 筆${cls === 'act' ? '實際值' : '預測值'}">
      </label>`;
    const d = lessonBox(`
      <div class="metric-sliders" id="compInputs">
        ${DEFAULTS.map(([a, p], k) => `
          <div class="metric-row">
            <strong><i style="background:${C_SAMPLE[k]}"></i>第 ${k + 1} 筆</strong>
            ${slider('act', k, '實際 y', C_ACT, a)}
            ${slider('prd', k, '預測 ŷ', C_PRD, p)}
          </div>`).join('')}
      </div>
      <div class="metric-actions">
        <button type="button" class="try-formula" id="compRandom">隨機產生資料</button>
        <button type="button" class="try-formula ghost" id="compReset">重設</button>
      </div>
      <figure class="lesson-chart metric-chart">
        <svg id="compLine" viewBox="0 0 460 212" role="img" aria-label="實際值與預測值折線圖，含逐筆誤差"></svg>
        <figcaption><b style="color:${C_ACT}">● 實際值 y</b>　<b style="color:${C_PRD}">● 預測值 ŷ</b>　<b style="color:${C_ERR}">┃ 誤差 e = y − ŷ</b>　<span>┄ 實際值平均 ȳ</span></figcaption>
      </figure>
      <div class="metric-tiles" id="compResults"></div>
      <figure class="lesson-chart metric-chart" id="compShare"></figure>
      <p class="lesson-note">試著把某一筆的預測值拉遠：該筆在 MSE 的佔比會比在 MAE 更高（平方懲罰）。SSE 超過 SST 時 R² 為負，代表比「一律猜平均值」還差。</p>
    `);
    const acts = () => [...d.querySelectorAll('.act')].map(x => +x.value);
    const prds = () => [...d.querySelectorAll('.prd')].map(x => +x.value);
    const num = (v, n = 2) => v.toFixed(n).replace('-', '−');
    const trim = v => num(v, 2).replace(/\.?0+$/, '');

    // chart geometry
    const X0 = 40, X1 = 446, Y0 = 14, Y1 = 178, YMIN = 70, YMAX = 140;
    const sx = k => X0 + 62 + k * (X1 - X0 - 124) / 2;
    const sy = v => Y1 - (v - YMIN) / (YMAX - YMIN) * (Y1 - Y0);

    function drawLine(a, p, e, mean) {
      const grid = [80, 100, 120, 140].map(v => `<line x1="${X0}" y1="${sy(v)}" x2="${X1}" y2="${sy(v)}" stroke="#e8edf4"/><text x="${X0 - 6}" y="${sy(v) + 4}" font-size="11" text-anchor="end" fill="#60708a">${v}</text>`).join('');
      const xl = a.map((_, k) => `<text x="${sx(k)}" y="${Y1 + 17}" font-size="11" text-anchor="middle" fill="#60708a">第 ${k + 1} 筆</text>`).join('');
      const pts = arr => arr.map((v, k) => `${sx(k)},${sy(v).toFixed(1)}`).join(' ');
      const resid = e.map((ek, k) => {
        const mid = (sy(a[k]) + sy(p[k])) / 2;
        return `<line x1="${sx(k)}" y1="${sy(a[k])}" x2="${sx(k)}" y2="${sy(p[k])}" stroke="${C_ERR}" stroke-width="5" stroke-linecap="round" opacity=".55"/>
          <text x="${sx(k) + 11}" y="${mid + 4}" font-size="12" font-weight="700" fill="${C_ERR}" stroke="#fafcfe" stroke-width="3.5" paint-order="stroke">e${SUB[k]} = ${trim(ek)}</text>`;
      }).join('');
      const dots = (arr, color) => arr.map((v, k) => `<circle cx="${sx(k)}" cy="${sy(v)}" r="5.5" fill="${color}" stroke="#fff" stroke-width="2"/>`).join('');
      d.querySelector('#compLine').innerHTML = `
        ${grid}
        <line x1="${X0}" y1="${sy(mean)}" x2="${X1}" y2="${sy(mean)}" stroke="#8b9db5" stroke-dasharray="4 4"/>
        <text x="${X0 + 4}" y="${sy(mean) - 5}" font-size="11" fill="#60708a" stroke="#fafcfe" stroke-width="3" paint-order="stroke">ȳ = ${num(mean, 1)}</text>
        <polyline points="${pts(a)}" fill="none" stroke="${C_ACT}" stroke-width="2.2"/>
        <polyline points="${pts(p)}" fill="none" stroke="${C_PRD}" stroke-width="2.2" stroke-dasharray="6 4"/>
        ${resid}
        ${dots(a, C_ACT)}${dots(p, C_PRD)}
        <line x1="${X0}" y1="${Y1}" x2="${X1}" y2="${Y1}" stroke="#8b9db5"/>
        ${xl}
        <text x="${X0 - 30}" y="${Y0 + 2}" font-size="11" fill="#60708a">價格</text>`;
    }

    function shareRow(label, terms) {
      const total = terms.reduce((x, y) => x + y, 0);
      const segs = total > 0
        ? terms.map((v, k) => {
            const s = v / total;
            return `<i style="flex:${s} 0 0;background:${C_SAMPLE[k]}" title="第 ${k + 1} 筆：${(s * 100).toFixed(1)}%">${s >= 0.13 ? `${Math.round(s * 100)}%` : ''}</i>`;
          }).join('')
        : '<i class="empty" style="flex:1">沒有誤差</i>';
      return `<div class="share-row"><span>${label}</span><div class="share-bar">${segs}</div></div>`;
    }

    function update() {
      const a = acts(), p = prds(), n = a.length;
      d.querySelectorAll('.actValue').forEach((el, k) => el.textContent = a[k]);
      d.querySelectorAll('.prdValue').forEach((el, k) => el.textContent = p[k]);
      const e = a.map((y, k) => y - p[k]);
      const sq = e.map(x => x * x), ab = e.map(Math.abs), pc = e.map((x, k) => Math.abs(x / a[k]) * 100);
      const sum = arr => arr.reduce((x, y) => x + y, 0);
      const sse = sum(sq), mse = sse / n, mae = sum(ab) / n, mape = sum(pc) / n;
      const mean = sum(a) / n, sst = sum(a.map(y => (y - mean) ** 2));
      const r2 = sst ? 1 - sse / sst : NaN;

      drawLine(a, p, e, mean);

      const tile = (name, value, color, calc) => `<div class="widget-card metric-tile"><strong>${name}</strong><div class="metric-value" style="color:${color}">${value}</div><small>${calc}</small></div>`;
      d.querySelector('#compResults').innerHTML =
        tile('MSE（均方誤差）', num(mse), '#0b9d98', `(${sq.map(trim).join(' + ')}) / ${n}`) +
        tile('MAE（平均絕對誤差）', num(mae), C_ACT, `(${ab.map(trim).join(' + ')}) / ${n}`) +
        tile('MAPE（平均絕對百分比誤差）', `${num(mape)}%`, C_PRD, `(${pc.map(v => `${num(v)}%`).join(' + ')}) / ${n}`) +
        tile('R²（決定係數）', Number.isFinite(r2) ? num(r2, 3) : '未定義', '#7c48ad', sst ? `1 − SSE/SST = 1 − ${trim(sse)} / ${trim(sst)}` : '實際值全相同，SST = 0');

      const top = Math.max(sse, sst, 1e-9);
      const bar = (label, v, color, hint) => `<div class="share-row"><span>${label}</span><div class="scale-bar"><i style="width:${(v / top * 100).toFixed(1)}%;background:${color}"></i><em>${trim(v)}　${hint}</em></div></div>`;
      d.querySelector('#compShare').innerHTML = `
        <div class="share-title">各筆資料佔指標總和的比例
          <span class="share-legend">${C_SAMPLE.map((c, k) => `<span><i style="background:${c}"></i>第 ${k + 1} 筆</span>`).join('')}</span>
        </div>
        ${shareRow('MSE', sq)}${shareRow('MAE', ab)}${shareRow('MAPE', pc)}
        <div class="share-title" style="margin-top:12px">R² 的兩個平方和</div>
        ${bar('SST', sst, '#8b9db5', '實際值與平均 ȳ 的差距')}
        ${bar('SSE', sse, C_ERR, '實際值與預測 ŷ 的差距')}
        <figcaption>${!sst ? 'SST = 0 時 R² 無法計算。' : sse <= sst ? `SSE 比 SST 小，R² = ${num(r2, 3)}：預測優於「一律猜平均值」。` : `SSE 比 SST 大，R² = ${num(r2, 3)}（負值）：預測比「一律猜平均值」還差。`}</figcaption>`;
    }

    const setAll = rows => {
      d.querySelectorAll('.act').forEach((el, k) => el.value = rows[k][0]);
      d.querySelectorAll('.prd').forEach((el, k) => el.value = rows[k][1]);
      update();
    };
    d.querySelector('#compReset').onclick = () => setAll(DEFAULTS);
    d.querySelector('#compRandom').onclick = () => setAll(DEFAULTS.map(() => {
      const y = 88 + Math.round(Math.random() * 34);
      const yhat = Math.max(MIN, Math.min(MAX, y + Math.round((Math.random() - 0.5) * 20)));
      return [y, yhat];
    }));
    d.querySelector('#compInputs').oninput = update;
    update();
  }

  // 13. Slide 27: Stock MSE Breakdown
  function stockMseLesson() {
    const d = lessonBox(`
      <div class="result-heading">Table 7：30 檔股票最低 MSE 勝出分佈</div>
      <div class="result-bars">
        <div class="result-bar"><span>LSTM-ARO</span><i style="width:100%"></i><strong>18 檔 (60%)</strong></div>
        <div class="result-bar"><span>LSTM-GA</span><i style="width:55.6%"></i><strong>10 檔 (33%)</strong></div>
        <div class="result-bar"><span>LSTM1D</span><i style="width:11.1%"></i><strong>2 檔 (7%)</strong></div>
      </div>
      <div class="formula-display" style="margin-top:16px">
        <small>關鍵標的 MSE 對比 (越低越好)</small>
        <div>• AAPL：ARO <b>22.731</b> vs GA 24.109 (ARO 勝)</div>
        <div>• MSFT：ARO <b>63.322</b> vs GA 79.253 (ARO 勝，優勢顯著)</div>
        <div>• UNH：ARO 126.133 vs GA <b>96.373</b> (GA 勝)</div>
      </div>
      <p class="lesson-note">在 60% 的標的上，ARO 成功找到了比傳統 GA 預測誤差更低的多層 LSTM 結構。</p>
    `);
  }

  // 14. Slide 29: Stock MAE Breakdown
  function stockMaeLesson() {
    const d = lessonBox(`
      <div class="result-heading">Table 8：30 檔股票最低 MAE 勝出分佈</div>
      <div class="result-bars">
        <div class="result-bar"><span>LSTM-ARO</span><i style="width:100%"></i><strong>17 檔 (56.7%)</strong></div>
        <div class="result-bar"><span>LSTM-GA</span><i style="width:64.7%"></i><strong>11 檔 (36.7%)</strong></div>
        <div class="result-bar"><span>LSTM1D</span><i style="width:11.8%"></i><strong>2 檔 (6.7%)</strong></div>
      </div>
      <div class="formula-display" style="margin-top:16px">
        <small>MAE 平均絕對誤差特性</small>
        <div>• MAE 以真實美元衡量誤差尺度，不受極端值平方放大影響。</div>
        <div>• ARO 在 17 檔股票達到最小價格偏差，展現出高度穩健性。</div>
      </div>
      <p class="lesson-note">MAE 與 MSE 的勝出比例高度吻合，證明 ARO 的優化並非僅針對特定單一誤差指標過擬合。</p>
    `);
  }

  // 15. Slide 30: Stock MAPE Breakdown
  function stockMapeLesson() {
    const d = lessonBox(`
      <div class="result-heading">Table 9：30 檔股票最低 MAPE 勝出分佈</div>
      <div class="result-bars">
        <div class="result-bar"><span>LSTM-ARO</span><i style="width:100%"></i><strong>18 檔 (60.0%)</strong></div>
        <div class="result-bar"><span>LSTM-GA</span><i style="width:50.0%"></i><strong>9 檔 (30.0%)</strong></div>
        <div class="result-bar"><span>LSTM1D</span><i style="width:16.7%"></i><strong>3 檔 (10.0%)</strong></div>
      </div>
      <div class="formula-display" style="margin-top:16px">
        <small>MAPE 相對百分比誤差特性</small>
        <div>• MAPE = (|實際 − 預測| / 實際) × 100%</div>
        <div>• 消除高價股（如 UNH > $400）與低價股之量綱差距，公平衡量跨股預測品質。</div>
      </div>
      <p class="lesson-note">投影片原始統計中若有平手並列，總檔數可能略高於 30。</p>
    `);
  }

  // 16. Slide 31: Stock R2 Breakdown
  function stockR2Lesson() {
    const d = lessonBox(`
      <div class="result-heading">Table 10：30 檔股票最高 R² 擬合度勝出分佈</div>
      <div class="result-bars">
        <div class="result-bar"><span>LSTM-ARO</span><i style="width:100%"></i><strong>17 檔 (56.7%)</strong></div>
        <div class="result-bar"><span>LSTM-GA</span><i style="width:58.8%"></i><strong>10 檔 (33.3%)</strong></div>
        <div class="result-bar"><span>LSTM1D</span><i style="width:17.6%"></i><strong>3 檔 (10.0%)</strong></div>
      </div>
      <div class="formula-display" style="margin-top:16px">
        <small>R² 決定係數實測數值 (越接近 1 越佳)</small>
        <div>• CAT：ARO <b>0.909</b> ｜ GA <b>0.914</b></div>
        <div>• CVX：ARO <b>0.911</b> ｜ GA <b>0.919</b></div>
        <div>• MSFT：ARO <b>0.892</b> ｜ GA <b>0.865</b> (ARO 大幅領先)</div>
      </div>
      <p class="lesson-note">所有模型的 R² 均在 0.82 以上，證明深度 LSTM 確實有效捕捉了股價的走勢變異。</p>
    `);
  }

  // 17. Slide 32: Exceptions Deep Dive
  function exceptionsLesson() {
    const d = lessonBox(`
      <div class="result-heading">深入分析：為何 GA 在 CAT、CVX、UNH 能勝過 ARO？</div>
      <div class="paper-table-wrap">
        <table class="paper-table">
          <thead><tr><th>股票</th><th>ARO MSE</th><th>GA MSE</th><th>勝出者</th><th>分析觀點</th></tr></thead>
          <tbody>
            <tr><td>CAT (開拓重工)</td><td>38.438</td><td>36.329</td><td><b style="color:#367af6">GA</b></td><td>強景氣循環股，局部極值點較尖銳</td></tr>
            <tr><td>CVX (雪佛龍)</td><td>23.970</td><td>21.953</td><td><b style="color:#367af6">GA</b></td><td>受油價波動外生衝擊顯著</td></tr>
            <tr><td>UNH (聯合健康)</td><td>126.133</td><td>96.373</td><td><b style="color:#367af6">GA</b></td><td>高價股且波動區間大，GA 突變找到不同盆地</td></tr>
          </tbody>
        </table>
      </div>
      <div class="formula-display" style="margin-top:16px">
        <small>「沒有免費的午餐」定理 (No Free Lunch Theorem)</small>
        <div>沒有任何單一元啟發演算法可以在所有非凸金融時間序列上保證 100% 碾壓對手。誠實交代例外案例正是學術嚴謹性的體現。</div>
      </div>
      <p class="lesson-note">報告時主動提出這三檔例外，能大幅增強簡報的可信度與專業度。</p>
    `);
  }

  // 18. Slide 33: Prediction Curves & Residual Fit
  function curvesLesson() {
    const d = lessonBox(`
      <label class="lesson-control"><span>選擇檢視擬合曲線範例：</span>
        <select id="curveStockPicker">
          <option value="AAPL">AAPL (蘋果) · ARO 表現較佳</option>
          <option value="MSFT">MSFT (微軟) · ARO 優勢顯著</option>
          <option value="UNH">UNH (聯合健康) · GA 例外勝出</option>
        </select>
      </label>
      <div id="curveDisplay" class="widget-card" style="margin-top:12px;text-align:center"></div>
      <p class="lesson-note">論文 Fig. 3 與 Fig. 4 繪製了測試集各交易日預測走勢與實際價格的重疊度。</p>
    `);
    const picker = d.querySelector('#curveStockPicker');
    function show() {
      const stock = picker.value;
      const isAroWin = stock !== 'UNH';
      d.querySelector('#curveDisplay').innerHTML = `
        <div style="font-weight:750;color:#101a30;margin-bottom:8px">${stock} 預測走勢擬合評析</div>
        <div style="font-size:13px;line-height:1.6;color:#52637c;text-align:left">
          <div>• <strong>轉折點捕捉：</strong>${isAroWin ? 'LSTM-ARO 在劇烈回檔波段能更迅速修正延遲，極值貼合度更高。' : 'LSTM-GA 在此股的大幅震盪行情中捕捉到較佳的波峰點。'}</div>
          <div>• <strong>滯後性 (Lag)：</strong>兩種模型皆存在金融預測常見的 1 日滯後現象，但 ARO 的殘差自相關性略低。</div>
          <div>• <strong>綜合評估：</strong>視覺曲線能快速確認趨勢是否同向，但定量決策仍須以數值指標 (MSE / R²) 為準。</div>
        </div>
      `;
    }
    picker.onchange = show;
    show();
  }

  // 19. Slide 34: Offline Computation Breakdown
  function offlineCostLesson() {
    const d = lessonBox(`
      <div class="formula-display cost-formula" id="offlineCostFormula"></div>
      <div id="controls"></div>
      <p class="lesson-note">75,000 次模型訓練代表巨大算力投入；但這是離線單次調參，部署到線上後推論僅需數百毫秒。</p>
    `);
    const c = d.querySelector('#controls');
    control(c, 'trainSec', '單一模型平均訓練耗時 (秒)', 5, 20, 1, 10);
    function update() {
      const s = +d.querySelector('#trainSec').value;
      d.querySelector('#trainSecValue').textContent = `${s} 秒`;
      const totalSec = 50 * 50 * 30 * s;
      const totalDays = (totalSec / 86400).toFixed(2);
      d.querySelector('#offlineCostFormula').innerHTML = `
        <small>總搜尋訓練次數與算力總成本</small>
        <div>50 隻兔子 × 50 代迭代 × 30 檔股票 = <b>75,000 次完整訓練</b></div>
        <div>預估計算時間：75,000 × ${param('trainSec', s + 's')} ≈ <b>${totalDays} 天</b>（論文實測約 8.737 天）</div>
      `;
      animateFormula(d);
    }
    c.oninput = update;
    update();
  }

  // 20. Slide 36 & 37: Limitations & Reproducibility Checklist
  function limitationsLesson() {
    const d = lessonBox(`
      <div class="result-heading">研究設計評析與學術嚴謹性檢驗</div>
      <div style="display:grid;gap:10px;font-size:13px;line-height:1.5">
        <div class="widget-card" style="border-left:4px solid #c66817">
          <strong style="color:#c66817">1. 時間序列切分方式</strong>
          <div>論文使用固定 80% 訓練／20% 測試。在金融領域，若能採用滾動視窗 (Walk-Forward Validation)，更能防止資料窺探偏差。</div>
        </div>
        <div class="widget-card" style="border-left:4px solid #315fd1">
          <strong style="color:#315fd1">2. 算力預算公平性</strong>
          <div>ARO 與 GA 均執行 50 族群 × 50 迭代，評估次數一致，基準比較公正。</div>
        </div>
        <div class="widget-card" style="border-left:4px solid #7c48ad">
          <strong style="color:#7c48ad">3. 預測誤差 vs 交易獲利</strong>
          <div>預測 MSE 降低不等於回測必定賺錢，實務上需扣除交易手續費、滑價與借券成本。</div>
        </div>
        <div class="widget-card" style="border-left:4px solid #0b9d98">
          <strong style="color:#0b9d98">4. 隨機種子敏感度</strong>
          <div>論文未報告多次隨機重跑的標準差；未來研究建議彙整 10 次以上執行的信賴區間。</div>
        </div>
      </div>
      <p class="lesson-note">客觀指出論文優缺點與未來拓展方向，能使整場學術報告更具說服力。</p>
    `);
  }

  // 21. Slide 38: Conclusion & Core Takeaways
  function conclusionLesson() {
    const d = lessonBox(`
      <div class="result-heading">論文核心發現與研究結論總覽</div>
      <div style="display:grid;gap:10px;font-size:13px">
        <div class="widget-card" style="background:#f0faf8;border-color:#b0e3dd">
          <strong style="color:#0b726e;font-size:15px">✓ 貢獻一：自動化解決深度 LSTM 調參痛點</strong>
          <div style="margin-top:4px">成功將 LSTM 層數、神經元、Dropout、Optimizer、Learning Rate 納入統一搜尋空間。</div>
        </div>
        <div class="widget-card" style="background:#f0f5fc;border-color:#b8d5fa">
          <strong style="color:#266cd9;font-size:15px">✓ 貢獻二：ARO 演算法在超參數最佳化上優於傳統 GA</strong>
          <div style="margin-top:4px">在 60% 的道瓊股票中擊敗 GA，跳脫局部最優的能力顯著。</div>
        </div>
        <div class="widget-card" style="background:#fdf6ed;border-color:#f5d4a8">
          <strong style="color:#c66817;font-size:15px">✓ 貢獻三：30 檔股票大規模實證支持</strong>
          <div style="margin-top:4px">橫跨不同產業與波動度，證明方法的廣泛適應性。</div>
        </div>
      </div>
      <p class="lesson-note">感謝聆聽！點選「來源」分頁可直接查看期刊論文 DOI 與原著資訊。</p>
    `);
  }

  // ── Slide ID 18（第 15 頁）：隨機步長 L 隨迭代的變化 ──────────────────────
  // L = (e − e^(((t−1)/T)²)) · sin(2πr₂)，原文 Eq. (8)
  const STEP_T = 50; // 論文：50 次迭代
  const stepAmp = t => Math.E - Math.exp(((t - 1) / STEP_T) ** 2);
  let stepSamples = Array.from({ length: STEP_T }, () => Math.random());

  if (typeof lessonNames === 'object') lessonNames.step_length = '隨機步長 L 隨迭代的變化';

  // 第 15 頁：點「R = L·c」或「隨機步長 L」那兩列 → 步長教材；其餘維持貪婪選擇教材
  const priorLessonKind = lessonKind;
  lessonKind = function (text, n) {
    if (n === 18 && /隨機步長|L =|sin|R = L|搜尋方向|移動尺度|r₂/.test(text)) return 'step_length';
    return priorLessonKind(text, n);
  };
  const priorHint = lessonHint;
  lessonHint = function () {
    if (lesson?.kind === 'step_length') return 'L 由兩部分相乘：前半段 (e − e^((t−1)/T)²) 是「步伐上限」，隨迭代從約 1.72 縮小到 0；後半段 sin(2πr₂) 是 −1 到 1 的隨機數，決定這一步往正或負方向、用掉上限的幾成。所以前期步伐大、廣泛探索，後期步伐小、細部調整。';
    return priorHint();
  };
  const priorFormulaFor = formulaFor;
  formulaFor = function (k) {
    if (k === 'step_length') return 'L = (e − e^((t−1)/T)²) · sin(2πr₂)；R = L · c';
    return priorFormulaFor(k);
  };
  if (typeof termRows === 'object') termRows.step_length = [
    ['t', '1,…,T', '目前迭代次數'],
    ['T', '最大迭代次數（本文 50）', '決定步伐縮小的速度'],
    ['e', '≈ 2.718', '自然常數'],
    ['e − e^((t−1)/T)²', '約 1.72 → 0', '步伐上限（振幅），隨迭代遞減'],
    ['r₂', '0 到 1 的均勻隨機數', '每次迭代重新抽樣'],
    ['sin(2πr₂)', '−1 到 1', '決定方向（正／負）與用掉上限的比例'],
    ['c', '0／1 遮罩向量', '只讓隨機選出的部分維度移動'],
    ['R = L · c', '向量', '代入 Eq. (6) 的移動係數']
  ];
  if (typeof formulaSteps === 'object') formulaSteps.step_length = [
    ['① 算步伐上限', 'e − e^((t−1)/T)²', 't 越大，指數越大，上限越小。'],
    ['② 抽隨機方向', 'sin(2πr₂)', '介於 −1 與 1。'],
    ['③ 相乘', 'L = 上限 × sin(2πr₂)', '得到這次迭代的步長。'],
    ['④ 套用維度遮罩', 'R = L · c', '只有被選中的維度會移動。']
  ];

  // 原始文字含 "e^(...)"，抽屜標題改用教材名稱
  const priorRenderLesson = renderLesson;
  renderLesson = function () {
    priorRenderLesson();
    if (lesson?.kind === 'step_length' && !lesson.page) document.querySelector('#drawerTitle').textContent = lessonNames.step_length;
  };
  const priorWidget = window.renderLessonWidget;
  renderLessonWidget = function (k) {
    if (k === 'step_length') { stepLengthLesson(); return; }
    priorWidget(k);
  };

  function stepLengthLesson() {
    const d = lessonBox(`
      <div class="lesson-stage step-stage">
        <div class="formula-display" id="stepFormula"></div>
        <figure class="lesson-chart step-chart"><svg viewBox="0 0 460 240" role="img" aria-label="步長 L 隨迭代 t 的變化"></svg>
          <figcaption>青綠色區域：步伐上限 ±(e − e^((t−1)/T)²)；藍線：目前 r₂ 下的 L(t)；灰點：一次模擬（每代重新抽 r₂）；橘點：目前選的 t</figcaption>
        </figure>
      </div>
      <div class="lesson-controls" id="controls"></div>
      <p class="lesson-note">T = 50（論文的迭代次數）。上限在 t = 1 時為 e − 1 ≈ 1.72，到 t = T 時已接近 0：前期大步探索、後期小步收斂。</p>`);
    const c = d.querySelector('#controls');
    control(c, 't', '目前迭代 t', 1, STEP_T, 1, 10);
    control(c, 'r2', '隨機數 r₂', 0, 1, 0.01, 0.2);
    const resample = document.createElement('button');
    resample.type = 'button'; resample.className = 'try-formula'; resample.textContent = '重新模擬一次（重抽每代的 r₂）';
    resample.onclick = () => { stepSamples = Array.from({ length: STEP_T }, () => Math.random()); update(); };
    c.append(resample);

    // chart geometry
    const X0 = 44, X1 = 446, Y0 = 18, Y1 = 206, YMAX = 1.9;
    const sx = t => X0 + (t - 1) / (STEP_T - 1) * (X1 - X0);
    const sy = v => Y0 + (YMAX - v) / (2 * YMAX) * (Y1 - Y0);
    const ts = Array.from({ length: STEP_T }, (_, i) => i + 1);
    const pathOf = f => ts.map((t, i) => `${i ? 'L' : 'M'}${sx(t).toFixed(1)},${sy(f(t)).toFixed(1)}`).join('');

    function update() {
      const t = +d.querySelector('#t').value, r2 = +d.querySelector('#r2').value;
      const amp = stepAmp(t), s = Math.sin(2 * Math.PI * r2), L = amp * s;
      d.querySelector('#tValue').textContent = `${t} / ${STEP_T}`;
      d.querySelector('#r2Value').textContent = r2.toFixed(2);
      d.querySelector('#stepFormula').innerHTML = `
        <small>Eq. (8) · 隨機步長</small>
        <div>L = (e − e<sup>((${paramSym('t', 't')}−1)/T)²</sup>) · sin(2π${paramSym('r2', 'r₂')})</div>
        <div>= (2.718 − e<sup>(${param('t', t - 1)}/50)²</sup>) × sin(2π × ${param('r2', r2.toFixed(2))})</div>
        <div>= ${amp.toFixed(3)} × ${s.toFixed(3)} = <b>${L.toFixed(3)}</b></div>`;
      const band = `${pathOf(stepAmp)}${ts.slice().reverse().map(tt => `L${sx(tt).toFixed(1)},${sy(-stepAmp(tt)).toFixed(1)}`).join('')}Z`;
      const ticks = [1, 10, 20, 30, 40, 50].map(tt => `<line x1="${sx(tt)}" y1="${Y1}" x2="${sx(tt)}" y2="${Y1 + 4}" stroke="#8b9db5"/><text x="${sx(tt)}" y="${Y1 + 17}" font-size="11" text-anchor="middle" fill="#60708a">${tt}</text>`).join('');
      const yt = [-1.72, -1, 0, 1, 1.72].map(v => `<text x="${X0 - 6}" y="${sy(v) + 4}" font-size="11" text-anchor="end" fill="#60708a">${v}</text><line x1="${X0}" y1="${sy(v)}" x2="${X1}" y2="${sy(v)}" stroke="${v === 0 ? '#8b9db5' : '#e8edf4'}"/>`).join('');
      const dots = ts.map((tt, i) => `<circle cx="${sx(tt)}" cy="${sy(stepAmp(tt) * Math.sin(2 * Math.PI * stepSamples[i]))}" r="2.6" fill="#94a3b8"/>`).join('');
      d.querySelector('svg').innerHTML = `
        ${yt}
        <path d="${band}" fill="#0b9d98" fill-opacity=".12" stroke="none"/>
        <path d="${pathOf(stepAmp)}" fill="none" stroke="#0b9d98" stroke-width="1.5" stroke-dasharray="4 3"/>
        <path d="${pathOf(tt => -stepAmp(tt))}" fill="none" stroke="#0b9d98" stroke-width="1.5" stroke-dasharray="4 3"/>
        ${dots}
        <path d="${pathOf(tt => stepAmp(tt) * s)}" fill="none" stroke="#315fd1" stroke-width="2.2"/>
        <line x1="${sx(t)}" y1="${Y0}" x2="${sx(t)}" y2="${Y1}" stroke="#f39a42" stroke-dasharray="3 3"/>
        <circle cx="${sx(t)}" cy="${sy(L)}" r="6" fill="#f39a42" stroke="#fff" stroke-width="2"/>
        <line x1="${X0}" y1="${Y1}" x2="${X1}" y2="${Y1}" stroke="#8b9db5"/>
        ${ticks}
        <text x="${(X0 + X1) / 2}" y="${Y1 + 32}" font-size="11" text-anchor="middle" fill="#60708a">迭代 t</text>
`;
      animateFormula(d);
    }
    c.oninput = update;
    update();
  }

  // ── Slide ID 4（第 4 頁）：相關研究的名詞解釋 ──────────────────────────────
  const relatedTerms = [
    ['classic', 'ARIMA', '傳統統計時間序列模型，用過去的價格與過去的預測誤差做線性組合來預測。'],
    ['deep', 'CNN-LSTM', '先用卷積層（CNN）抓短期的局部型態，再交給 LSTM 處理時間先後關係。'],
    ['hybrid', '超參數', '訓練前要先決定的設定，例如層數、神經元數、學習率；不是訓練學到的權重。'],
    ['hybrid', 'GA（遺傳演算法）', '模仿生物演化，用選擇、交配、突變一代代改良一群候選解。']
  ];
  const termGroupOf = text => /傳統|ARIMA/.test(text) ? 'classic' : /深度時間|CNN|LSTM/.test(text) ? 'deep' : /混合|GA|演化|切入點|ARO/.test(text) ? 'hybrid' : null;
  if (typeof lessonNames === 'object') lessonNames.related_terms = '相關研究名詞解釋';

  const priorLessonKind2 = lessonKind;
  lessonKind = function (text, n) {
    if (n === 4) return 'related_terms';
    return priorLessonKind2(text, n);
  };
  const priorRenderLesson2 = renderLesson;
  renderLesson = function () {
    if (lesson?.kind !== 'related_terms') { priorRenderLesson2(); return; }
    if (tab === 'widget') tab = 'explain';
    priorRenderLesson2();
    document.querySelector('[data-tab="widget"]').hidden = true;
    if (tab !== 'explain') return;
    const group = lesson.page ? null : termGroupOf(lesson.text || '');
    const hint = lessonHint();
    const list = (rows, title) => `<section class="term-glossary"><h3>${title}</h3><dl>${rows.map(([, term, def]) => `<div><dt>${term}</dt><dd>${def}</dd></div>`).join('')}</dl></section>`;
    const picked = group ? relatedTerms.filter(r => r[0] === group) : relatedTerms;
    body.innerHTML = `${hint ? `<p>${hint}</p>` : ''}${list(picked, '名詞解釋')}`;
  };

  // 抽屜標題：卡片全文（多行）或通用的「重點」不適合當標題，改用投影片標題
  const priorRenderLesson3 = renderLesson;
  renderLesson = function () {
    priorRenderLesson3();
    const titleEl = document.querySelector('#drawerTitle');
    if (/\n/.test(titleEl.textContent) || titleEl.textContent === '重點') titleEl.textContent = slideTitle(slides[index]);
  };

})();
