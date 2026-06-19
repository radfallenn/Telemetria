const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'www', 'index.html');
let html = fs.readFileSync(file, 'utf8');
if (html.includes('RAD_FORCE_SET_NAV_V10')) process.exit(0);

const style = `
<style id="RAD_FORCE_SET_NAV_V10">
.bottom-nav{display:grid!important;grid-template-columns:repeat(4,1fr)!important;gap:0!important;min-height:86px!important;padding:0 8px!important}
.bottom-nav .rad-final-nav-item{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:6px!important;background:transparent!important;border:0!important;color:#fff!important;font-weight:900!important;position:relative!important}
.rad-final-nav-icon{font-size:25px!important}.rad-final-nav-label{font-size:11px!important}.rad-final-nav-item.active:after{content:"";position:absolute;left:22%;right:22%;bottom:8px;height:5px;border-radius:999px;background:#ff315e}
</style>`;

const script = `
<script id="RAD_FORCE_SET_NAV_V10">
(function(){
  function openSet(){
    if (typeof window.radOpenSetHub === 'function') { window.radOpenSetHub(); return; }
    var hub = document.getElementById('radSetHub');
    if (hub) hub.classList.add('show');
  }
  function button(label, icon, active){
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
    return b;
  }
  function rebuild(){
    var nav = document.querySelector('.bottom-nav');
    if (!nav || document.getElementById('radFinalSetButton')) return;
    while (nav.firstChild) nav.removeChild(nav.firstChild);
    var dash = button('DASH','▦',true);
    var laps = button('VOLTAS','⏱',false);
    var info = button('INFO','▤',false);
    var set = button('SET','⚙',false);
    set.id = 'radFinalSetButton';
    set.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); openSet(); }, true);
    nav.appendChild(dash); nav.appendChild(laps); nav.appendChild(info); nav.appendChild(set);
  }
  document.addEventListener('DOMContentLoaded', rebuild);
  window.addEventListener('load', rebuild);
  setTimeout(rebuild, 500);
  setInterval(rebuild, 1500);
})();
</script>`;

html = html.replace('</head>', style + '\n</head>');
html = html.replace('</body>', script + '\n</body>');
fs.writeFileSync(file, html, 'utf8');
console.log('Patch aplicado: SET forçado na barra inferior.');
