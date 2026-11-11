// Table 5–6 discrete hyperparameters and clearly labeled decoding examples.
const priorLearningRateKind=lessonKind;
lessonKind=function(text,n){
  if(n>=22&&n<=25&&/Learning rate|學習率|Optimizer|最佳化器/i.test(text))return'lr_encoding';
  return priorLearningRateKind(text,n);
};
lessonNames.lr_encoding='Optimizer 與 Learning Rate 的離散選項';
const priorLearningRateHint=lessonHint;
lessonHint=function(){
  if(lesson?.kind==='lr_encoding')return'原論文 Table 5 將 Optimizer 與 Learning Rate 列為搜尋變數 x₇、x₈；Table 6 為兩者各列出五個候選值。';
  return priorLearningRateHint();
};
const priorLearningRateWidget=renderLessonWidget;
renderLessonWidget=function(kind){
  if(kind==='lr_encoding'){learningRateWidget();return}
  priorLearningRateWidget(kind);
};
const priorLearningRateRender=renderLesson;
renderLesson=function(){
  priorLearningRateRender();
  if(lesson?.kind!=='lr_encoding'||tab!=='explain')return;
  const section=document.createElement('section');
  section.className='lr-explanation';
  section.innerHTML=`
    <h3>論文列出的候選值</h3>
    <div class="lr-candidate-table"><div><strong>x₇ · Optimizer</strong><span>Adagrad、Adam、Adamax、RMSprop、SGD</span></div><div><strong>x₈ · Learning Rate</strong><span>0.01、0.001、0.0001、0.00001、0.000001</span></div></div>
    <h3>連續位置如何對應離散選項</h3>
    <p>ARO 的位置更新式以連續數值計算。要用更新後的 x₇、x₈ 建立 LSTM，就需要把這兩個位置分量轉成 Table 6 中的合法選項。這是根據公式與搜尋空間做的實作推論。</p>
    <p>索引編碼可用於兩種變數；Learning Rate 也可示範在對數空間映射。在「動態演算」中可以比較結果。</p>
    <p class="lr-evidence"><strong>論文未交代：</strong>連續位置實際如何編碼與離散化。因此下方的映射規則僅供教學，不能視為作者的實作。</p>`;
  body.insertBefore(section,body.querySelector('.try-formula'));
};
function learningRateWidget(){
  const d=lessonBox('<div class="lesson-stage"><div class="formula-display" id="optimizerFormula"></div><div class="formula-display lr-second-formula" id="learningRateFormula"></div><div class="discrete-choice-columns"><section><h4>Optimizer 候選值</h4><div class="lr-option-grid" id="optimizerOptions"></div></section><section class="rate-choices"><h4>Learning Rate 候選值</h4><div class="lr-option-grid" id="learningRateOptions"></div></section></div></div><div class="lesson-controls" id="controls"></div><p class="lesson-note">x₇、x₈ 的映射是教學示例；原論文只列出候選值，沒有提供解碼規則。</p>');
  d.classList.add('has-chart','discrete-widget');
  const controls=d.querySelector('#controls');
  control(controls,'optimizerPosition','Optimizer 位置 x₇',0,1,.01,.36);
  control(controls,'lrPosition','Learning Rate 位置 x₈',0,1,.01,.36);
  controls.insertAdjacentHTML('beforeend','<label class="lesson-control">Learning Rate 映射示例<select id="lrMode"><option value="index">索引編碼</option><option value="log">對數空間</option></select></label>');
  const optimizers=['Adagrad','Adam','Adamax','RMSprop','SGD'];
  const rates=['0.01','0.001','0.0001','0.00001','0.000001'];
  function update(){
    const u7=+d.querySelector('#optimizerPosition').value,u8=+d.querySelector('#lrPosition').value,mode=d.querySelector('#lrMode').value;
    const k7=Math.min(4,Math.floor(5*u7)),k8=mode==='index'?Math.min(4,Math.floor(5*u8)):Math.round(4*u8);
    d.querySelector('#optimizerPositionValue').textContent=u7.toFixed(2);
    d.querySelector('#lrPositionValue').textContent=u8.toFixed(2);
    d.querySelector('#optimizerFormula').innerHTML=`<small>x₇ · Optimizer · 索引編碼示例</small><div>k₇ = min(4, ⌊5 × ${param('optimizerPosition',u7.toFixed(2))}⌋) = ${k7}</div><div>第 ${k7+1} 個選項：${param('optimizerPosition',optimizers[k7])}</div>`;
    const step=mode==='index'
      ?`k₈ = min(4, ⌊5 × ${param('lrPosition',u8.toFixed(2))}⌋) = ${k8}`
      :`log₁₀(η*) = −2 − 4 × ${param('lrPosition',u8.toFixed(2))} = ${(-2-4*u8).toFixed(2)}`;
    const mapped=mode==='index'?`第 ${k8+1} 個選項：${param('lrPosition',rates[k8])}`:`最近的合法指數 −${2+k8}：${param('lrPosition',rates[k8])}`;
    d.querySelector('#learningRateFormula').innerHTML=`<small>x₈ · Learning Rate · ${mode==='index'?'索引編碼':'對數空間'}示例</small><div>${step}</div><div>${mapped}</div>`;
    d.querySelector('#optimizerOptions').innerHTML=optimizers.map((name,i)=>`<div class="lr-option${i===k7?' active':''}"><span>${i+1}</span><strong>${name}</strong></div>`).join('');
    d.querySelector('#learningRateOptions').innerHTML=rates.map((rate,i)=>`<div class="lr-option${i===k8?' active':''}"><span>${i+1}</span><strong>${rate}</strong></div>`).join('');
    animateFormula(d);
  }
  controls.oninput=update;
  controls.onchange=update;
  update();
}
