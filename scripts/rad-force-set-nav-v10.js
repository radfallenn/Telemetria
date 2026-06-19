const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'www', 'index.html');
let html = fs.readFileSync(file, 'utf8');
if (html.includes('RAD_FORCE_SET_NAV_V10')) process.exit(0);

const style = `
<style id="RAD_FORCE_SET_NAV_V10">
.live-center{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;width:0!important;height:0!important;overflow:hidden!important}
.bottom-nav{display:grid!important;grid-template-columns:repeat(4,1fr)!important;gap:0!important;min-height:86px!important;padding:0 8px!important}
.bottom-nav .rad-final-nav-item{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:6px!important;background:transparent!important;border:0!important;color:#fff!important;font-weight:900!important;position:relative!important}
.rad-final-nav-icon{font-size:25px!important}.rad-final-nav-label{font-size:11px!important}.rad-final-nav-item.active:after{content:"";position:absolute;left:22%;right:22%;bottom:8px;height:5px;border-radius:999px;background:#ff315e}
.rad-session-wait,.rad-lap-badge{display:none!important;visibility:hidden!important;opacity:0!important}
</style>`;

const script = `
<script id="RAD_FORCE_SET_NAV_V10">
(function(){
  function openSet(){
    if (typeof window.radOpenSetHub === 'function') { window.radOpenSetHub(); return; }
    var hub = document.getElementById('radSetHub');
    if (hub) hub.classList.add('show');
  }
  function showPage(id){
    var pages = document.querySelectorAll('.page');
    for (var p=0;p<pages.length;p++) pages[p].classList.remove('active');
    var page = document.getElementById(id);
    if (page) page.classList.add('active');
  }
  function button(label, icon, active, fn){
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'rad-final-nav-item' + (active ? ' active' : '');
    var i = document.createElement('div');
    i.className = 'rad-final-nav-icon';
    i.textContent = icon;
    var l = document.createElement('div');
    l.className = 'rad-final-nav-label';
    l.textContent = label;
    b.appendChild(i); b.appendChild(l);
    b.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); if(fn) fn(); }, true);
    return b;
  }
  function rebuild(){
    var live = document.querySelectorAll('.live-center');
    for (var x=0;x<live.length;x++) live[x].remove();
    var waits = document.querySelectorAll('.rad-session-wait,.rad-lap-badge');
    for (var w=0;w<waits.length;w++) waits[w].remove();
    var nav = document.querySelector('.bottom-nav');
    if (!nav) return;
    if (document.getElementById('radFinalSetButton') && !document.querySelector('.live-center')) return;
    while (nav.firstChild) nav.removeChild(nav.firstChild);
    nav.appendChild(button('DASH','▦',true,function(){showPage('dashboardPage')}));
    nav.appendChild(button('VOLTAS','⏱',false,function(){showPage('dashboardPage')}));
    nav.appendChild(button('INFO','▤',false,function(){showPage('infoPage')}));
    var set = button('SET','⚙',false,openSet);
    set.id = 'radFinalSetButton';
    nav.appendChild(set);
  }
  document.addEventListener('DOMContentLoaded', rebuild);
  window.addEventListener('load', rebuild);
  setTimeout(rebuild, 500);
  setInterval(rebuild, 1000);
})();
</script>`;

html = html.replace('</head>', style + '\n</head>');
html = html.replace('</body>', script + '\n</body>');
fs.writeFileSync(file, html, 'utf8');
console.log('Patch aplicado: SET forçado, live-center removido e registros ocultos.');
