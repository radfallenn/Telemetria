const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'www', 'index.html');
let html = fs.readFileSync(file, 'utf8');

if (html.includes('RAD_FIX_RPM_LAPS_AUTOCONNECT_V4')) {
  console.log('RAD_FIX_RPM_LAPS_AUTOCONNECT_V4 já aplicado.');
  process.exit(0);
}

const style = `
<style id="RAD_FIX_RPM_LAPS_AUTOCONNECT_V4">
.rad-clock-needle,.rad-needle{display:none!important;opacity:0!important;visibility:hidden!important}.rad-tach-arc{background:conic-gradient(from 222deg,rgba(255,255,255,.05) 0 8deg,#ff2b2b 9deg var(--rad-rpm-deg,40deg),rgba(255,255,255,.06) var(--rad-rpm-deg,40deg) 178deg,transparent 179deg 360deg)!important;animation:radRedGrow 1.15s linear infinite!important;filter:drop-shadow(0 0 12px #ff2020)!important}.rad-tach-arc:after{content:"";position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 222deg,transparent 0 calc(var(--rad-rpm-deg,40deg) - 8deg),#ffefef calc(var(--rad-rpm-deg,40deg) - 7deg) var(--rad-rpm-deg,40deg),transparent calc(var(--rad-rpm-deg,40deg) + 1deg) 360deg);-webkit-mask:inherit;mask:inherit;filter:drop-shadow(0 0 12px #ff2020)}@keyframes radRedGrow{0%{filter:drop-shadow(0 0 6px #ff2020)}50%{filter:drop-shadow(0 0 22px #ff2020)}100%{filter:drop-shadow(0 0 6px #ff2020)}}.rad-tach-number{font-size:13px!important}.rad-rpm-live-dot{position:absolute;width:8px;height:8px;border-radius:50%;background:#ffefef;box-shadow:0 0 18px #ff2020,0 0 6px #fff;left:50%;top:50%;transform:rotate(var(--rad-rpm-deg,40deg)) translateX(82px);transform-origin:0 0;z-index:9;pointer-events:none}.rad-lap-badge{position:absolute;right:10px;bottom:8px;font-size:10px;color:#22f5a2;font-weight:900;letter-spacing:.08em}.card[data-lap-fixed="1"]{min-height:108px!important}.rad-auto-chip{position:fixed;left:50%;top:calc(62px + env(safe-area-inset-top));transform:translateX(-50%);z-index:75;background:#071323;border:1px solid rgba(34,245,162,.3);color:#eaf6ff;border-radius:999px;padding:8px 12px;font-size:11px;font-weight:900;display:none}.rad-auto-chip.show{display:block}
</style>`;

const script = `
<script id="RAD_FIX_RPM_LAPS_AUTOCONNECT_V4">
(function(){
  let trying=false;
  const $=id=>document.getElementById(id);
  function show(msg){let c=$('radAutoChip');if(!c){c=document.createElement('div');c.id='radAutoChip';c.className='rad-auto-chip';document.body.appendChild(c)}c.textContent=msg;c.classList.add('show');setTimeout(()=>c.classList.remove('show'),1800)}
  function status(){return (($('statusText')&&$('statusText').textContent)||'').toUpperCase()}
  function disconnected(){const s=status();return !s||s.includes('DESCONECTADO')||s.includes('FALHA')||s.includes('ERRO')||s.includes('FECHADO')||s.includes('OFF')}
  function connectNow(){if(trying||!disconnected())return;const fn=window.connect||(typeof connect==='function'?connect:null);if(typeof fn!=='function')return;trying=true;show('Conectando automaticamente...');Promise.resolve().then(()=>fn()).catch(()=>{}).finally(()=>setTimeout(()=>trying=false,1200))}
  function startAuto(){setTimeout(connectNow,350);setTimeout(connectNow,1400);setTimeout(connectNow,2800)}
  function ensureDot(){const h=document.querySelector('.hero');if(h&&!h.querySelector('.rad-rpm-live-dot')){const d=document.createElement('div');d.className='rad-rpm-live-dot';h.appendChild(d)}}
  function rpmNum(){return parseInt((($('rpmSide')&&$('rpmSide').textContent)||'0').replace(/[^0-9]/g,''),10)||0}
  function updateRpm(){const rpm=rpmNum();const deg=Math.max(6,Math.min(178,Math.round((rpm/10000)*178)));document.documentElement.style.setProperty('--rad-rpm-deg',deg+'deg');ensureDot()}
  function watchRpm(){const r=$('rpmSide');if(r&&!r.dataset.radFixRpmWatch){r.dataset.radFixRpmWatch='1';new MutationObserver(updateRpm).observe(r,{childList:true,characterData:true,subtree:true})}}
  function findLapNumber(){const ids=['lap','laps','lapCount','lapCounter','currentLap','completedLaps','correctedLaps'];for(const id of ids){const e=$(id);if(!e)continue;const n=parseInt((e.textContent||'').replace(/[^0-9]/g,''),10);if(Number.isFinite(n))return n}const txt=document.body.innerText||'';const m=txt.match(/VOLTAS?\s*(?:CORRIGIDAS)?[^0-9]{0,20}(\d+)/i);return m?parseInt(m[1],10):null}
  function parseTimeMs(s){s=String(s||'').trim();if(!s||s==='--')return null;const p=s.split(':');let ms=0;if(p.length===2){ms+=parseInt(p[0],10)*60000;const q=p[1].split('.');ms+=parseInt(q[0],10)*1000;ms+=parseInt((q[1]||'0').padEnd(3,'0').slice(0,3),10);return ms}return null}
  function fmt(ms){if(!Number.isFinite(ms))return'--';const m=Math.floor(ms/60000);const s=Math.floor((ms%60000)/1000);const x=ms%1000;return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+'.'+String(x).padStart(3,'0')}
  function getSaved(){try{return JSON.parse(localStorage.getItem('gt7_lap_records_v4')||'[]')}catch(e){return[]}}
  function setSaved(a){localStorage.setItem('gt7_lap_records_v4',JSON.stringify(a.slice(-200)))}
  let lastLapTxt='';
  function recordLap(){const last=$('lastLapCard');if(!last)return;const t=(last.textContent||'').trim();if(!t||t==='--'||t===lastLapTxt)return;const ms=parseTimeMs(t);if(!ms)return;lastLapTxt=t;const a=getSaved();a.push({t,ms,at:Date.now()});setSaved(a);computeLaps()}
  function computeLaps(){const a=getSaved();const countFromRecords=a.length;const raw=findLapNumber();const corrected=Math.max(0,(raw&&raw>0?raw:countFromRecords)-1);if($('correctedLaps'))$('correctedLaps').textContent=String(corrected);if(a.length){const best=a.reduce((b,x)=>x.ms<b.ms?x:b,a[0]);const total=a.reduce((s,x)=>s+x.ms,0);if($('bestLapCard'))$('bestLapCard').textContent=best.t;if($('totalTimeCard'))$('totalTimeCard').textContent=fmt(total);if($('avgTimeCard')){let arr=a.map(x=>x.ms).sort((x,y)=>x-y);if(arr.length>6)arr=arr.slice(3,-3);const avg=arr.reduce((s,x)=>s+x,0)/arr.length;$('avgTimeCard').textContent=fmt(Math.round(avg))}}
    document.querySelectorAll('.card').forEach(c=>{const title=c.querySelector('.title')?.textContent||'';if(title.includes('VOLTAS')){c.dataset.lapFixed='1';let b=c.querySelector('.rad-lap-badge');if(!b){b=document.createElement('div');b.className='rad-lap-badge';c.appendChild(b)}b.textContent='REGISTROS '+countFromRecords}})}
  function patchStartClear(){const old=window.radStartAutoConnect;window.radStartAutoConnect=()=>{};const btn=$('radExtraStart')||$('radStart');if(btn&&!btn.dataset.radLapClear){btn.dataset.radLapClear='1';btn.addEventListener('click',()=>{localStorage.removeItem('gt7_lap_records_v4');lastLapTxt='';setTimeout(computeLaps,50)},true)}}
  function boot(){ensureDot();watchRpm();updateRpm();if($('lastLapCard')&&!$('lastLapCard').dataset.radLapWatch){$('lastLapCard').dataset.radLapWatch='1';new MutationObserver(recordLap).observe($('lastLapCard'),{childList:true,characterData:true,subtree:true})}computeLaps();patchStartClear();startAuto();}
  document.addEventListener('DOMContentLoaded',boot);window.addEventListener('load',boot);window.addEventListener('focus',startAuto);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')startAuto()});setInterval(()=>{updateRpm();recordLap();computeLaps();patchStartClear();if(disconnected())connectNow()},3500);boot();
})();
</script>`;

html = html.replace('</head>', style + '\n</head>');
html = html.replace('</body>', script + '\n</body>');
fs.writeFileSync(file, html, 'utf8');
console.log('Patch aplicado: RPM vermelho crescente, sem ponteiro, voltas corrigidas e auto conexão ao abrir.');
