const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'www', 'index.html');
let html = fs.readFileSync(file, 'utf8');

if (html.includes('RAD_ZERO_SAVE_SECTION_V5')) {
  console.log('RAD_ZERO_SAVE_SECTION_V5 já aplicado.');
  process.exit(0);
}

const style = `
<style id="RAD_ZERO_SAVE_SECTION_V5">
.rad-extra-action.save-visible{outline:1px solid rgba(255,255,255,.20);box-shadow:0 0 22px rgba(255,42,109,.35),inset 0 1px 0 rgba(255,255,255,.08)}
.rad-zero-note{font-size:11px;color:#22f5a2;margin-top:7px;font-weight:900;letter-spacing:.04em}
</style>`;

const script = `
<script id="RAD_ZERO_SAVE_SECTION_V5">
(function(){
  const $ = id => document.getElementById(id);
  function toast(msg){const t=$('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1500)}else alert(msg)}
  const zeroIds = ['speed','radUnderSpeed','rpmSide','fuelSide','throttleVal','brakeVal','bestLapCard','lastLapCard','totalTimeCard','avgTimeCard','correctedLaps','maxSpeed'];
  function setText(id,value){const e=$(id);if(e)e.textContent=value}
  function zeroEverything(){
    if(!confirm('Zerar toda a seção atual? As Seções Salvas serão mantidas.')) return;
    setText('speed','0');
    setText('radUnderSpeed','0');
    setText('rpmSide','0');
    setText('fuelSide','--');
    setText('throttleVal','0%');
    setText('brakeVal','0%');
    setText('bestLapCard','--');
    setText('lastLapCard','--');
    setText('totalTimeCard','--');
    setText('avgTimeCard','--');
    setText('correctedLaps','0');
    setText('maxSpeed','0');
    const tf=$('throttleFill'); if(tf)tf.style.width='0%';
    const bf=$('brakeFill'); if(bf)bf.style.width='0%';
    [
      'gt7_screen_cache_v1','gt7_current_session','gt7_laps','gt7_lap_records_v4','gt7_session_started_at','gt7_live_laps','gt7_current_laps'
    ].forEach(k=>localStorage.removeItem(k));
    localStorage.setItem('gt7_session_started_at',new Date().toISOString());
    document.querySelectorAll('.rad-lap-badge').forEach(e=>e.textContent='REGISTROS 0');
    toast('Seção atual zerada. Seções Salvas mantidas.');
  }
  function collectSection(){
    return {
      date:new Date().toISOString(),
      speed:($('speed')?.textContent||'0').trim(),
      rpm:($('rpmSide')?.textContent||'--').trim(),
      fuel:($('fuelSide')?.textContent||'--').trim(),
      best:($('bestLapCard')?.textContent||'--').trim(),
      last:($('lastLapCard')?.textContent||'--').trim(),
      total:($('totalTimeCard')?.textContent||'--').trim(),
      avg:($('avgTimeCard')?.textContent||'--').trim(),
      laps:($('correctedLaps')?.textContent||'0').trim(),
      max:($('maxSpeed')?.textContent||'0').trim()
    };
  }
  function saveSection(){
    const data=collectSection();
    let list=[];
    try{list=JSON.parse(localStorage.getItem('gt7_saved_sections')||'[]')}catch(e){list=[]}
    list.unshift(data);
    localStorage.setItem('gt7_saved_sections',JSON.stringify(list.slice(0,100)));
    const box=$('radSavedBox');
    if(box){
      box.innerHTML='<h3>SEÇÕES SALVAS</h3><div class="rad-saved-item"><b>'+new Date(data.date).toLocaleString('pt-BR')+'</b><span>Melhor: '+data.best+' • Voltas: '+data.laps+' • Total: '+data.total+'</span><span>Última: '+data.last+' • Média: '+data.avg+' • Max: '+data.max+'</span></div>';
    }
    toast('Seção salva.');
  }
  function ensureActions(){
    const modal=$('radExtraActions');
    if(!modal)return;
    const start=$('radExtraStart');
    if(start){
      start.innerHTML='<i>🧹</i><div>ZERAR TUDO<span>Zera velocidade, voltas e tempos da seção atual</span><div class="rad-zero-note">Não apaga Seções Salvas</div></div>';
      start.onclick=()=>{zeroEverything();modal.classList.remove('show')};
    }
    let save=$('radExtraSave');
    const grid=modal.querySelector('.rad-extra-grid');
    if(!save&&grid){
      save=document.createElement('button');
      save.id='radExtraSave';
      save.className='rad-extra-action pink save-visible';
      save.innerHTML='<i>💾</i><div>SALVAR SEÇÃO<span>Salva os resultados atuais localmente</span></div>';
      grid.insertBefore(save,grid.children[1]||null);
    }
    if(save){
      save.classList.add('save-visible');
      save.innerHTML='<i>💾</i><div>SALVAR SEÇÃO<span>Salva os resultados atuais localmente</span></div>';
      save.onclick=()=>{saveSection();modal.classList.remove('show')};
    }
  }
  function boot(){ensureActions();setInterval(ensureActions,2000)}
  document.addEventListener('DOMContentLoaded',boot);setTimeout(boot,800);
  window.radZeroCurrentSection=zeroEverything;
  window.radSaveCurrentSection=saveSection;
})();
</script>`;

html = html.replace('</head>', style + '\n</head>');
html = html.replace('</body>', script + '\n</body>');
fs.writeFileSync(file, html, 'utf8');
console.log('Patch aplicado: zerar tudo real sem apagar Seções Salvas e botão Salvar Seção.');
