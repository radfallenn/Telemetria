const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'www', 'index.html');
let html = fs.readFileSync(file, 'utf8');
if (html.includes('RAD_SESSION_FEATURES_V3')) {
  console.log('RAD_SESSION_FEATURES_V3 já aplicado.');
  process.exit(0);
}
const style = `
<style id="RAD_SESSION_STYLE_V3">
.copy-btn{width:52px!important;height:52px!important;border-radius:16px!important;font-size:28px!important;right:10px!important;top:10px!important;display:grid!important;place-items:center!important;box-shadow:0 0 0 1px rgba(255,255,255,.18),0 0 18px rgba(0,125,255,.30)!important}.copy-btn:active{transform:scale(.94)}
.rad-session-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0 4px}.rad-session-btn{min-height:78px;border-radius:18px;border:1px solid rgba(255,255,255,.16);color:#fff;text-align:left;padding:13px 14px;display:grid;grid-template-columns:42px 1fr;gap:10px;align-items:center;font-weight:900;box-shadow:0 18px 36px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.06)}.rad-session-btn i{font-size:30px;font-style:normal}.rad-session-btn b{display:block;font-size:14px;letter-spacing:.04em}.rad-session-btn span{display:block;font-size:12px;color:#c7d2df;line-height:1.2;margin-top:3px}.rad-start{background:linear-gradient(135deg,rgba(0,220,255,.42),rgba(8,24,38,.96))}.rad-save{background:linear-gradient(135deg,rgba(255,42,109,.62),rgba(29,7,18,.96))}
.rad-saved{margin-top:14px;border-radius:16px;padding:13px;background:linear-gradient(145deg,rgba(11,23,40,.94),rgba(3,8,16,.98));border:1px solid rgba(88,136,180,.25);box-shadow:0 18px 36px rgba(0,0,0,.55)}.rad-saved h3{margin:0 0 8px;font-size:14px;letter-spacing:.06em}.rad-saved-item{font-size:12px;color:#cfe2f3;display:grid;gap:4px}
.rad-tach-number{position:absolute;color:#fff;font-weight:900;font-size:18px;z-index:3;pointer-events:none}.rad-n0{left:24%;bottom:25%}.rad-n1{left:20%;bottom:39%}.rad-n2{left:22%;top:35%}.rad-n3{left:32%;top:22%}.rad-n4{left:47%;top:15%}.rad-n5{right:32%;top:22%}.rad-n6{right:22%;top:35%}.rad-n7{right:20%;bottom:39%}.rad-n8{right:24%;bottom:25%}
.hero:after{content:"";position:absolute;inset:16px;border-radius:50%;background:repeating-conic-gradient(from 225deg,rgba(255,255,255,.88) 0 1deg,transparent 1deg 5deg);-webkit-mask:radial-gradient(circle,transparent 0 76%,#000 77% 80%,transparent 81%);mask:radial-gradient(circle,transparent 0 76%,#000 77% 80%,transparent 81%);pointer-events:none}
</style>`;
const script = `
<script id="RAD_SESSION_FEATURES_V3">
(function(){
  const $ = id => document.getElementById(id);
  const text = id => ($(id) && $(id).textContent.trim()) || '--';
  function toast(msg){ const t=$('toast'); if(t){ t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1600); } }
  function values(){ return {date:new Date().toISOString(), best:text('bestLapCard'), last:text('lastLapCard'), total:text('totalTimeCard'), avg:text('avgTimeCard'), laps:text('correctedLaps'), max:text('maxSpeed'), speed:text('speed')}; }
  function renderSaved(){ const box=$('radSavedBox'); if(!box) return; const list=JSON.parse(localStorage.getItem('gt7_saved_sections')||'[]'); const s=list[0]; box.innerHTML='<h3>SEÇÕES SALVAS</h3>'+(s?'<div class="rad-saved-item"><b>'+new Date(s.date).toLocaleString('pt-BR')+'</b><span>Melhor: '+s.best+' • Voltas: '+s.laps+' • Total: '+s.total+'</span><span>Última: '+s.last+' • Média: '+s.avg+' • Max: '+s.max+'</span></div>':'<div class="rad-saved-item">Nenhuma seção salva ainda.</div>'); }
  function resetSession(){ ['bestLapCard','lastLapCard','totalTimeCard','avgTimeCard'].forEach(id=>{ if($(id)) $(id).textContent='--'; }); if($('correctedLaps')) $('correctedLaps').textContent='0'; if($('maxSpeed')) $('maxSpeed').textContent='0'; localStorage.removeItem('gt7_current_session'); localStorage.removeItem('gt7_laps'); localStorage.setItem('gt7_session_started_at',new Date().toISOString()); toast('Seção iniciada'); }
  function saveSession(){ const list=JSON.parse(localStorage.getItem('gt7_saved_sections')||'[]'); list.unshift(values()); localStorage.setItem('gt7_saved_sections',JSON.stringify(list.slice(0,80))); renderSaved(); toast('Seção salva localmente'); }
  function installButtons(){ const cards=document.querySelector('.cards'); if(!cards || $('radSessionActions')) return; const actions=document.createElement('div'); actions.id='radSessionActions'; actions.className='rad-session-actions'; actions.innerHTML='<button class="rad-session-btn rad-start" id="radStart"><i>🏁</i><div><b>INICIAR SEÇÃO</b><span>Limpa todos os dados da seção anterior</span></div></button><button class="rad-session-btn rad-save" id="radSave"><i>💾</i><div><b>SALVAR SEÇÃO</b><span>Salva os resultados desta seção</span></div></button>'; cards.insertAdjacentElement('afterend',actions); const saved=document.createElement('div'); saved.id='radSavedBox'; saved.className='rad-saved'; actions.insertAdjacentElement('afterend',saved); $('radStart').onclick=resetSession; $('radSave').onclick=saveSession; renderSaved(); }
  function installTach(){ const h=document.querySelector('.hero'); if(!h || h.querySelector('.rad-tach-number')) return; ['0','1','2','3','4','5','6','7','8'].forEach((n,i)=>{ const e=document.createElement('span'); e.className='rad-tach-number rad-n'+i; e.textContent=n; h.appendChild(e); }); }
  document.addEventListener('click',e=>{ if(e.target.closest('.copy-btn')) setTimeout(()=>toast('Copiado'),20); },true);
  installButtons(); installTach();
})();
</script>`;
html = html.replace('</head>', style + '\n</head>');
html = html.replace('</body>', script + '\n</body>');
fs.writeFileSync(file, html, 'utf8');
console.log('Patch RAD_SESSION_FEATURES_V3 aplicado sem desconto duplicado de voltas corrigidas.');
