// Mathematical notation and teaching notes for formulas shown in the supplied paper.
const originalLessonKind=lessonKind;
lessonKind=function(text,n){if((n===17||n===18)&&/擾動|n₁|ε/.test(text)&&!/vᵢ/.test(text))return'perturbation';return originalLessonKind(text,n)};
lessonNames.perturbation='Random Perturbation（隨機擾動）';
const originalFormulaFor=formulaFor;
formulaFor=function(k){
  if(k==='detour')return'vᵢ(t+1) = xⱼ(t) + R·(xᵢ(t)−xⱼ(t)) + round(0.5(0.05+r₁))·n₁';
  if(k==='perturbation')return'n₁ ∼ N(0,1)；完整擾動項 = round(0.5(0.05+r₁))·n₁';
  if(k==='hiding')return'bᵢ,ⱼ(t) = xᵢ(t) + H·gⱼ·xᵢ(t)；H = ((T−t+1)/T)·r₄';
  if(k==='metrics'){const m=lesson?.metric||'MSE';return{MSE:'MSE = (1/n) Σₖ₌₁ⁿ(yₖ−ŷₖ)²',MAE:'MAE = (1/n) Σₖ₌₁ⁿ|yₖ−ŷₖ|',MAPE:'MAPE = (100/n) Σₖ₌₁ⁿ|(yₖ−ŷₖ)/yₖ|','R²':'R² = 1 − Σₖ₌₁ⁿ(yₖ−ŷₖ)² / Σₖ₌₁ⁿ(yₖ−ȳ)²'}[m]}
  return originalFormulaFor(k)
};
const originalLessonHint=lessonHint;
lessonHint=function(){if(lesson?.kind==='perturbation')return'Eq. (6) 的擾動是明確的數學項，不是任意加上一個 ε。q 由 r₁ 決定是否啟用；n₁ 是標準常態抽樣值。';return originalLessonHint()};
const termRows={
  lstm:[['t','1,…,20（本研究輸入視窗）','目前時間步'],['Cₜ、Cₜ₋₁','實數或向量','更新後與更新前的長期記憶'],['fₜ、iₜ、oₜ','0 到 1','分別控制保留、寫入、輸出比例'],['C̃ₜ','−1 到 1','由 tanh 產生的候選記憶'],['hₜ','實數或向量','傳給下一時間步的目前輸出']],
  detour:[['i','1,…,N','目前要更新的兔子索引'],['j','1,…,N；j ≠ i','隨機選出的另一隻兔子索引'],['xᵢ(t)、xⱼ(t)','D 維位置向量','兩組超參數候選解'],['vᵢ(t+1)','D 維候選位置向量','根據另一隻兔子、位移與擾動算出的新位置'],['R = L·c','D 維映射','L 控制移動尺度；c 選出更新維度'],['r₁','0 到 1 的均勻隨機數','控制擾動項是否啟用'],['round(0.5(0.05+r₁))','0 或 1','決定是否將 n₁ 加入候選位置'],['n₁ ∼ N(0,1)','標準常態抽樣','為候選位置加入隨機變化'],['t、T','1 ≤ t ≤ T','目前迭代與最大迭代次數']],
  perturbation:[['r₁','0 到 1 的均勻隨機數','代入 round 前的係數'],['round(·)','四捨五入至整數','此式輸出 0 或 1'],['q = round(0.5(0.05+r₁))','0 或 1','約在 r₁ ≥ 0.95 時啟用擾動'],['n₁','n₁ ∼ N(0,1)','從標準常態分布抽取的隨機數'],['N(0,1)','平均數 0、變異數 1','標準常態分布'],['q·n₁','候選位置的附加項','q 為 0 時不改變位置；q 為 1 時加入 n₁']],
  hiding:[['i','1,…,N','目前兔子的索引'],['j','1,…,D','洞穴所在的維度；與 Eq. (6) 的兔子索引 j 不同'],['bᵢ,ⱼ(t)','D 維位置向量','兔子 i 在維度 j 所挖的候選洞穴'],['gⱼ','第 j 維為 1，其餘為 0 的 D 維向量','只讓對應維度產生位移'],['H','隨 t 改變的尺度','洞穴位置的移動幅度'],['r₄','0 到 1 的隨機數','依簡報所引公式調整 H'],['t、T','1 ≤ t ≤ T','目前迭代與最大迭代次數']],
  energy:[['t、T','1 ≤ t ≤ T','目前迭代與最大迭代次數'],['r','0 < r < 1','避免 ln(1/r) 的分母為 0'],['A(t)','非負值','A > 1 時覓食探索；A ≤ 1 時躲藏開發']],
  metrics:[['k','1,…,n','第 k 筆測試資料'],['n','正整數','納入評估的資料筆數'],['yₖ、ŷₖ','實際值、預測值','兩者相減得到逐筆誤差'],['ȳ','實際值的平均數','R² 的基準預測'],['yₖ ≠ 0','MAPE 的條件','分母為 0 時百分比誤差無法計算'],['SSE、SST','平方和','SSE = Σ(yₖ−ŷₖ)²；SST = Σ(yₖ−ȳ)²']]
};
function appendFormulaTable(k){const rows=termRows[k];if(!rows)return;const wrap=document.createElement('section');wrap.className='formula-terms';wrap.innerHTML='<h3>符號與範圍</h3><div class="formula-terms-scroll"><table><thead><tr><th>符號</th><th>範圍／定義</th><th>在公式中的作用</th></tr></thead><tbody></tbody></table></div>';const tbody=wrap.querySelector('tbody');rows.forEach(([symbol,range,meaning])=>{const tr=document.createElement('tr');[symbol,range,meaning].forEach(value=>{const td=document.createElement('td');td.textContent=value;tr.append(td)});tbody.append(tr)});body.insertBefore(wrap,body.querySelector('.try-formula'))}
const originalRenderLesson=renderLesson;
renderLesson=function(){originalRenderLesson();if(tab==='explain'){appendFormulaTable(lesson?.kind||widgetType(index+1))}};
const originalRenderLessonWidget=renderLessonWidget;
renderLessonWidget=function(k){if(k==='perturbation'){perturbationLesson();return}originalRenderLessonWidget(k)};
function openPerturbationLesson(){lesson={text:'Random Perturbation（隨機擾動）',kind:'perturbation',page:false};openDrawer('explain')}
function enhanceSlideFormula(){
  const shapes=[...slideEl.querySelectorAll('.slide-item.text')];
  const replace=(needle,value)=>{const el=shapes.find(x=>x.textContent.includes(needle));const span=el?.querySelector('span');if(span)span.textContent=value;return el};
  const replaceMath=(needle,html)=>{const el=shapes.find(x=>x.textContent.includes(needle));const span=el?.querySelector('span');if(span)span.innerHTML=html;return el};
  const note=(text,left,top,width,kind)=>{const el=document.createElement('button');el.type='button';el.className='formula-domain-note';el.textContent=text;Object.assign(el.style,{left:`${left}px`,top:`${top}px`,width:`${width}px`});el.onclick=()=>{lesson={text,kind,page:false};openDrawer('explain')};slideEl.append(el)};
  const v='<span class="math-vector">v</span>',x='<span class="math-vector">x</span>';
  if(index===16){
    const equation=replaceMath('vᵢ(t+1) = xⱼ(t)',`${v}<sub>i</sub>(t+1) = ${x}<sub>j</sub>(t) + R·(${x}<sub>i</sub>(t)−${x}<sub>j</sub>(t)) + round(0.5(0.05+r₁))·n₁ <span class="equation-domain">, i,j ∈ {1,…,N}, j ≠ i, 1 ≤ t ≤ T</span>`);
    equation?.classList.add('full-eq6');
    const annotation=document.createElement('button');annotation.type='button';annotation.className='perturbation-annotation';annotation.textContent='Random Perturbation（隨機擾動）  n₁ ∼ N(0,1)';annotation.onclick=openPerturbationLesson;slideEl.append(annotation);
  }
  if(index===17){replaceMath('vᵢ = xⱼ + R·',`${v}<sub>i</sub>(t+1) = ${x}<sub>j</sub>(t) + R·(${x}<sub>i</sub>(t)−${x}<sub>j</sub>(t)) + q·n₁ <span class="equation-domain">, i,j ∈ {1,…,N}, j ≠ i, 1 ≤ t ≤ T</span>`);replace('參考其他兔子的候選位置','q = round(0.5(0.05+r₁))，n₁ ∼ N(0,1)')}
  if(index===18){
    replaceMath('bᵢ,ⱼ(t) = xᵢ(t) + H · g · xᵢ(t)','bᵢ,ⱼ(t) = xᵢ(t) + H·gⱼ·xᵢ(t) <span class="equation-domain">, i ∈ {1,…,N}, j ∈ {1,…,D}</span>');
    replaceMath('H = ((T − t + 1) / T) · r₄','H = ((T − t + 1) / T)·r₄ <span class="equation-domain">, 1 ≤ t ≤ T, r₄ ∈ (0,1)</span>');
  }
  if(index===19){
    replaceMath('bᵢ,ⱼ(t) = xᵢ(t) + H · g · xᵢ(t)','bᵢ,ⱼ(t) = xᵢ(t) + H·gⱼ·xᵢ(t) <span class="equation-domain">, i ∈ {1,…,N}, j ∈ {1,…,D}</span>');
    replaceMath('H = ((T − t + 1) / T) · r₄','H = ((T − t + 1) / T)·r₄ <span class="equation-domain">, 1 ≤ t ≤ T, r₄ ∈ (0,1)</span>');
  }
  if(index===20)replaceMath('A(t) = 4 · (1 − t / T) · ln(1 / r)','A(t) = 4 · (1 − t / T) · ln(1 / r) <span class="equation-domain">, r ∈ (0,1), 1 ≤ t ≤ T</span>');
  if(index===25){replace('Σ(y − ŷ)² / n','Σₖ₌₁ⁿ(yₖ − ŷₖ)² / n');replace('Σ|y − ŷ| / n','Σₖ₌₁ⁿ|yₖ − ŷₖ| / n');replace('100 Σ|(y − ŷ)/y| / n','100 Σₖ₌₁ⁿ|(yₖ − ŷₖ)/yₖ| / n');note('k = 1,…,n；SSE = Σₖ₌₁ⁿ(yₖ−ŷₖ)²；SST = Σₖ₌₁ⁿ(yₖ−ȳ)²；MAPE 須 yₖ ≠ 0',108,609,1053,'metrics')}
}
const originalDetourLesson=detourLesson;
detourLesson=function(){
  const d=lessonBox('<div class="formula-display"></div><div id="controls"></div><p class="lesson-note">一維示例；原論文 Eq. (6) 中 q = round(0.5(0.05+r₁))、n₁ ∼ N(0,1)。</p>');
  const c=d.querySelector('#controls');[['xi','目前位置 xᵢ',-10,10,.5,2],['xj','另一隻兔子 xⱼ',-10,10,.5,6],['R','位移係數 R',-2,2,.1,.5],['r1','均勻隨機數 r₁',0,1,.01,.4],['n1','常態抽樣值 n₁',-3,3,.1,1.2]].forEach(a=>control(c,...a));c.insertAdjacentHTML('beforeend','<input id="eps" type="hidden" value="0">');
  function update(){const v={};for(const id of ['xi','xj','R','r1','n1']){v[id]=+d.querySelector('#'+id).value;d.querySelector('#'+id+'Value').textContent=v[id].toFixed(id==='r1'?2:1)}const q=Math.round(.5*(.05+v.r1)),epsilon=q*v.n1,result=v.xj+v.R*(v.xi-v.xj)+epsilon;d.querySelector('#eps').value=epsilon;d.querySelector('.formula-display').innerHTML=`<small>Eq. (6) · 繞路覓食</small><div>vᵢ(t+1) = xⱼ(t) + R·(xᵢ−xⱼ) + q·n₁</div><div>= ${param('xj',v.xj.toFixed(1))} + ${param('R',v.R.toFixed(1))}(${param('xi',v.xi.toFixed(1))}−${param('xj',v.xj.toFixed(1))}) + ${param('r1',q)}×${param('n1',v.n1.toFixed(1))}</div><div>= <b>${result.toFixed(2)}</b></div>`;animateFormula(d)}c.oninput=update;update();
};
function perturbationLesson(){
  const d=lessonBox('<div class="lesson-stage"><div class="formula-display"></div><figure class="lesson-chart"><svg viewBox="0 0 460 130"></svg><figcaption>r₁ 接近 1 時，round(·) 才會從 0 變成 1</figcaption></figure></div><div class="lesson-controls" id="controls"></div><p class="lesson-note">n₁ 為示例抽樣值；按按鈕可從 N(0,1) 再抽一次。</p>');d.classList.add('has-chart');const c=d.querySelector('#controls');[['r1','均勻隨機數 r₁',0,1,.01,.4],['n1','標準常態抽樣值 n₁',-3,3,.1,1.2]].forEach(a=>control(c,...a));const sample=document.createElement('button');sample.type='button';sample.className='try-formula';sample.textContent='重新抽樣 n₁';c.append(sample);sample.onclick=()=>{const u=Math.max(1e-12,Math.random()),v=Math.random(),n=Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);d.querySelector('#n1').value=Math.max(-3,Math.min(3,n)).toFixed(1);update()};
  function update(){const r=+d.querySelector('#r1').value,n=+d.querySelector('#n1').value,q=Math.round(.5*(.05+r)),eps=q*n;d.querySelector('#r1Value').textContent=r.toFixed(2);d.querySelector('#n1Value').textContent=n.toFixed(1);d.querySelector('.formula-display').innerHTML=`<small>Random Perturbation · Eq. (6)</small><div>n₁ ∼ N(0,1)</div><div>q = round(0.5(0.05+${param('r1',r.toFixed(2))})) = ${param('r1',q)}</div><div>q·n₁ = ${param('r1',q)} × ${param('n1',n.toFixed(1))} = <b>${eps.toFixed(2)}</b></div>`;const x=30+r*400,cut=30+.95*400;d.querySelector('svg').innerHTML=`<line x1="30" y1="75" x2="430" y2="75" stroke="#8b9db5" stroke-width="2"/><rect x="${cut}" y="48" width="${430-cut}" height="54" fill="#dcf5ed"/><line x1="${cut}" y1="40" x2="${cut}" y2="103" stroke="#0b9d98" stroke-dasharray="5 4"/><circle cx="${x}" cy="75" r="7" fill="#f39a42"/><text x="30" y="120" fill="#60708a" font-size="12">r₁ = 0</text><text x="${cut-20}" y="30" fill="#0b726e" font-size="12">0.95</text><text x="390" y="120" fill="#60708a" font-size="12">r₁ = 1</text>`;animateFormula(d)}c.oninput=update;update();
}
