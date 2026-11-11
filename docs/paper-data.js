// Transcribed from the supplied presentation's excerpts of the paper's Tables 7, 10 and 11.
const paperRows=[
  {stock:'AAPL',aroMse:22.731,gaMse:24.109,aroR2:.857,gaR2:.848},
  {stock:'MSFT',aroMse:63.322,gaMse:79.253,aroR2:.892,gaR2:.865},
  {stock:'CAT',aroMse:38.438,gaMse:36.329,aroR2:.909,gaR2:.914},
  {stock:'CVX',aroMse:23.970,gaMse:21.953,aroR2:.911,gaR2:.919},
  {stock:'UNH',aroMse:126.133,gaMse:96.373,aroR2:.823,gaR2:.865}
];
const inferenceRows=[['ANN',136.5],['LSTM1D',249.6],['LSTM-GA',288.7],['LSTM-ARO',301.956],['LSTM2D',374.3],['LSTM3D',501.5]];
function paperResultsLesson(){
  const selected=(lesson?.text||'').match(/\b(AAPL|MSFT|CAT|CVX|UNH)\b/)?.[1]||'AAPL';
  const d=lessonBox('<div class="paper-toolbar"><label>查看資料 <select id="paperView"><option value="stocks">逐股原值</option><option value="time">執行時間</option></select></label><label id="stockPicker">聚焦股票 <select id="paperStock"></select></label></div><div id="paperContent"></div>');
  d.classList.add('paper-data-box');
  d.querySelector('#paperStock').innerHTML=paperRows.map(r=>`<option>${r.stock}</option>`).join('');
  d.querySelector('#paperStock').value=selected;
  if(slides[index]?.number===32&&lesson?.page)d.querySelector('#paperView').value='time';
  function show(){
    const view=d.querySelector('#paperView').value;
    d.querySelector('#stockPicker').hidden=view!=='stocks';
    if(view==='time'){
      d.querySelector('#paperContent').innerHTML=`<p class="paper-citation">原論文 §4.3、Table 11；30 檔股票的最終模型推論時間。</p><div class="paper-table-wrap"><table class="paper-table"><thead><tr><th>模型</th><th>推論時間（秒）</th></tr></thead><tbody>${inferenceRows.map(([name,seconds])=>`<tr><td>${name}</td><td>${seconds.toFixed(name==='LSTM-ARO'?3:1)}</td></tr>`).join('')}</tbody></table></div><div class="paper-fact-grid"><div><small>ARO 搜尋 50 × 50</small><strong>8.737 天</strong></div><div><small>GA 搜尋 50 × 50</small><strong>8.353 天</strong></div></div><p class="lesson-note">搜尋時間與最終模型的推論時間屬於不同階段。</p>`;
      return;
    }
    const name=d.querySelector('#paperStock').value,row=paperRows.find(r=>r.stock===name),mseDelta=row.aroMse-row.gaMse,r2Delta=row.aroR2-row.gaR2;
    d.querySelector('#paperContent').innerHTML=`<p class="paper-citation">原論文 Table 7（MSE）與 Table 10（R²）的五檔摘錄。MSE 較低較好；R² 較高較好。</p><div class="paper-table-wrap"><table class="paper-table"><thead><tr><th>股票</th><th>ARO MSE</th><th>GA MSE</th><th>ARO R²</th><th>GA R²</th></tr></thead><tbody>${paperRows.map(r=>`<tr class="${r.stock===name?'active':''}"><th>${r.stock}</th><td>${r.aroMse.toFixed(3)}</td><td>${r.gaMse.toFixed(3)}</td><td>${r.aroR2.toFixed(3)}</td><td>${r.gaR2.toFixed(3)}</td></tr>`).join('')}</tbody></table></div><div class="paper-delta"><strong>${name}：ARO − GA</strong><span>MSE ${mseDelta>=0?'+':''}${mseDelta.toFixed(3)} · R² ${r2Delta>=0?'+':''}${r2Delta.toFixed(3)}</span><small>差值依上表計算；MSE 負值、R² 正值代表 ARO 較佳。</small></div><div class="paper-fact-grid"><div><small>樣本</small><strong>30 檔 DJIA 股票</strong></div><div><small>預測視窗</small><strong>前 20 日 → 下一日</strong></div><div><small>資料期間</small><strong>2018–2022</strong></div><div><small>切分</small><strong>80% 訓練／20% 測試</strong></div></div>`;
  }
  d.querySelector('#paperView').onchange=show;
  d.querySelector('#paperStock').onchange=show;
  show();
}
