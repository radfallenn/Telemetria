const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'www', 'index.html');
let html = fs.readFileSync(file, 'utf8');

if (html.includes('RAD_REMOVE_LIVE_WAIT_V9')) {
  console.log('RAD_REMOVE_LIVE_WAIT_V9 já aplicado.');
  process.exit(0);
}

const style = `
<style id="RAD_REMOVE_LIVE_WAIT_V9">
/* v9: remove definitivamente Ao Vivo e textos de espera/registros */
.bottom-nav .live,.bottom-nav .center,.bottom-nav .nav-live,.bottom-nav [data-tab="live"],.bottom-nav [data-label="live"],.bottom-nav .rad-stable-hidden-live{display:none!important;visibility:hidden!important;pointer-events:none!important;opacity:0!important;width:0!important;min-width:0!important;max-width:0!important;padding:0!important;margin:0!important;overflow:hidden!important}
.bottom-nav button,.bottom-nav a,.bottom-nav>div{display:flex!important;flex:1 1 0!important;min-width:0!important;align-items:center!important;justify-content:center!important}
.bottom-nav button:has(*),.bottom-nav a:has(*),.bottom-nav>div:has(*){display:flex!important}
.bottom-nav{grid-template-columns:repeat(4,1fr)!important}
.rad-session-wait,.rad-lap-badge{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}
</style>`;

const script = `
<script id="RAD_REMOVE_LIVE_WAIT_V9">
(function(){
  function isLive(el){return ((el.textContent||'').toUpperCase().includes('AO VIVO')) || el.classList.contains('live') || el.classList.contains('center') || el.classList.contains('nav-live') || el.dataset.tab==='live'}
  function cleanNav(){
    const nav=document.querySelector('.bottom-nav');
    if(!nav)return;
    [...nav.children].forEach(el=>{if(isLive(el)){el.remove();}});
    const items=[...nav.children].filter(el=>!isLive(el));
    const labels=['DASH','VOLTAS','INFO','SET'];
    const icons=['▦','⏱','▤','⚙'];
    items.slice(0,4).forEach((el,i)=>{
      el.style.display='flex';
      el.style.flex='1 1 0';
      el.style.minWidth='0';
      if(!el.dataset.radFinalNav){
        el.dataset.radFinalNav='1';
        el.innerHTML='<div class="rad-nav-fixed-icon">'+icons[i]+'</div><div class="rad-nav-fixed-label">'+labels[i]+'</div>';
      }
    });
    items.slice(4).forEach(el=>el.remove());
  }
  function removeWaitTexts(){
    document.querySelectorAll('.rad-session-wait,.rad-lap-badge').forEach(e=>e.remove());
    [...document.querySelectorAll('.card *')].forEach(el=>{
      const t=(el.textContent||'').toUpperCase();
      if(t.includes('AGUARDANDO CORRIDA') || t.includes('REGISTROS')) el.remove();
    });
  }
  function boot(){cleanNav();removeWaitTexts();}
  document.addEventListener('DOMContentLoaded',boot);
  window.addEventListener('load',boot);
  setTimeout(boot,400);
  setInterval(boot,1200);
})();
</script>`;

html = html.replace('</head>', style + '\n</head>');
html = html.replace('</body>', script + '\n</body>');
fs.writeFileSync(file, html, 'utf8');
console.log('Patch aplicado: remove Ao Vivo e aguardando registro.');
