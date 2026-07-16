const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'www', 'index.html');
let html = fs.readFileSync(file, 'utf8');
if (html.includes('RAD_DOM_STABILIZER_V15')) process.exit(0);

const style = `
<style id="RAD_DOM_STABILIZER_V15">
#bestLapCard,#lastLapCard,#totalTimeCard,#avgTimeCard,#correctedLaps,#speed,#radUnderSpeed,#rpmSide,#fuelSide,#throttleVal,#brakeVal{transition:none!important;animation:none!important}
.rad-value-hold{opacity:1!important}
</style>`;

const script = `
<script id="RAD_DOM_STABILIZER_V15">
(function(){
  const ids=['bestLapCard','lastLapCard','totalTimeCard','avgTimeCard','correctedLaps','speed','radUnderSpeed','rpmSide','fuelSide','throttleVal','brakeVal'];
  const stable={};
  const lastChange={};
  let internal=false;
  function node(id){return document.getElementById(id)}
  function valid(id,v){
    v=String(v||'').trim();
    if(id==='speed'||id==='radUnderSpeed')return /^\d{1,3}$/.test(v);
    if(id==='rpmSide')return v==='--'||/^\d{1,5}$/.test(v);
    if(id==='fuelSide')return v==='--'||/^\d{1,3}$/.test(v);
    if(id==='throttleVal'||id==='brakeVal')return /^\d{1,3}%$/.test(v);
    if(id==='correctedLaps')return /^\d+$/.test(v);
    return v==='--'||/^\d{1,2}:\d{2}\.\d{3}$/.test(v);
  }
  function badOverwrite(id,next){
    const prev=stable[id];
    if(prev===undefined)return false;
    next=String(next||'').trim();
    if(next==='--'&&prev!=='--')return true;
    if(next===''&&prev!=='')return true;
    if(!valid(id,next))return true;
    return false;
  }
  function observe(id){
    const n=node(id); if(!n||n.dataset.radDomStable==='1')return;
    n.dataset.radDomStable='1';
    const v=n.textContent.trim(); if(valid(id,v))stable[id]=v;
    new MutationObserver(()=>{
      if(internal)return;
      const val=n.textContent.trim();
      const t=Date.now();
      if(badOverwrite(id,val)){
        internal=true;
        n.textContent=stable[id];
        n.classList.add('rad-value-hold');
        setTimeout(()=>{internal=false},0);
        return;
      }
      if(valid(id,val)){
        if(stable[id]!==val){
          if(t-(lastChange[id]||0)<120 && (val==='--'||val==='')){
            internal=true; n.textContent=stable[id]||'--'; setTimeout(()=>{internal=false},0); return;
          }
          stable[id]=val; lastChange[id]=t;
        }
      }
    }).observe(n,{childList:true,characterData:true,subtree:true});
  }
  function boot(){ids.forEach(observe); window.radStartAutoConnect=function(){}; document.querySelectorAll('.rad-auto-chip').forEach(e=>e.remove());}
  document.addEventListener('DOMContentLoaded',boot); window.addEventListener('load',boot); setTimeout(boot,500); setInterval(boot,1500);
})();
</script>`;

html = html.replace('</head>', style + '\n</head>');
html = html.replace('</body>', script + '\n</body>');
fs.writeFileSync(file, html, 'utf8');
console.log('Patch aplicado: estabilizador forte de DOM v15.');
