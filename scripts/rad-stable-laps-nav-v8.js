const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'www', 'index.html');
let html = fs.readFileSync(file, 'utf8');

if (html.includes('RAD_STABLE_LAPS_NAV_V8')) {
  console.log('RAD_STABLE_LAPS_NAV_V8 já aplicado.');
  process.exit(0);
}

const style = `
<style id="RAD_STABLE_LAPS_NAV_V8">
/* v8: navegação limpa e lógica de voltas estável */
.bottom-nav{display:grid!important;grid-template-columns:repeat(4,1fr)!important;align-items:center!important;gap:0!important;padding:0 8px!important;min-height:86px!important}
.bottom-nav > *{position:relative!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;transform:none!important;width:auto!important;min-width:0!important;max-width:none!important;height:100%!important;border-radius:0!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:6px!important;background:transparent!important;box-shadow:none!important}
.bottom-nav > *:empty,.bottom-nav [style*="display: none"]{display:none!important}
.bottom-nav .live,.bottom-nav .center,.bottom-nav .nav-live,.bottom-nav [data-tab="live"]{display:none!important}
.bottom-nav > *:has(*),.bottom-nav > button,.bottom-nav > a{display:flex!important}
.bottom-nav > *:nth-child(n+5){display:none!important}
.bottom-nav::before,.bottom-nav::after{display:none!important}
.rad-nav-fixed-label{font-size:11px!important;font-weight:900!important;color:#fff!important;letter-spacing:.03em!important}.rad-nav-fixed-icon{font-size:25px!important;line-height:1!important}.rad-nav-active:after{content:"";position:absolute;left:22%;right:22%;bottom:8px;height:5px;border-radius:999px;background:#ff315e;box-shadow:0 0 10px rgba(255,49,94,.7)}
.rad-pre-race .rad-speed-under .rsu-speed,.rad-pre-race #speed{opacity:.88}.rad-pre-race #bestLapCard,.rad-pre-race #lastLapCard,.rad-pre-race #totalTimeCard,.rad-pre-race #avgTimeCard,.rad-pre-race #correctedLaps{transition:none!important}.rad-session-wait{position:absolute;right:10px;bottom:8px;font-size:10px;color:#ffb11b;font-weight:900;letter-spacing:.08em}.rad-lap-badge{color:#22f5a2!important}.rad-stable-hidden-live{display:none!important;pointer-events:none!important;opacity:0!important}
</style>`;

const script = `
<script id="RAD_STABLE_LAPS_NAV_V8">
(function(){
  const $ = id => document.getElementById(id);
  const SESSION_KEY = 'gt7_active_lap_session_v8';
  const RECORDS_KEY = 'gt7_lap_records_v8';
  let lastAcceptedLap = '';
  let lastRecordAt = 0;
  let lastMovingAt = 0;

  function parseJSON(k, fallback){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(fallback))}catch(e){return fallback}}
  function saveJSON(k,v){localStorage.setItem(k, JSON.stringify(v))}
  function num(id){return parseFloat((($(id)&&$(id).textContent)||'0').replace(',', '.').replace(/[^0-9.\-]/g,''))||0}
  function txt(id){return (($(id)&&$(id).textContent)||'').trim()}
  function set(id,v){const e=$(id); if(e && e.textContent!==String(v)) e.textContent=String(v)}
  function now(){return Date.now()}
  function isActive(){return localStorage.getItem(SESSION_KEY)==='1'}
  function setActive(v){localStorage.setItem(SESSION_KEY, v?'1':'0'); document.body.classList.toggle('rad-pre-race', !v)}
  function speed(){return num('speed') || num('radUnderSpeed')}
  function rpm(){return num('rpmSide')}
  function validMoving(){const s=speed(), r=rpm(); if(s>25 || r>2500) lastMovingAt=now(); return now()-lastMovingAt < 9000}
  function parseTimeMs(s){s=String(s||'').trim(); if(!s||s==='--')return null; const p=s.split(':'); if(p.length!==2)return null; const sec=p[1].split('.'); const m=parseInt(p[0],10), ss=parseInt(sec[0],10), ms=parseInt((sec[1]||'0').padEnd(3,'0').slice(0,3),10); if(!Number.isFinite(m)||!Number.isFinite(ss)||!Number.isFinite(ms))return null; return m*60000+ss*1000+ms}
  function fmt(ms){if(!Number.isFinite(ms)||ms<=0)return'--'; const m=Math.floor(ms/60000), s=Math.floor((ms%60000)/1000), x=Math.round(ms%1000); return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+'.'+String(x).padStart(3,'0')}
  function records(){const r=parseJSON(RECORDS_KEY,[]); return Array.isArray(r)?r.filter(x=>x&&Number.isFinite(Number(x.ms))):[]}
  function setRecords(r){saveJSON(RECORDS_KEY, r.slice(-200))}
  function updateCards(){
    const r=records();
    const corrected=Math.max(0, r.length-1);
    set('correctedLaps', corrected);
    document.querySelectorAll('.rad-lap-badge').forEach(b=>b.textContent='REGISTROS '+r.length);
    if(!r.length){
      set('bestLapCard','--'); set('lastLapCard','--'); set('totalTimeCard','--'); set('avgTimeCard','--');
      markWaiting(); return;
    }
    const best=r.reduce((a,b)=>Number(b.ms)<Number(a.ms)?b:a,r[0]);
    const total=r.reduce((s,x)=>s+Number(x.ms),0);
    set('bestLapCard', best.t);
    set('lastLapCard', r[r.length-1].t);
    set('totalTimeCard', fmt(total));
    const arr=r.map(x=>Number(x.ms)).filter(Number.isFinite).sort((a,b)=>a-b);
    let avgArr=arr.slice();
    if(avgArr.length>=7) avgArr=avgArr.slice(3,-3);
    if(avgArr.length){set('avgTimeCard', fmt(avgArr.reduce((s,x)=>s+x,0)/avgArr.length))} else set('avgTimeCard','--');
    markWaiting();
  }
  function markWaiting(){
    const card=[...document.querySelectorAll('.card')].find(c=>(c.querySelector('.title')?.textContent||'').includes('VOLTAS'));
    if(!card)return;
    let b=card.querySelector('.rad-lap-badge'); if(!b){b=document.createElement('div');b.className='rad-lap-badge';card.appendChild(b)}
    b.textContent='REGISTROS '+records().length;
    let w=card.querySelector('.rad-session-wait');
    if(!isActive()){ if(!w){w=document.createElement('div');w.className='rad-session-wait';card.appendChild(w)} w.textContent='AGUARDANDO CORRIDA'; }
    else if(w) w.remove();
  }
  function maybeRecord(){
    if(!isActive()) return updateCards();
    if(!validMoving()) return updateCards();
    const last=txt('lastLapCard');
    const ms=parseTimeMs(last);
    if(!ms || ms<30000 || ms>900000) return updateCards();
    const signature=last+'|'+Math.round(ms/10);
    if(signature===lastAcceptedLap || now()-lastRecordAt<12000) return updateCards();
    const r=records();
    if(r.some(x=>x.t===last && Math.abs(Number(x.ms)-ms)<20)) return updateCards();
    r.push({t:last, ms, at:now()});
    setRecords(r);
    lastAcceptedLap=signature; lastRecordAt=now();
    updateCards();
  }
  function zeroSession(){
    setRecords([]); lastAcceptedLap=''; lastRecordAt=0; lastMovingAt=0; setActive(true);
    ['bestLapCard','lastLapCard','totalTimeCard','avgTimeCard'].forEach(id=>set(id,'--'));
    set('correctedLaps','0');
    localStorage.removeItem('gt7_screen_cache_v1'); localStorage.removeItem('gt7_lap_records_v4');
    updateCards();
  }
  function hookActions(){
    const zero=$('setZero')||$('radExtraStart')||$('radStart');
    if(zero && zero.dataset.radStableZero!=='1'){zero.dataset.radStableZero='1'; zero.addEventListener('click',()=>setTimeout(zeroSession,60),true)}
    const save=$('setSave')||$('radExtraSave');
    if(save && save.dataset.radStableSave!=='1'){save.dataset.radStableSave='1'; save.addEventListener('click',()=>setActive(false),false)}
  }
  function fixNav(){
    const nav=document.querySelector('.bottom-nav'); if(!nav)return;
    [...nav.children].forEach(ch=>{if((ch.textContent||'').toUpperCase().includes('AO VIVO')){ch.classList.add('rad-stable-hidden-live'); ch.style.display='none'}});
    let visible=[...nav.children].filter(ch=>getComputedStyle(ch).display!=='none' && !ch.classList.contains('rad-stable-hidden-live'));
    const labels=['DASH','VOLTAS','INFO','SET']; const icons=['▦','⏱','▤','⚙'];
    visible.slice(0,4).forEach((el,i)=>{
      if(el.dataset.radNavFixed==='1')return;
      el.dataset.radNavFixed='1';
      const old=el.innerHTML;
      const label=(el.textContent||labels[i]).toUpperCase().includes(labels[i])?labels[i]:labels[i];
      el.innerHTML='<div class="rad-nav-fixed-icon">'+icons[i]+'</div><div class="rad-nav-fixed-label">'+label+'</div>';
      if(i===0)el.classList.add('rad-nav-active');
    });
  }
  function boot(){
    if(localStorage.getItem(SESSION_KEY)===null) setActive(false); else document.body.classList.toggle('rad-pre-race', !isActive());
    fixNav(); hookActions(); maybeRecord(); updateCards();
  }
  document.addEventListener('DOMContentLoaded',boot); window.addEventListener('load',boot);
  setInterval(()=>{fixNav();hookActions();maybeRecord();},1500);
  window.radStableZeroSession=zeroSession;
})();
</script>`;

html = html.replace('</head>', style + '\n</head>');
html = html.replace('</body>', script + '\n</body>');
fs.writeFileSync(file, html, 'utf8');
console.log('Patch aplicado: navegação 4 botões e voltas estáveis v8.');
