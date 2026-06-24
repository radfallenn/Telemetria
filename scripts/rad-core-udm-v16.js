const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'www', 'index.html');
let html = fs.readFileSync(file, 'utf8');
if (html.includes('RAD_CORE_UDM_V16')) process.exit(0);

const style = `
<style id="RAD_CORE_UDM_V16">
.rad-core-status{margin-top:10px;border-radius:14px;padding:10px 12px;background:linear-gradient(145deg,rgba(9,18,31,.96),rgba(3,7,14,.98));border:1px solid rgba(80,130,190,.22);font-size:11px;color:#dce8f6;display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}.rad-core-pill{border-radius:999px;padding:5px 8px;font-weight:900;font-size:10px;background:#111;color:#ffe04d}.rad-core-pill.run{color:#22f5a2}.rad-core-pill.stop{color:#ff315e}
#bestLapCard,#lastLapCard,#totalTimeCard,#avgTimeCard,#correctedLaps{transition:none!important;animation:none!important}
</style>`;

const script = `
<script id="RAD_CORE_UDM_V16">
(function(){
  const $=id=>document.getElementById(id);
  const STORE='gt7_core_laps_v16';
  const STATE='gt7_core_state_v16';
  let lastAccepted='';
  let lock=false;
  function read(k,d){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(e){return d}}
  function write(k,v){localStorage.setItem(k,JSON.stringify(v))}
  function text(id){return (($(id)&&$(id).textContent)||'').trim()}
  function set(id,v){const e=$(id);if(e&&e.textContent!==String(v)){lock=true;e.textContent=String(v);setTimeout(()=>lock=false,0)}}
  function speed(){return parseInt((text('speed')||text('radUnderSpeed')||'0').replace(/[^0-9]/g,''),10)||0}
  function rpm(){return parseInt((text('rpmSide')||'0').replace(/[^0-9]/g,''),10)||0}
  function parseMs(t){t=String(t||'').trim();const m=t.match(/^(\d{1,2}):(\d{2})\.(\d{3})$/);if(!m)return null;return Number(m[1])*60000+Number(m[2])*1000+Number(m[3])}
  function fmt(ms){if(!Number.isFinite(ms)||ms<=0)return'--';const m=Math.floor(ms/60000),s=Math.floor((ms%60000)/1000),x=Math.round(ms%1000);return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+'.'+String(x).padStart(3,'0')}
  function laps(){const a=read(STORE,[]);return Array.isArray(a)?a.filter(x=>x&&Number.isFinite(Number(x.ms))):[]}
  function saveLaps(a){write(STORE,a.slice(-200));localStorage.setItem('gt7_lap_records_v8',JSON.stringify(a.slice(-200)))}
  function state(){return read(STATE,{active:false,phase:'PARADO'})}
  function saveState(s){write(STATE,s)}
  function raceState(){
    const s=speed(), r=rpm(), st=state();
    let phase='PARADO';
    if(s>20||r>2500) phase=st.active?'VOLTA VÁLIDA':'MOVIMENTO';
    if(st.active&&s<=8&&r<1800) phase='AGUARDANDO MOVIMENTO';
    st.phase=phase; saveState(st); return st;
  }
  function validLap(t,ms){
    const st=state();
    if(!st.active)return false;
    if(speed()<20&&rpm()<2200)return false;
    if(!Number.isFinite(ms)||ms<30000||ms>900000)return false;
    if(t===lastAccepted)return false;
    const a=laps();
    if(a.some(x=>x.t===t||Math.abs(Number(x.ms)-ms)<20))return false;
    return true;
  }
  function compute(){
    const a=laps();
    const registered=a.length;
    const corrected=Math.max(0,registered-1);
    set('correctedLaps',corrected);
    if(!a.length){set('bestLapCard','--');set('lastLapCard','--');set('totalTimeCard','--');set('avgTimeCard','--');updateStatus();return}
    const best=a.reduce((b,x)=>Number(x.ms)<Number(b.ms)?x:b,a[0]);
    const total=a.reduce((sum,x)=>sum+Number(x.ms),0);
    let arr=a.map(x=>Number(x.ms)).sort((x,y)=>x-y);
    if(arr.length>=7)arr=arr.slice(3,-3);
    const avg=arr.length?arr.reduce((s,x)=>s+x,0)/arr.length:0;
    set('bestLapCard',best.t);set('lastLapCard',a[a.length-1].t);set('totalTimeCard',fmt(total));set('avgTimeCard',fmt(avg));updateStatus();
  }
  function acceptFromLastLap(){
    const t=text('lastLapCard');
    const ms=parseMs(t);
    if(validLap(t,ms)){const a=laps();a.push({t,ms,at:Date.now()});saveLaps(a);lastAccepted=t;compute();}
  }
  function resetCurrent(){
    saveLaps([]);lastAccepted='';saveState({active:true,phase:'AGUARDANDO MOVIMENTO'});['bestLapCard','lastLapCard','totalTimeCard','avgTimeCard'].forEach(id=>set(id,'--'));set('correctedLaps','0');compute();
  }
  function updateStatus(){
    let box=$('radCoreStatus');
    if(!box){const cards=document.querySelector('.cards');if(!cards)return;box=document.createElement('div');box.id='radCoreStatus';box.className='rad-core-status';cards.insertAdjacentElement('afterend',box)}
    const st=raceState();
    const cls=st.active?'run':'stop';
    box.innerHTML='<span>UDM Core: Race State + Lap Validator + Stability Lock</span><b class="rad-core-pill '+cls+'">'+st.phase+'</b>';
  }
  function hookButtons(){
    const zero=$('setZero')||$('radExtraStart')||$('radStart');
    if(zero&&!zero.dataset.radCoreHook){zero.dataset.radCoreHook='1';zero.addEventListener('click',()=>setTimeout(resetCurrent,80),true)}
    const save=$('setSave')||$('radExtraSave')||$('radSave');
    if(save&&!save.dataset.radCoreSave){save.dataset.radCoreSave='1';save.addEventListener('click',()=>{const st=state();st.active=false;st.phase='SALVA';saveState(st);updateStatus()},true)}
  }
  function stabilize(){
    ['bestLapCard','lastLapCard','totalTimeCard','avgTimeCard','correctedLaps'].forEach(id=>{const e=$(id);if(!e||e.dataset.radCoreStable)return;e.dataset.radCoreStable='1';new MutationObserver(()=>{if(lock)return;setTimeout(()=>{acceptFromLastLap();compute()},60)}).observe(e,{childList:true,characterData:true,subtree:true})})
  }
  function boot(){if(localStorage.getItem(STATE)===null)saveState({active:false,phase:'PARADO'});hookButtons();stabilize();acceptFromLastLap();compute();}
  document.addEventListener('DOMContentLoaded',boot);window.addEventListener('load',boot);setTimeout(boot,700);setInterval(()=>{hookButtons();acceptFromLastLap();compute()},2000);
  window.radCoreResetSession=resetCurrent;
})();
</script>`;
html = html.replace('</head>', style+'\n</head>');
html = html.replace('</body>', script+'\n</body>');
fs.writeFileSync(file, html, 'utf8');
console.log('Patch aplicado: UDM Core v16.');
