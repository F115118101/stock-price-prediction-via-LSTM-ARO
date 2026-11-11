// Teaching example for decoding continuous ARO positions into Table 6 learning rates.
const priorLearningRateKind=lessonKind;
lessonKind=function(text,n){
  if(n>=22&&n<=25&&/Learning rate|學習率/i.test(text))return'lr_encoding';
  return priorLearningRateKind(text,n);
};
lessonNames.lr_encoding='Learning Rate：連續位置與五個選項';
const priorLearningRateHint=lessonHint;
lessonHint=function(){
  if(lesson?.kind==='lr_encoding')return'論文 Table 6 將 Learning Rate 設為五個候選值；ARO 的位置更新則使用連續數值。';
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
    <h3>連續位置與離散 Learning Rate 的對應</h3>
    <p>評估候選解時，需要把 ARO 更新後的連續位置轉換為合法的 Learning Rate 選項。</p>
    <div class="lr-options-inline">0.01 · 0.001 · 0.0001 · 0.00001 · 0.000001</div>
    <p>索引編碼與對數空間映射是兩種示例。在「動態演算」中，可以比較連續位置改變時，各自會對應到哪個選項。</p>
    <p class="lr-evidence"><strong>論文交代的範圍：</strong>Table 6 列出五個 Learning Rate；<strong>未交代的細節：</strong>連續位置如何轉換為這五個選項。因此無法確認作者實際採用哪種編碼或離散化方式。</p>`;
  body.insertBefore(section,body.querySelector('.try-formula'));
};
function learningRateWidget(){
  const d=lessonBox('<div class="lesson-stage"><div class="formula-display"></div><div class="lr-option-grid"></div></div><div class="lesson-controls" id="controls"></div><p class="lesson-note">兩種映射都是教學示例；原論文未明確說明實際採用的轉換方法。</p>');
  d.classList.add('has-chart');
  const controls=d.querySelector('#controls');
  controls.insertAdjacentHTML('beforeend','<label class="lesson-control">映射示例<select id="lrMode"><option value="index">索引編碼</option><option value="log">對數空間</option></select></label>');
  control(controls,'lrPosition','ARO 連續位置 u',0,1,.01,.36);
  const rates=['0.01','0.001','0.0001','0.00001','0.000001'];
  function update(){
    const u=+d.querySelector('#lrPosition').value,mode=d.querySelector('#lrMode').value;
    const k=mode==='index'?Math.min(4,Math.floor(5*u)):Math.round(4*u);
    d.querySelector('#lrPositionValue').textContent=u.toFixed(2);
    const step=mode==='index'
      ?`k = min(4, ⌊5 × ${param('lrPosition',u.toFixed(2))}⌋) = ${k}`
      :`log₁₀(η*) = −2 − 4 × ${param('lrPosition',u.toFixed(2))} = ${(-2-4*u).toFixed(2)}`;
    const second=mode==='index'?`ηₖ = 10<sup>−(2+${k})</sup> = <b>${rates[k]}</b>`:`最近的合法指數：−${2+k} → <b>${rates[k]}</b>`;
    d.querySelector('.formula-display').innerHTML=`<small>${mode==='index'?'索引編碼':'對數空間映射'} · 教學示例</small><div>${step}</div><div>${second}</div>`;
    d.querySelector('.lr-option-grid').innerHTML=rates.map((rate,i)=>`<div class="lr-option${i===k?' active':''}"><span>選項 ${i+1}</span><strong>${rate}</strong></div>`).join('');
    animateFormula(d);
  }
  controls.oninput=update;
  controls.onchange=update;
  update();
}
