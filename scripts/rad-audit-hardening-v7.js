const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'www', 'index.html');
let html = fs.readFileSync(file, 'utf8');

if (html.includes('RAD_AUDIT_HARDENING_V7')) {
  console.log('RAD_AUDIT_HARDENING_V7 já aplicado.');
  process.exit(0);
}

const style = `
<style id="RAD_AUDIT_HARDENING_V7">
.rad-more-actions-btn,.rad-rpm-quick,.rad-tach-quick,.rad-budget-open,.rad-card-designer-open{display:none!important;pointer-events:none!important;opacity:0!important}
.bottom-nav{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:0!important;overflow:hidden!important}
.bottom-nav button,.bottom-nav a,.bottom-nav>div{min-width:0!important}
.bottom-nav *{user-select:none}
.rad-set-hub-overlay,.rad-extra-actions-overlay,.rad-rpm-editor,.rad-budget-overlay,.rad-modal-backdrop,.rad-tach-adjust-panel{overscroll-behavior:contain}
.rad-lap-badge,.rad-session-wait{display:none!important}
.card input,.card select,.card button{cursor:auto!important}
.rad-card-copy-flash{transition:outline .15s ease,box-shadow .15s ease}
</style>`;

const script = `
<script id="RAD_AUDIT_HARDENING_V7">
(function(){
  let lastSavedHash = '';
  function readJSON(key, fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch(e){return fallback}}
  function hideLiveButton(){
    document.querySelectorAll('.bottom-nav button,.bottom-nav a,.bottom-nav>div,.live-center').forEach(el=>{
      const t=(el.textContent||'').toUpperCase();
      if(t.includes('AO VIVO')||el.classList.contains('live-center')) el.style.display='none';
    });
  }
  function exposeSetHub(){
    if(typeof window.radOpenSetHub!=='function'){
      window.radOpenSetHub=function(){const hub=document.getElementById('radSetHub');if(hub)hub.classList.add('show')};
    }
  }
  function dedupeSavedSections(){
    const list=readJSON('gt7_saved_sections',[]);
    if(!Array.isArray(list)||!list.length)return;
    const seen=new Set();
    const clean=[];
    for(const item of list){
      const hash=[item.best,item.last,item.total,item.avg,item.laps,item.max].join('|');
      if(seen.has(hash))continue;
      seen.add(hash);clean.push(item);
    }
    const newHash=JSON.stringify(clean.slice(0,100));
    if(newHash!==lastSavedHash){lastSavedHash=newHash;localStorage.setItem('gt7_saved_sections',newHash)}
  }
  function repairCardsCopy(){
    document.querySelectorAll('.card').forEach(card=>{
      if(card.dataset.radAuditCopy==='1')return;
      card.dataset.radAuditCopy='1';
      card.addEventListener('click',e=>{if(e.target.closest('button,input,select,textarea,a,.bottom-nav,.rad-set-hub-overlay,.rad-extra-actions-overlay'))return},true);
    });
  }
  function boot(){exposeSetHub();hideLiveButton();dedupeSavedSections();repairCardsCopy()}
  document.addEventListener('DOMContentLoaded',boot);window.addEventListener('load',boot);setTimeout(boot,800);setInterval(boot,2500);
})();
</script>`;

html = html.replace('</head>', style + '\n</head>');
html = html.replace('</body>', script + '\n</body>');
fs.writeFileSync(file, html, 'utf8');
console.log('Patch aplicado: hardening visual sem mexer em resultados.');
