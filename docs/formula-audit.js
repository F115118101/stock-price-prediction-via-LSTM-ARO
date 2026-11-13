// Mathematical notation and teaching notes for formulas shown in the supplied paper.
const originalLessonKind=lessonKind;
lessonKind=function(text,n){if((n===17||n===18)&&/擾動|n₁|ε/.test(text)&&!/vᵢ/.test(text))return'perturbation';return originalLessonKind(text,n)};
lessonNames.perturbation='Random Perturbation（隨機擾動）';
const originalFormulaFor=formulaFor;
formulaFor=function(k){
  if(k==='detour')return'vᵢ(t+1) = xⱼ(t) + R·(xᵢ(t)−xⱼ(t)) + q·n₁';
  if(k==='perturbation')return'n₁ ∼ N(0,1)；完整擾動項 = round(0.5(0.05+r₁))·n₁';
  if(k==='hiding')return'bᵢ,ⱼ(t) = xᵢ(t) + H·gⱼ·xᵢ(t)；H = ((T−t+1)/T)·r₄';
  if(k==='metrics'){const m=lesson?.metric||'MSE';return{MSE:'MSE = (1/n) Σₖ₌₁ⁿ(yₖ−ŷₖ)²',MAE:'MAE = (1/n) Σₖ₌₁ⁿ|yₖ−ŷₖ|',MAPE:'MAPE = (100/n) Σₖ₌₁ⁿ|(yₖ−ŷₖ)/yₖ|','R²':'R² = 1 − Σₖ₌₁ⁿ(yₖ−ŷₖ)² / Σₖ₌₁ⁿ(yₖ−ȳ)²'}[m]}
  if(k==='ann_rnn_lstm')return'教學示意：RNN 梯度比例 ≈ Wᵀ；LSTM 記憶傳遞比例 ≈ fₜ';
  if(k==='rabbit_population')return'A(t) = 4·(1−t/T)·ln(1/r)；A>1 探索，否則躲藏';
  if(k==='cost')return'教學估算：搜尋時間 ≈ 8.737 天 × 搜尋量倍率 m';
  if(k==='builder')return'單層 LSTM 參數量 = 4·[(d_in+d_out)·d_out+d_out]';
  if(k==='lr_encoding')return'教學示意：k₈ = min(4, ⌊5x₈⌋)；論文未交代實際離散化規則';
  const stockMetric={stock_mse:'MSE',stock:'MSE',stock_mae:'MAE',stock_mape:'MAPE',stock_r2:'R²'}[k];
  if(stockMetric)return{MSE:'MSE = Σₖ₌₁ⁿ(yₖ−ŷₖ)²/n',MAE:'MAE = Σₖ₌₁ⁿ|yₖ−ŷₖ|/n',MAPE:'MAPE = 100Σₖ₌₁ⁿ|(yₖ−ŷₖ)/yₖ|/n','R²':'R² = 1−SSE/SST'}[stockMetric];
  return originalFormulaFor(k)
};
const originalLessonHint=lessonHint;
lessonHint=function(){if(lesson?.kind==='perturbation')return'Eq. (6) 的擾動是明確的數學項，不是任意加上一個 ε。q 由 r₁ 決定是否啟用；n₁ 是標準常態抽樣值。';return originalLessonHint()};
const termRows={
  lstm:[['t','1,…,20（本研究輸入視窗）','目前時間步'],['Cₜ、Cₜ₋₁','長度為隱藏單元數的向量','更新後與更新前的內部記憶'],['fₜ、iₜ、oₜ','每格介於 0 到 1','分別控制保留、寫入、輸出比例'],['C̃ₜ','每格介於 −1 到 1','由 tanh 產生的候選記憶'],['hₜ','長度為隱藏單元數的向量','傳給下一時間步的目前輸出'],['×（或 ⊙）','逐格相乘','兩個向量對應位置各自相乘'],['tanh','把數值壓到 −1 到 1','限制候選記憶或輸出的數值範圍']],
  detour:[['i','1,…,N','目前要更新的兔子索引'],['j','1,…,N；j ≠ i','隨機選出的另一隻兔子索引'],['xᵢ(t)、xⱼ(t)','D 維位置向量','兩組超參數候選解'],['vᵢ(t+1)','D 維候選位置向量','根據另一隻兔子、位移與擾動算出的新位置'],['R = L·c','D 維映射','L 控制移動尺度；c 選出更新維度'],['r₁','0 到 1 的均勻隨機數','控制擾動項是否啟用'],['q = round(0.5(0.05+r₁))','0 或 1','決定是否將 n₁ 加入候選位置'],['n₁ ∼ N(0,1)','標準常態抽樣','為候選位置加入隨機變化'],['t、T','1 ≤ t ≤ T','目前迭代與最大迭代次數']],
  perturbation:[['r₁','0 到 1 的均勻隨機數','代入 round 前的係數'],['round(·)','四捨五入至整數','此式輸出 0 或 1'],['q = round(0.5(0.05+r₁))','0 或 1','約在 r₁ ≥ 0.95 時啟用擾動'],['n₁','n₁ ∼ N(0,1)','從標準常態分布抽取的隨機數'],['N(0,1)','平均數 0、變異數 1','標準常態分布'],['q·n₁','候選位置的附加項','q 為 0 時不改變位置；q 為 1 時加入 n₁']],
  hiding:[['i','1,…,N','目前兔子的索引'],['j','1,…,D','洞穴所在的維度；與 Eq. (6) 的兔子索引 j 不同'],['bᵢ,ⱼ(t)','D 維位置向量','兔子 i 在維度 j 所挖的候選洞穴'],['xᵢ(t)','D 維位置向量','目前兔子的位置'],['gⱼ','第 j 維為 1，其餘為 0 的 D 維向量','只讓對應維度產生位移'],['H','隨 t 改變的尺度','洞穴位置的移動幅度'],['r₄','0 到 1 的隨機數','依簡報所引公式調整 H'],['t、T','1 ≤ t ≤ T','目前迭代與最大迭代次數']],
  energy:[['t、T','1 ≤ t ≤ T','目前迭代與最大迭代次數'],['r','0 < r < 1','避免 ln(1/r) 的分母為 0'],['ln','自然對數','計算隨機項 ln(1/r)'],['4','固定係數','按簡報公式縮放探索條件'],['A(t)','非負值','A > 1 時覓食探索；A ≤ 1 時躲藏開發']],
  metrics:[['k','1,…,n','第 k 筆測試資料'],['n','正整數','納入評估的資料筆數'],['yₖ、ŷₖ','實際值、預測值','兩者相減得到逐筆誤差'],['eₖ','yₖ−ŷₖ','第 k 筆的預測誤差'],['ȳ','實際值的平均數','R² 的基準預測'],['yₖ ≠ 0','MAPE 的條件','分母為 0 時百分比誤差無法計算'],['Σ','加總符號','把每筆資料的計算結果加起來'],['SSE、SST','平方和','SSE = Σ(yₖ−ŷₖ)²；SST = Σ(yₖ−ȳ)²']],
  unroll:[['xₜ','第 t 天的輸入向量','本研究用前 20 天資料依序輸入'],['t','1,…,20','目前處理到第幾天'],['LSTMCell','同一個更新函式','每一天接收輸入與上一天的狀態'],['Cₜ、Cₜ₋₁','長度為隱藏單元數的向量','更新後與前一天的內部記憶'],['hₜ、hₜ₋₁','長度為隱藏單元數的向量','目前與前一天的輸出狀態'],['W','同一組可訓練權重','20 個時間步重複使用，不是每一天各訓練一組'],['ŷ₂₁','一個預測值','根據最後輸出預測第 21 天']],
  time_depth:[['t','時間步索引','沿同一層由前一天傳向下一天'],['l','LSTM 層索引','由下層傳向上層'],['hₜ⟨ˡ⟩','第 l 層在第 t 天的輸出向量','同時供下一時間步及上一層使用'],['hₜ₋₁⟨ˡ⟩','同一層前一時間步的輸出','橫向的時間資訊'],['hₜ⟨ˡ⁻¹⟩','同一天前一層的輸出','縱向的層間輸入']],
  arch_compare:[['Params','可訓練參數數量','估算單一 LSTM 層的參數量'],['d_in','正整數','每個時間步輸入的特徵數'],['d_out','正整數','該層的隱藏單元數；輸出向量長度'],['4','四組門控計算','遺忘、輸入、候選記憶及輸出']],
  greedy_selection:[['i','候選解索引','目前比較的兔子'],['t、t+1','相鄰迭代','更新前與更新後'],['xᵢ','目前位置向量','目前保留的模型設定'],['vᵢ','新候選位置向量','ARO 更新後提出的設定'],['f(·)','適應值函式','以預測誤差評分；此處越小越好']],
  burrow_map:[['i','兔子索引','產生洞穴的候選解'],['j、d','1 ≤ j ≤ d','選定的維度與搜尋空間總維度'],['bᵢ,ⱼ','D 維候選位置向量','第 j 維的洞穴候選'],['xᵢ','D 維位置向量','目前候選解的位置'],['H','搜尋尺度','控制洞穴位移幅度'],['gⱼ','第 j 維為 1，其餘為 0','只移動被選中的維度']],
  offline_cost:[['50 兔子','候選設定數','每一代要評估的候選數'],['50 代','迭代次數','搜尋重複更新的次數'],['30 股','股票標的數','以此估算全部標的的訓練工作量'],['75,000 次','50 × 50 × 30','教學上的乘積估算；不等於論文直接報告的實測訓練次數']]
};
termRows.metrics_compare=termRows.metrics;
for(const kind of ['stock_mse','stock','stock_mae','stock_mape','stock_r2'])termRows[kind]=termRows.metrics;
termRows.rabbit_population=termRows.energy;
termRows.ann_rnn_lstm=[['W','0 到 1（教學示例）','每一步假設的梯度保留比例'],['T','正整數','連續傳遞的時間步數'],['Wᵀ','0 到 1','重複相乘 T 次後的示意比例'],['Cₜ、Cₜ₋₁','記憶向量','目前與前一步的 cell state'],['fₜ','每格介於 0 到 1','控制舊記憶保留比例'],['∂Cₜ/∂Cₜ₋₁','導數','表示新記憶對舊記憶的敏感程度']];
termRows.cost=[['8.737 天','論文記錄的搜尋時間','此頁教學估算的基準'],['m','正數','相對於基準的搜尋量倍率'],['搜尋時間','天','假設耗時隨搜尋量等比例改變；實際耗時受硬體與平行化影響']];
termRows.builder=termRows.arch_compare;
termRows.lr_encoding=[['x₈','0 到 1（教學示例）','Learning Rate 的連續位置值'],['⌊·⌋','向下取整','把連續值轉成選項索引'],['k₈','0、1、2、3、4','五個 Learning Rate 候選值的索引'],['min(4,·)','上限截斷','確保索引不超過 4']];
const formulaSteps={
  ann_rnn_lstm:[['① 單步保留','W','假設每一步都保留相同比例。'],['② 重複 T 步','Wᵀ','連乘後可能快速縮小；只是梯度消失的教學示意。'],['③ LSTM 記憶路徑','∂Cₜ/∂Cₜ₋₁ ≈ fₜ','忘記門可讓記憶保留較多；實際梯度仍由訓練決定。']],
  lstm:[['① 保留','fₜ × Cₜ₋₁','忘記門決定舊記憶各格保留多少。'],['② 寫入','iₜ × C̃ₜ','輸入門決定候選記憶各格寫入多少。'],['③ 更新記憶','Cₜ = 保留 + 寫入','逐格相加，得到新的 cell state。'],['④ 產生輸出','hₜ = oₜ × tanh(Cₜ)','輸出門選出要傳給下一步的內容。']],
  unroll:[['① 第 1 天','(C₁,h₁) = LSTMCell(x₁,C₀,h₀;W)','讀入第 1 天，產生新的記憶與輸出。'],['② 第 2 天','(C₂,h₂) = LSTMCell(x₂,C₁,h₁;W)','接收第 1 天的狀態；仍使用相同的 W。'],['③ 重複到第 20 天','(C₂₀,h₂₀) = LSTMCell(x₂₀,C₁₉,h₁₉;W)','每一天更新一次向量狀態。'],['④ 預測','ŷ₂₁ = 輸出層(h₂₀)','用最後的輸出預測第 21 天。']],
  time_depth:[['① 橫向','hₜ₋₁⟨ˡ⟩ → hₜ⟨ˡ⟩','同一層接收前一天的狀態。'],['② 縱向','hₜ⟨ˡ⁻¹⟩ → hₜ⟨ˡ⟩','同一天接收下一層的輸出。']],
  detour:[['① 參考位置','xⱼ(t)','先選另一隻兔子的目前位置。'],['② 位移','R·(xᵢ(t)−xⱼ(t))','用移動係數調整兩者之間的距離。'],['③ 隨機擾動','q·n₁','q 由 r₁ 算出，決定是否加入隨機變化。'],['④ 候選位置','vᵢ(t+1) = ① + ② + ③','得到新候選，再進行適應值比較。']],
  perturbation:[['① 抽隨機數','r₁ ∈ (0,1)','提供擾動開關的輸入。'],['② 算開關','q = round(0.5(0.05+r₁))','q 為 0 或 1。'],['③ 算擾動','q·n₁，n₁ ∼ N(0,1)','q=0 時不加入；q=1 時加入抽到的 n₁。']],
  hiding:[['① 算尺度','H = ((T−t+1)/T)·r₄','迭代進行時，移動幅度逐漸縮小。'],['② 選維度','gⱼ','只對第 j 維產生位移。'],['③ 候選洞穴','bᵢ,ⱼ(t) = xᵢ(t)+H·gⱼ·xᵢ(t)','把位移加到目前位置。']],
  burrow_map:[['① 選維度','j ∈ {1,…,d}','決定在哪個維度挖洞。'],['② 產生位移','H·gⱼ·xᵢ','只在選定維度調整目前位置。'],['③ 候選位置','bᵢ,ⱼ = xᵢ + 位移','得到一個洞穴候選解。']],
  energy:[['① 算進度','1 − t/T','越接近最後一代，這項越小。'],['② 算隨機項','ln(1/r)','r 改變時，即使同一代也可能有不同結果。'],['③ 決定模式','A(t) = 4×①×②','A>1 探索；A≤1 躲藏。']],
  greedy_selection:[['① 算候選','vᵢ(t+1)','ARO 提出一組新設定。'],['② 比較誤差','f(vᵢ) < f(xᵢ)','新設定的誤差較低才接受。'],['③ 更新位置','xᵢ(t+1) = vᵢ 或 xᵢ(t)','否則保留原設定。']],
  arch_compare:[['① 輸入與狀態','d_in + d_out','每組門同時讀取輸入與前一狀態。'],['② 單組參數','(d_in+d_out)×d_out + d_out','權重矩陣加上偏差向量。'],['③ 四組門','Params = 4×②','乘上遺忘、輸入、候選與輸出四組。']],
  offline_cost:[['① 每代候選','50 兔子','每一代評估 50 組設定。'],['② 乘上代數','50×50 = 2,500','估算一檔股票的候選評估數。'],['③ 乘上標的','2,500×30 = 75,000','這是教學估算，實際訓練工作量取決於實作。']],
  lr_encoding:[['① 讀取位置','x₈','ARO 更新後的連續位置值。'],['② 換成索引','k₈ = min(4,⌊5x₈⌋)','示範一種索引編碼方法；不是論文指定做法。'],['③ 選學習率','第 k₈ 個候選值','從 Table 6 的五個合法值中選取。']]
};
formulaSteps.rabbit_population=formulaSteps.energy;
formulaSteps.builder=formulaSteps.arch_compare;
formulaSteps.cost=[['① 讀基準','8.737 天','論文記錄的搜尋耗時。'],['② 調整搜尋量','8.737 × m','按倍率做教學上的線性估算。'],['③ 解讀','實際耗時可能不同','硬體、平行化與每次訓練時間都會影響結果。']];
function metricSteps(metric){const rows={MSE:[['① 逐筆誤差','eₖ = yₖ−ŷₖ','實際值減預測值。'],['② 平方後平均','MSE = Σeₖ²/n','較大的錯誤會被平方放大。']],MAE:[['① 逐筆誤差','eₖ = yₖ−ŷₖ','實際值減預測值。'],['② 絕對值後平均','MAE = Σ|eₖ|/n','正負誤差不會互相抵消。']],MAPE:[['① 相對誤差','|eₖ/yₖ|','除以實際值；yₖ 不能為 0。'],['② 轉成百分比','MAPE = 100Σ|eₖ/yₖ|/n','平均後乘以 100%。']], 'R²':[['① 殘差平方和','SSE = Σ(yₖ−ŷₖ)²','模型預測留下的誤差。'],['② 基準平方和','SST = Σ(yₖ−ȳ)²','與全部預測成平均值的基準比較。'],['③ 算比例','R² = 1−SSE/SST','通常越接近 1 越好；SST 為 0 時無法計算。']]};return rows[metric]||rows.MSE}
function appendTeachingTable(title,headings,rows,className){if(!rows?.length)return;const wrap=document.createElement('section');wrap.className=className;const h=document.createElement('h3');h.textContent=title;wrap.append(h);const scroll=document.createElement('div');scroll.className='formula-table-scroll';const table=document.createElement('table');const thead=document.createElement('thead');const tr=document.createElement('tr');headings.forEach(value=>{const th=document.createElement('th');th.textContent=value;tr.append(th)});thead.append(tr);table.append(thead);const tbody=document.createElement('tbody');rows.forEach(row=>{const tr=document.createElement('tr');row.forEach(value=>{const td=document.createElement('td');td.textContent=value;tr.append(td)});tbody.append(tr)});table.append(tbody);scroll.append(table);wrap.append(scroll);body.insertBefore(wrap,body.querySelector('.try-formula'))}
function appendFormulaTable(k){const stockMetric={stock_mse:'MSE',stock:'MSE',stock_mae:'MAE',stock_mape:'MAPE',stock_r2:'R²'}[k];const steps=k==='metrics'||stockMetric?metricSteps(stockMetric||lesson?.metric):k==='metrics_compare'?[['MSE','Σ(yₖ−ŷₖ)²/n','平方後平均；大誤差影響較大。'],['MAE','Σ|yₖ−ŷₖ|/n','取絕對值後平均。'],['MAPE','100Σ|(yₖ−ŷₖ)/yₖ|/n','換成相對百分比；yₖ 不能為 0。'],['R²','1−SSE/SST','與平均值基準比較；SST 不能為 0。']]:formulaSteps[k];appendTeachingTable('每個符號的意思',['符號','範圍／定義','在公式中的作用'],termRows[k],'formula-terms');appendTeachingTable('公式怎麼算',['步驟','算式','意思'],steps,'formula-steps')}
const originalRenderLesson=renderLesson;
renderLesson=function(){originalRenderLesson();if(tab==='explain'){appendFormulaTable(lesson?.kind||widgetType(slides[index]?.number||(index+1)))}};
const originalRenderLessonWidget=renderLessonWidget;
renderLessonWidget=function(k){if(k==='perturbation'){perturbationLesson();return}originalRenderLessonWidget(k)};
function openPerturbationLesson(){lesson={text:'Random Perturbation（隨機擾動）',kind:'perturbation',page:false};openDrawer('explain')}
function enhanceSlideFormula(){
  const shapes=[...slideEl.querySelectorAll('.slide-item.text')];
  const replace=(needle,value)=>{const el=shapes.find(x=>x.textContent.includes(needle));const span=el?.querySelector('span');if(span)span.textContent=value;return el};
  const replaceMath=(needle,html)=>{const el=shapes.find(x=>x.textContent.includes(needle));const span=el?.querySelector('span');if(span)span.innerHTML=html;return el};
  const note=(text,left,top,width,kind)=>{const el=document.createElement('button');el.type='button';el.className='formula-domain-note';el.textContent=text;Object.assign(el.style,{left:`${left}px`,top:`${top}px`,width:`${width}px`});el.onclick=()=>{lesson={text,kind,page:false};openDrawer('explain')};slideEl.append(el)};
  const v='<span class="math-vector">v</span>',x='<span class="math-vector">x</span>';
  const slideNum=slides[index]?.number||(index+1);
  if(slideNum===17){
    const equation=replaceMath('vᵢ(t+1) = xⱼ(t)',`${v}<sub>i</sub>(t+1) = ${x}<sub>j</sub>(t) + R·(${x}<sub>i</sub>(t)−${x}<sub>j</sub>(t)) + q·n₁ <span class="equation-domain">, i,j ∈ {1,…,N}, j ≠ i, 1 ≤ t ≤ T</span>`);
    equation?.classList.add('full-eq6');
    const annotation=document.createElement('button');annotation.type='button';annotation.className='perturbation-annotation';annotation.textContent='Random Perturbation（隨機擾動）  n₁ ∼ N(0,1)';annotation.onclick=openPerturbationLesson;slideEl.append(annotation);
  }
  if(slideNum===19){
    replaceMath('bᵢ,ⱼ(t) = xᵢ(t) + H · g · xᵢ(t)','bᵢ,ⱼ(t) = xᵢ(t) + H·gⱼ·xᵢ(t) <span class="equation-domain">, i ∈ {1,…,N}, j ∈ {1,…,D}</span>');
    replaceMath('H = ((T − t + 1) / T) · r₄','H = ((T − t + 1) / T)·r₄ <span class="equation-domain">, 1 ≤ t ≤ T, r₄ ∈ (0,1)</span>');
  }
  if(slideNum===20){
    replaceMath('bᵢ,ⱼ(t) = xᵢ(t) + H · g · xᵢ(t)','bᵢ,ⱼ(t) = xᵢ(t) + H·gⱼ·xᵢ(t) <span class="equation-domain">, i ∈ {1,…,N}, j ∈ {1,…,D}</span>');
    replaceMath('H = ((T − t + 1) / T) · r₄','H = ((T − t + 1) / T)·r₄ <span class="equation-domain">, 1 ≤ t ≤ T, r₄ ∈ (0,1)</span>');
  }
  if(slideNum===21)replaceMath('A(t) = 4 · (1 − t / T) · ln(1 / r)','A(t) = 4 · (1 − t / T) · ln(1 / r) <span class="equation-domain">, r ∈ (0,1), 1 ≤ t ≤ T</span>');
  if(slideNum===26){replace('Σ(y − ŷ)² / n','Σₖ₌₁ⁿ(yₖ − ŷₖ)² / n');replace('Σ|y − ŷ| / n','Σₖ₌₁ⁿ|yₖ − ŷₖ| / n');replace('100 Σ|(y − ŷ)/y| / n','100 Σₖ₌₁ⁿ|(yₖ − ŷₖ)/yₖ| / n');note('k = 1,…,n；SSE = Σₖ₌₁ⁿ(yₖ−ŷₖ)²；SST = Σₖ₌₁ⁿ(yₖ−ȳ)²；MAPE 須 yₖ ≠ 0',84,648,1113,'metrics')}
}
const originalDetourLesson=detourLesson;
detourLesson=function(){
  const d=lessonBox('<div class="formula-display"></div><div id="controls"></div><p class="lesson-note">一維示例；原論文 Eq. (6) 中 q = round(0.5(0.05+r₁))、n₁ ∼ N(0,1)。</p>');
  const c=d.querySelector('#controls');[['xi','目前位置 xᵢ',-10,10,.5,2],['xj','另一隻兔子 xⱼ',-10,10,.5,6],['R','位移係數 R',-2,2,.1,.5],['r1','均勻隨機數 r₁',0,1,.01,.4],['n1','常態抽樣值 n₁',-3,3,.1,1.2]].forEach(a=>control(c,...a));c.insertAdjacentHTML('beforeend','<input id="eps" type="hidden" value="0">');
  function update(){const v={};for(const id of ['xi','xj','R','r1','n1']){v[id]=+d.querySelector('#'+id).value;d.querySelector('#'+id+'Value').textContent=v[id].toFixed(id==='r1'?2:1)}const q=Math.round(.5*(.05+v.r1)),epsilon=q*v.n1,result=v.xj+v.R*(v.xi-v.xj)+epsilon;d.querySelector('#eps').value=epsilon;d.querySelector('.formula-display').innerHTML=`<small>Eq. (6) · 繞路覓食</small><div>vᵢ(t+1) = ${paramSym('xj','xⱼ(t)')} + ${paramSym('R','R')}·(${paramSym('xi','xᵢ(t)')} − ${paramSym('xj','xⱼ(t)')}) + ${paramSym('r1','q')}·${paramSym('n1','n₁')}</div><div>= ${param('xj',v.xj.toFixed(1))} + ${param('R',v.R.toFixed(1))}(${param('xi',v.xi.toFixed(1))} − ${param('xj',v.xj.toFixed(1))}) + ${param('r1',q)}×${param('n1',v.n1.toFixed(1))}</div><div>= <b>${result.toFixed(2)}</b></div>`;animateFormula(d)}c.oninput=update;update();
};
function perturbationLesson(){
  const d=lessonBox('<div class="lesson-stage"><div class="formula-display"></div><figure class="lesson-chart"><svg viewBox="0 0 460 130"></svg><figcaption>r₁ 接近 1 時，round(·) 才會從 0 變成 1</figcaption></figure></div><div class="lesson-controls" id="controls"></div><p class="lesson-note">n₁ 為示例抽樣值；按按鈕可從 N(0,1) 再抽一次。</p>');d.classList.add('has-chart');const c=d.querySelector('#controls');[['r1','均勻隨機數 r₁',0,1,.01,.4],['n1','標準常態抽樣值 n₁',-3,3,.1,1.2]].forEach(a=>control(c,...a));const sample=document.createElement('button');sample.type='button';sample.className='try-formula';sample.textContent='重新抽樣 n₁';c.append(sample);sample.onclick=()=>{const u=Math.max(1e-12,Math.random()),v=Math.random(),n=Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);d.querySelector('#n1').value=Math.max(-3,Math.min(3,n)).toFixed(1);update()};
  function update(){const r=+d.querySelector('#r1').value,n=+d.querySelector('#n1').value,q=Math.round(.5*(.05+r)),eps=q*n;d.querySelector('#r1Value').textContent=r.toFixed(2);d.querySelector('#n1Value').textContent=n.toFixed(1);d.querySelector('.formula-display').innerHTML=`<small>Random Perturbation · Eq. (6)</small><div>${paramSym('n1','n₁')} ∼ N(0,1)</div><div>q = round(0.5(0.05 + ${paramSym('r1','r₁')})) = round(0.5(0.05 + ${param('r1',r.toFixed(2))})) = ${param('r1',q)}</div><div>${paramSym('r1','q')}·${paramSym('n1','n₁')} = ${param('r1',q)} × ${param('n1',n.toFixed(1))} = <b>${eps.toFixed(2)}</b></div>`;const x=30+r*400,cut=30+.95*400;d.querySelector('svg').innerHTML=`<line x1="30" y1="75" x2="430" y2="75" stroke="#8b9db5" stroke-width="2"/><rect x="${cut}" y="48" width="${430-cut}" height="54" fill="#dcf5ed"/><line x1="${cut}" y1="40" x2="${cut}" y2="103" stroke="#0b9d98" stroke-dasharray="5 4"/><circle cx="${x}" cy="75" r="7" fill="#f39a42"/><text x="30" y="120" fill="#60708a" font-size="12">r₁ = 0</text><text x="${cut-20}" y="30" fill="#0b726e" font-size="12">0.95</text><text x="390" y="120" fill="#60708a" font-size="12">r₁ = 1</text>`;animateFormula(d)}c.oninput=update;update();
}
