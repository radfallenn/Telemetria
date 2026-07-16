const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'www', 'index.html');
let html = fs.readFileSync(file, 'utf8');
if (html.includes('RAD_FINAL_NAV_FIX_V11')) process.exit(0);

const style = `
<style id="RAD_FINAL_NAV_FIX_V11">
.live-center{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;width:0!important;height:0!important;overflow:hidden!important}
.bottom-nav{display:grid!important;grid-template-columns:repeat(4,1fr)!important;align-items:stretch!important;height:70px!important;gap:0!important;padding:0 8px!important}
.bottom-nav .tab-btn,.bottom-nav .rad-final-tab{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:5px!important;background:transparent!important;border:0!important;color:#eff6ff!important;font-size:9px!important;font-weight:900!important;position:relative!important;height:100%!important;min-width:0!important}
.bottom-nav .tab-btn.active:after,.bottom-nav .rad-final-tab.active:after{content:"";position:absolute;bottom:9px;left:18px;right:18px;height:4px;border-radius:99px;background:var(--red,#ff315e)}
.rad-final-icon{font-size:24px!important;line-height:1!important}.rad-final-label{font-size:9px!important;font-weight:900!important;color:#eff6ff!important}
.rad-session-wait,.rad-lap-badge{display:none!important;visibility:hidden!important;opacity:0!important}
</style>`;

const script = `
<script id="RAD_FINAL_NAV_FIX_V11">
(function(){
  function openSet(){
    if (typeof window.radOpenSetHub === 'function') { window.radOpenSetHub(); return; }
    var hub = document.getElementById('radSetHub');
    if (hub) hub.classList.add('show');
  }
  function make(label, icon, active, fn){
    var b=document.createElement('button');
    b.type='button';
    b.className='rad-final-tab'+(active?' active':'');
    var i=document.createElement('div'); i.className='rad-final-icon'; i.textContent=icon;
    var l=document.createElement('div'); l.className='rad-final-label'; l.textContent=label;
    b.appendChild(i); b.appendChild(l);
    b.addEventListener('click', function(e){ if(fn){ e.preventDefault(); e.stopPropagation(); fn(); } }, true);
    return b;
  }
  function showPage(id){
    document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active')});
    var p=document.getElementById(id); if(p) p.classList.add('active');
  }
  function clean(){
    document.querySelectorAll('.live-center').forEach(function(e){e.remove()});
    document.querySelectorAll('.rad-session-wait,.rad-lap-badge').forEach(function(e){e.remove()});
    var nav=document.querySelector('.bottom-nav'); if(!nav) return;
    if(nav.dataset.radFinalV11==='1') return;
    nav.dataset.radFinalV11='1';
    while(nav.firstChild) nav.removeChild(nav.firstChild);
    nav.appendChild(make('DASH','▦',true,function(){showPage('dashboardPage')}));
    nav.appendChild(make('VOLTAS','⏱',false,function(){showPage('dashboardPage')}));
    nav.appendChild(make('INFO','▤',false,function(){showPage('infoPage')}));
    nav.appendChild(make('SET','⚙',false,openSet));
  }
  document.addEventListener('DOMContentLoaded', clean);
  window.addEventListener('load', clean);
  setTimeout(clean,300);
  setInterval(clean,1000);
})();
</script>`;

html = html.replace('</head>', style + '\n</head>');
html = html.replace('</body>', script + '\n</body>');
fs.writeFileSync(file, html, 'utf8');
console.log('Patch final aplicado: remove live-center e força SET.');
