const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'www', 'index.html');
let html = fs.readFileSync(file, 'utf8');
if (html.includes('RAD_STOP_FLICKER_MANUAL_V14')) process.exit(0);

const style = `
<style id="RAD_STOP_FLICKER_MANUAL_V14">
.rad-auto-chip{display:none!important}.rad-session-wait,.rad-lap-badge{display:none!important}
#bestLapCard,#lastLapCard,#totalTimeCard,#avgTimeCard,#correctedLaps{transition:none!important}
</style>`;

const script = `
<script id="RAD_STOP_FLICKER_MANUAL_V14">
(function(){
  const lapFields=['bestLapCard','lastLapCard','totalTimeCard','avgTimeCard','correctedLaps'];
  const lastStable={};
  let lock=false;
  function el(id){return document.getElementById(id)}
  function isEmpty(v){v=String(v||'').trim();return !v||v==='--'||v==='0' || v==='0%'}
  function parseTime(v){return /^\d{1,2}:\d{2}\.\d{3}$/.test(String(v||'').trim())}
  function validFor(id,v){
    v=String(v||'').trim();
    if(id==='correctedLaps') return /^\d+$/.test(v);
    return parseTime(v) || v==='--';
  }
  function saveStable(){
    if(lock)return;
    lapFields.forEach(id=>{const n=el(id);if(!n)return;const v=n.textContent.trim();if(validFor(id,v)&&!isEmpty(v))lastStable[id]=v});
  }
  function restoreBad(){
    if(lock)return;
    lock=true;
    lapFields.forEach(id=>{const n=el(id);if(!n)return;const v=n.textContent.trim();if(!validFor(id,v)&&lastStable[id])n.textContent=lastStable[id]});
    lock=false;
  }
  function stopAutoVisual(){
    document.querySelectorAll('.rad-auto-chip').forEach(x=>x.remove());
    window.radStartAutoConnect=function(){};
  }
  function boot(){
    stopAutoVisual();
    lapFields.forEach(id=>{const n=el(id);if(n&&!n.dataset.radNoFlicker){n.dataset.radNoFlicker='1';new MutationObserver(()=>{saveStable();setTimeout(restoreBad,40)}).observe(n,{childList:true,characterData:true,subtree:true})}});
    saveStable();restoreBad();
  }
  document.addEventListener('DOMContentLoaded',boot);window.addEventListener('load',boot);setTimeout(boot,600);setInterval(boot,2500);
})();
</script>`;

html = html.replace('</head>', style + '\n</head>');
html = html.replace('</body>', script + '\n</body>');
fs.writeFileSync(file, html, 'utf8');
console.log('Patch aplicado: sem auto conexão e anti-flicker.');
