const W=12192000,H=6858000;
let slides=[],index=0,tab='explain',selectedText='';
const $=s=>document.querySelector(s);
const slideEl=$('#slide'),drawer=$('#drawer'),body=$('#drawerBody');
const titles={9:'LSTM Cell：一個時間步內，資訊如何流動？',10:'Gate 的內部：每個門如何計算',11:'帶入數字：一次 LSTM 更新怎麼算'};
const category=i=>i<=4?'研究動機':i<=6?'資料與任務':i<=14?'LSTM 核心概念':i<=15?'比較方法':i<=21?'ARO 核心概念':i<=25?'方法整合':i<=35?'評估與結果':i<=38?'討論與結論':'參考文獻';
const widgetType=i=>i===5||i===12?'window':i>=7&&i<=11?'lstm':i>=16&&i<=21?'aro':i>=22&&i<=25?'builder':i>=26&&i<=33?'metrics':i===34||i===35?'cost':'overview';
const explanations={
  window:'滑動視窗把連續價格整理成監督式學習樣本：前 20 個交易日是輸入，第 21 日是目標。視窗往後移動一天，就能得到下一筆樣本。資料切分應保持時間順序。',
  lstm:'LSTM 同時傳遞 hidden state（目前輸出）與 cell state（長期記憶）。Forget gate 決定保留多少舊記憶，input gate 決定寫入多少新資訊，output gate 決定輸出多少。各 gate 的權重由訓練資料學得。',
  aro:'ARO 把一組超參數視為一隻兔子的位置。繞路覓食參考其他候選解，偏向探索；隨機躲藏在自己的鄰近區域搜尋，偏向開發。候選解經訓練與評估後，只有誤差改善才更新位置。',
  builder:'論文讓 ARO 搜尋 LSTM 層是否存在、各層神經元數、Dense 神經元數、Dropout、optimizer 與 learning rate。這些是模型設計與訓練設定；LSTM 的權重仍由訓練演算法學得。',
  metrics:'MSE 與 MAE 都用價格差衡量誤差；MSE 對較大的錯誤更敏感。MAPE 是相對誤差，真值接近零時需小心。R² 比較模型與以平均值為預測的基準。',
  cost:'表中的最佳化搜尋耗時是離線調參成本；取得最佳參數後，單次預測只需要執行最終模型。比較模型時，應分開看搜尋時間和推論時間。',
  overview:'這頁沿用原投影片的內容與順序。點選投影片文字可在此對照原句；使用左右方向鍵繼續閱讀。'
};
const ref=i=>i<=3?'摘要、§1 與 Fig. 2':i===4?'§2':i===5?'§4.1':i===6?'Tables 1–6':i<=14?'§3.2–3.3、Tables 2–4':i===15?'§3.4':i<=21?'§3.5、Eqs. (6)–(20)':i<=25?'Tables 5–6、Fig. 2':i<=26?'Eqs. (21)–(24)':i<=33?'Tables 7–10、Figs. 3–4':i<=35?'§4.3、Table 11':i<=38?'§4、Conclusion':'論文書目資料';
function textOf(item){return item.paragraphs.map(p=>p.runs.map(r=>r.text).join('')).join('\n').trim()}
function slideTitle(s){if(titles[s.number])return titles[s.number];if(s.number===1)return '以人工兔群最佳化演算法優化深度 LSTM 的股價預測';const candidates=s.items.filter(it=>it.paragraphs.length&&it.box[1]>400000&&it.box[1]<1400000).map(it=>({text:textOf(it),size:Math.max(...it.paragraphs.flatMap(p=>p.runs.map(r=>r.size)))})).filter(x=>x.size>=24&&x.text.length>4);return candidates[0]?.text||s.items.map(textOf).find(t=>t.length>6)||`第 ${s.number} 頁`}
function setIndex(n){const next=Math.max(0,Math.min(slides.length-1,n));if(next===index&&slideEl.childElementCount)return;index=next;selectedText='';if(drawer.classList.contains('open'))closeDrawer();const num=slides[index]?.number||(index+1);location.hash=`slide-${num}`;render()}
function shapeStyle(it){const [x,y,w,h]=it.box;let s=`left:${x/W*1280}px;top:${y/H*720}px;width:${w/W*1280}px;height:${h/H*720}px;`;
  if(it.fill)s+=`background:${it.fill};`;
  if(it.line&&it.lineWidth)s+=`border:${Math.max(.8,it.lineWidth/9525)}px solid ${it.line};`;
  if(it.geom==='roundRect')s+='border-radius:12px;';
  if(it.geom==='ellipse')s+='border-radius:50%;';
  if(it.rotation)s+=`transform:rotate(${it.rotation/60000}deg);`;
  return s;
}
function renderConnector(it,ordinal){
  const [x,y,w,h]=it.box,color=it.line||'#60708a';
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.classList.add('slide-connector');svg.setAttribute('viewBox','0 0 1280 720');svg.setAttribute('aria-hidden','true');
  const id=`arrow-${index}-${ordinal}`,defs=document.createElementNS(svg.namespaceURI,'defs'),marker=document.createElementNS(svg.namespaceURI,'marker');
  marker.setAttribute('id',id);marker.setAttribute('viewBox','0 0 10 10');marker.setAttribute('markerWidth','7');marker.setAttribute('markerHeight','7');marker.setAttribute('refX','8');marker.setAttribute('refY','5');marker.setAttribute('orient','auto-start-reverse');
  const tip=document.createElementNS(svg.namespaceURI,'path');tip.setAttribute('d','M 0 0 L 10 5 L 0 10 z');tip.setAttribute('fill',color);marker.append(tip);defs.append(marker);svg.append(defs);
  const line=document.createElementNS(svg.namespaceURI,'line');
  let x1=x/W*1280,y1=y/H*720,x2=(x+w)/W*1280,y2=(y+h)/H*720;
  if(it.flipH==='1')[x1,x2]=[x2,x1];if(it.flipV==='1')[y1,y2]=[y2,y1];
  line.setAttribute('x1',x1);line.setAttribute('y1',y1);line.setAttribute('x2',x2);line.setAttribute('y2',y2);
  line.setAttribute('stroke',color);line.setAttribute('stroke-width',Math.max(1,it.lineWidth/9525));line.setAttribute('stroke-linecap','round');
  if([it.headEnd,it.tailEnd].some(end=>end&&end!=='none'))line.setAttribute('marker-end',`url(#${id})`);
  svg.append(line);return svg;
}
function renderItem(it,ordinal){if(it.geom==='line'||it.type==='cxnSp')return renderConnector(it,ordinal);const el=document.createElement('div');el.className='slide-item';el.style.cssText=shapeStyle(it);
  const sNum=slides[index]?.number||(index+1);
  if(it.image){const img=document.createElement('img');img.src=it.image;img.alt=`原始投影片圖像，第 ${sNum} 頁`;el.append(img);el.classList.add('interactive');el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',`開啟第 ${sNum} 頁圖解教材`);el.addEventListener('click',()=>openLessonFor(it));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openLessonFor(it)}});return el}
  if(it.paragraphs.length){el.classList.add('text');if(it.anchor==='ctr')el.classList.add('center');if(it.anchor==='b')el.classList.add('bottom');it.paragraphs.forEach(p=>{let line=document.createElement('div');line.className='para';line.style.textAlign=p.align==='ctr'?'center':'left';if(p.align==='r')line.style.textAlign='right';p.runs.forEach(r=>{const span=document.createElement('span');span.textContent=r.text;span.style.fontSize=`${r.size*4/3}px`;span.style.fontWeight=r.bold?'700':'400';if(r.color)span.style.color=r.color;line.append(span)});el.append(line)});const txt=textOf(it);if(txt&&txt.length>2){el.classList.add('interactive');el.tabIndex=0;el.addEventListener('click',()=>openLessonFor(it));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openLessonFor(it)}})}}
  if(slides[index]?.number===12&&textOf(it).startsWith('註：')){el.classList.add('slide-footnote');el.style.top='654px';el.style.height='27px'}
  return el;
}
function fitSlideText(){slideEl.querySelectorAll('.slide-item.text').forEach(el=>{const spans=[...el.querySelectorAll('span')].filter(span=>Number.isFinite(parseFloat(span.style.fontSize)));let factor=1;while((el.scrollHeight>el.clientHeight+1||el.scrollWidth>el.clientWidth+1)&&factor>.7){factor*=.94;spans.forEach(span=>{if(!span.dataset.baseSize)span.dataset.baseSize=span.style.fontSize;span.style.fontSize=`${parseFloat(span.dataset.baseSize)*factor}px`})}})}
const imageHeaderSlides=new Set([9,10,11]);
const customHeaderSlides=new Set([12,13,14,25]);
function sharedSection(n){
  if(n===1)return '論文簡報';
  if(n<=4)return '01｜研究動機';
  if(n<=6)return '02｜資料與任務';
  if(n<=15)return '03｜LSTM 與比較方法';
  if(n<=21)return '04｜ARO 公式';
  if(n<=25)return '05｜方法整合';
  if(n<=35)return '06｜評估與結果';
  if(n<=38)return '07｜討論與結論';
  return '附錄';
}
function isLegacyChrome(s,it,j){
  if(s.number===1)return false;
  if(imageHeaderSlides.has(s.number))return j===0;
  if(customHeaderSlides.has(s.number))return j===0||j===3;
  const [x,y,w,h]=it.box;
  if(y===0&&w>10000000&&h<180000)return true;
  return j===1;
}
function addSharedChrome(s){
  if(s.number===1)return;
  const rule=document.createElement('div');
  const phase=s.number<=14?'phase-one':s.number<=25?'phase-two':'phase-three';
  rule.className=`slide-top-rule ${phase}`;
  slideEl.append(rule);
  const label=document.createElement('p');label.className=`slide-section-label ${phase}`;label.textContent=sharedSection(s.number);slideEl.append(label);
}
function render(){
  const s=slides[index];if(!s)return;
  slideEl.replaceChildren();slideEl.dataset.number=String(s.number);slideEl.style.background=s.background;
  slideEl.setAttribute('aria-label',`第 ${s.number} 頁，共 ${slides.length} 頁：${slideTitle(s)}`);
  addSharedChrome(s);
  s.items.forEach((it,j)=>{
    const text=textOf(it);
    if(/^\d{2}$/.test(text)&&it.box[0]>10000000&&it.box[1]>6300000)return;
    if(isLegacyChrome(s,it,j))return;
    if(s.number===22&&j>=6)return;
    const el=renderItem(it,j);
    if(customHeaderSlides.has(s.number)&&j===1){
      el.style.top='71px';el.style.left='60px';el.style.width='1160px';
      const first=el.querySelector('span');if(first)first.textContent=first.textContent.replace(/^\d{2}｜/,'');
    }
    if(customHeaderSlides.has(s.number)&&j===2){el.style.top='117px';el.style.left='60px';el.style.width='1160px';}
    slideEl.append(el);
  });
  if(s.number===22){
    renderNativeSlide(22,slideEl);
    slideEl.querySelectorAll('.native-search-grid .native-card').forEach(card=>{
      card.classList.add('interactive');card.tabIndex=0;
      const activate=()=>openLessonFor({paragraphs:[{runs:[{text:card.innerText,size:17}]}],box:[0,2000000,0,0],image:''});
      card.addEventListener('click',activate);
      card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate()}});
    });
  }
  const page=document.createElement('div');page.className='slide-page-number';page.textContent=String(s.number).padStart(2,'0');slideEl.append(page);
  if(typeof enhanceSlideFormula==='function')enhanceSlideFormula();
  $('#pageLabel').textContent = `${index + 1} / ${slides.length}`;
  const fraction = slides.length > 1 ? index / (slides.length - 1) : 0;
  $('#progressBar').style.width = `${fraction * 100}%`;
  $('#progressThumb').style.left = `${fraction * 100}%`;
  $('#progressTrack').setAttribute('aria-valuenow', String(index + 1));
  $('#progressTrack').setAttribute('aria-valuetext', `第 ${index + 1} 頁，共 ${slides.length} 頁`);
  $('#prevBtn').disabled=index===0;$('#nextBtn').disabled=index===slides.length-1;
  fitSlideText();scale();
}
function scale(){const f=$('#slideFrame');slideEl.style.transform=`scale(${f.clientWidth/1280})`}
function openDrawer(t='explain'){tab=t;drawer.classList.add('open');drawer.setAttribute('aria-hidden','false');$('#overlay').hidden=false;renderDrawer();$('#closeDrawer').focus()}
function closeDrawer(){drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');$('#overlay').hidden=true;$('#slideFrame').focus()}
function renderDrawer(){renderLesson()}
function renderWidget(type){if(type==='window')windowWidget();else if(type==='lstm')lstmWidget();else if(type==='aro')aroWidget();else if(type==='builder')builderWidget();else if(type==='metrics')metricWidget();else if(type==='cost')costWidget();else{body.innerHTML='<p>選擇投影片中的文字，查看該段的原文與解說。可用左右方向鍵探索整份簡報。</p>'}}
function widget(html){const d=document.createElement('div');d.className='widget';d.innerHTML=html;body.append(d);return d}
function windowWidget(){const d=widget('<strong>移動 20 日視窗</strong><p>拖動起點，觀察輸入與下一日目標如何變化。</p><label for="day">視窗起點：<span id="dayVal" class="value"></span></label><input id="day" type="range" min="1" max="11" value="1"><div id="windowDays"></div>');const input=d.querySelector('#day');function update(){let v=+input.value;d.querySelector('#dayVal').textContent=`第 ${v} 日`;d.querySelector('#windowDays').innerHTML=`<p>輸入：<strong>第 ${v}–${v+19} 日</strong></p><p>預測目標：<strong>第 ${v+20} 日</strong></p><div>${Array.from({length:21},(_,j)=>`<span class="chip" style="background:${j===20?'#ffe7ce':'#e5edf7'}">${v+j}</span>`).join('')}</div>`}input.oninput=update;update()}
function lstmWidget(){const d=widget('<strong>一步 LSTM 記憶更新</strong><p>用簡化的單一數值示意門控效果；真實模型是向量運算。</p><label>舊記憶 Cₜ₋₁：<span id="oldVal" class="value"></span></label><input id="old" type="range" min="-1" max="1" step="0.1" value="0.8"><label>Forget gate fₜ：<span id="forgetVal" class="value"></span></label><input id="forget" type="range" min="0" max="1" step="0.05" value="0.7"><label>Input gate iₜ：<span id="inputVal" class="value"></span></label><input id="input" type="range" min="0" max="1" step="0.05" value="0.5"><label>候選記憶 C̃ₜ：<span id="candidateVal" class="value"></span></label><input id="candidate" type="range" min="-1" max="1" step="0.1" value="0.6"><label>Output gate oₜ：<span id="outputVal" class="value"></span></label><input id="output" type="range" min="0" max="1" step="0.05" value="0.8"><div class="quote" id="lstmResult"></div>');function update(){let v={};for(const id of ['old','forget','input','candidate','output']){v[id]=+d.querySelector('#'+id).value;d.querySelector('#'+id+'Val').textContent=v[id].toFixed(2)}let c=v.forget*v.old+v.input*v.candidate,h=v.output*Math.tanh(c);d.querySelector('#lstmResult').innerHTML=`Cₜ = ${v.forget.toFixed(2)} × ${v.old.toFixed(2)} + ${v.input.toFixed(2)} × ${v.candidate.toFixed(2)} = <strong>${c.toFixed(3)}</strong><br>hₜ = ${v.output.toFixed(2)} × tanh(Cₜ) = <strong>${h.toFixed(3)}</strong>`}d.querySelectorAll('input').forEach(i=>i.oninput=update);update()}
function aroWidget(){const d=widget('<strong>ARO：探索或躲藏？</strong><p>依投影片公式 A(t) = 4(1 − t/T)ln(1/r)，調整迭代進度與隨機數。</p><label>迭代進度 t/T：<span id="tVal" class="value"></span></label><input id="t" type="range" min="0" max="1" step="0.01" value="0.25"><label>隨機數 r：<span id="rVal" class="value"></span></label><input id="r" type="range" min="0.01" max="0.99" step="0.01" value="0.45"><div class="quote" id="aroResult"></div>');function update(){let t=+d.querySelector('#t').value,r=+d.querySelector('#r').value,a=4*(1-t)*Math.log(1/r);d.querySelector('#tVal').textContent=Math.round(t*100)+'%';d.querySelector('#rVal').textContent=r.toFixed(2);d.querySelector('#aroResult').innerHTML=`A(t) = <strong>${a.toFixed(3)}</strong><br>${a>1?'A > 1 → 繞路覓食（探索）':'A ≤ 1 → 隨機躲藏（開發）'}`}d.querySelectorAll('input').forEach(i=>i.oninput=update);update()}
function builderWidget(){
  const d=widget('<strong>組合一隻「兔子」</strong><p>設定論文 Table 6 的候選值；這是教學範例，不會在瀏覽器中訓練模型。</p><label>第一層神經元</label><input id="n1" type="range" min="1" max="20" value="12"><label><input id="on2" type="checkbox" checked> 啟用第二層 LSTM</label><input id="n2" type="range" min="1" max="20" value="8"><label><input id="on3" type="checkbox"> 啟用第三層 LSTM</label><input id="n3" type="range" min="1" max="20" value="8"><label>Dense 神經元</label><input id="dense" type="range" min="1" max="20" value="10"><label>Dropout</label><input id="drop" type="range" min="0.3" max="0.7" step="0.1" value="0.4"><label>Optimizer</label><select id="opt"><option>Adagrad</option><option selected>Adam</option><option>Adamax</option><option>RMSprop</option><option>SGD</option></select><label>Learning rate</label><select id="lr"><option>0.01</option><option selected>0.001</option><option>0.0001</option><option>0.00001</option><option>0.000001</option></select><div class="quote" id="builderResult"></div>');
  function update(){const n=id=>+d.querySelector('#'+id).value,second=d.querySelector('#on2').checked,third=d.querySelector('#on3').checked;d.querySelector('#builderResult').innerHTML=`Input(20) → LSTM(${n('n1')})${second?` → LSTM(${n('n2')})`:''}${third?` → LSTM(${n('n3')})`:''} → Dense(${n('dense')}) → Dropout(${n('drop').toFixed(1)}) → Dense(1)<br>Optimizer：${d.querySelector('#opt').value}；Learning rate：${d.querySelector('#lr').value}`;d.querySelector('#n2').disabled=!second;d.querySelector('#n3').disabled=!third}d.querySelectorAll('input,select').forEach(i=>i.oninput=update);update()
}
function metricWidget(){const d=widget('<strong>誤差指標試算</strong><p>調整三筆實際價格與預測值，觀察指標變化。</p><div id="metricInputs"></div><div id="metricResults"></div>');d.querySelector('#metricInputs').innerHTML=[100,104,108].map((v,i)=>`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><label>實際 ${i+1}<input type="number" class="actual" value="${v}" step="0.1"></label><label>預測 ${i+1}<input type="number" class="pred" value="${[101,102,110][i]}" step="0.1"></label></div>`).join('');function update(){let a=[...d.querySelectorAll('.actual')].map(x=>+x.value),p=[...d.querySelectorAll('.pred')].map(x=>+x.value),e=a.map((v,i)=>v-p[i]),m=a.reduce((x,y)=>x+y,0)/a.length,mse=e.reduce((x,y)=>x+y*y,0)/e.length,mae=e.reduce((x,y)=>x+Math.abs(y),0)/e.length,mape=a.every(x=>x!==0)?100*e.reduce((x,y,i)=>x+Math.abs(y/a[i]),0)/e.length:null,sst=a.reduce((x,y)=>x+(y-m)**2,0),r2=sst?1-e.reduce((x,y)=>x+y*y,0)/sst:null;d.querySelector('#metricResults').innerHTML=`<div class="metric-result"><span>MSE</span><strong>${mse.toFixed(3)}</strong></div><div class="metric-result"><span>MAE</span><strong>${mae.toFixed(3)}</strong></div><div class="metric-result"><span>MAPE</span><strong>${mape===null?'無法計算':mape.toFixed(2)+'%'}</strong></div><div class="metric-result"><span>R²</span><strong>${r2===null?'無法計算':r2.toFixed(3)}</strong></div>`}d.querySelectorAll('input').forEach(i=>i.oninput=update);update();const sNum=slides[index]?.number;if(sNum>=27&&sNum<=33){const wins=widget('<strong>投影片中的 MSE 勝出檔數</strong><div class="mini-bars"></div><p>30 檔股票中，LSTM-ARO 有 18 檔取得最低 MSE；不是每檔都勝出。</p>');wins.querySelector('.mini-bars').innerHTML=[['LSTM-ARO',18],['LSTM-GA',10],['LSTM1D',2]].map(([n,v])=>`<div class="mini-bar"><span>${n}</span><i style="width:${v/18*100}%"></i><strong>${v}</strong></div>`).join('')}}
function costWidget(){const d=widget('<strong>搜尋與推論的時間尺度</strong><label>搜尋次數倍率：<span id="multVal" class="value"></span></label><input id="mult" type="range" min="0.1" max="2" step="0.1" value="1"><div class="quote" id="costResult"></div><p>倍率是假設每次評估耗時固定的示意估算；論文實測為 50 個候選 × 50 次迭代。</p>');function update(){let m=+d.querySelector('#mult').value;d.querySelector('#multVal').textContent=m.toFixed(1)+'×';d.querySelector('#costResult').innerHTML=`ARO 離線搜尋：約 <strong>${(8.737*m).toFixed(2)} 天</strong><br>最終模型對 30 檔股票推論：論文記錄約 <strong>302 秒</strong>`}d.querySelector('#mult').oninput=update;update()}
$('#prevBtn').onclick=()=>setIndex(index-1);$('#nextBtn').onclick=()=>setIndex(index+1);$('#closeDrawer').onclick=closeDrawer;$('#overlay').onclick=closeDrawer;document.querySelectorAll('.drawer-tabs button').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;renderDrawer()});
function showOverview(){const grid=$('#overviewGrid');grid.replaceChildren();slides.forEach((s,i)=>{const b=document.createElement('button');b.className=i===index?'current':'';b.innerHTML=`<small>${String(s.number).padStart(2,'0')} · ${category(s.number)}</small><span></span>`;b.querySelector('span').textContent=slideTitle(s);b.onclick=()=>{setIndex(i);hideOverview()};grid.append(b)});$('#overview').hidden=false;$('#closeOverview').focus()}
function hideOverview(){$('#overview').hidden=true;$('#overviewBtn').focus()}
$('#overviewBtn').onclick=showOverview;$('#closeOverview').onclick=hideOverview;$('#overview').addEventListener('click',e=>{if(e.target.id==='overview')hideOverview()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#overview').hidden)hideOverview();else if(drawer.classList.contains('open'))closeDrawer();return}if(drawer.classList.contains('open')||!$('#overview').hidden||/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))return;if(e.key==='ArrowLeft'){e.preventDefault();setIndex(index-1)}if(e.key==='ArrowRight'){e.preventDefault();setIndex(index+1)}});
window.addEventListener('resize',scale);
window.addEventListener('hashchange',()=>{const m=location.hash.match(/^#slide-(\d+)$/);if(!m)return;const num=+m[1];let target=slides.findIndex(s=>s.number===num);if(target===-1&&num>=1&&num<=slides.length)target=num-1;if(target!==-1&&target!==index)setIndex(target)});
let touchX=0;$('#slideFrame').addEventListener('touchstart',e=>{touchX=e.changedTouches[0].screenX},{passive:true});$('#slideFrame').addEventListener('touchend',e=>{const dx=e.changedTouches[0].screenX-touchX;if(Math.abs(dx)>70)setIndex(index+(dx<0?1:-1))},{passive:true});
let wheelSmallTotal=0,wheelLastTime=0,wheelDirection=0;
$('.workspace').addEventListener('wheel',e=>{
  if(drawer.classList.contains('open')||!$('#overview').hidden||!slides.length)return;
  e.preventDefault();
  const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1),direction=Math.sign(delta);
  if(!direction)return;
  const now=performance.now(),newGesture=now-wheelLastTime>250||direction!==wheelDirection;
  wheelLastTime=now;wheelDirection=direction;
  let pages=0;
  if(Math.abs(delta)>=40){pages=Math.max(1,Math.round(Math.abs(delta)/100));wheelSmallTotal=0}
  else if(newGesture){pages=1;wheelSmallTotal=0}
  else{wheelSmallTotal+=Math.abs(delta);pages=Math.floor(wheelSmallTotal/100);wheelSmallTotal%=100}
  if(pages)setIndex(index+direction*Math.min(pages,10));
},{passive:false});
$('#progressTrack').addEventListener('click',e=>{if(!slides.length)return;const r=e.currentTarget.getBoundingClientRect();const fraction=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));setIndex(Math.round(fraction*(slides.length-1)))});
let progressDragging=false;function scrubProgress(e){if(!slides.length)return;const r=$('#progressTrack').getBoundingClientRect();const fraction=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));setIndex(Math.round(fraction*(slides.length-1)))}
$('#progressTrack').addEventListener('pointerdown',e=>{progressDragging=true;e.currentTarget.setPointerCapture(e.pointerId);scrubProgress(e);e.preventDefault()});
$('#progressTrack').addEventListener('pointermove',e=>{if(progressDragging)scrubProgress(e)});
$('#progressTrack').addEventListener('pointerup',e=>{if(!progressDragging)return;scrubProgress(e);progressDragging=false;e.currentTarget.releasePointerCapture(e.pointerId)});
$('#progressTrack').addEventListener('pointercancel',()=>{progressDragging=false});
$('#progressTrack').addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowDown'){e.preventDefault();setIndex(index-1)}else if(e.key==='ArrowRight'||e.key==='ArrowUp'){e.preventDefault();setIndex(index+1)}else if(e.key==='Home'){e.preventDefault();setIndex(0)}else if(e.key==='End'){e.preventDefault();setIndex(slides.length-1)}});
document.addEventListener('DOMContentLoaded',()=>{
  const data = (window.SLIDES_DATA && window.SLIDES_DATA.length)
    ? window.SLIDES_DATA
    : [
        ...(window.SLIDES_PART1 || []),
        ...(window.SLIDES_PART2 || []),
        ...(window.SLIDES_PART3 || [])
      ];
  if(Array.isArray(data) && data.length > 0){
    slides = data;
    $('#loading').hidden=true;
    const m=location.hash.match(/^#slide-(\d+)$/);
    if(m){
      const num=+m[1];
      let target=slides.findIndex(s=>s.number===num);
      if(target===-1&&num>=1&&num<=slides.length)target=num-1;
      setIndex(target!==-1?target:0);
    }else{
      setIndex(0);
    }
  }else{
    $('#loading').textContent='投影片資料缺失，請確認投影片資料 js 檔與 html 位於同一資料夾。';
  }
},{once:true});
