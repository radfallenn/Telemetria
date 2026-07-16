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
.rad-clock-needle,.rad-needle{display:none!important;opacity:0!important;visibility:hidden!important}
.rad-tach-arc{background:conic-gradient(from 222deg,rgba(255,255,255,.05) 0 8deg,#ff2b2b 9deg var(--rad-rpm-deg,40deg),rgba(255,255,255,.06) var(--rad-rpm-deg,40deg) 178deg,transparent 179deg 360deg)!important;animation:radRedGrow 1.15s linear infinite!important;filter:drop-shadow(0 0 12px #ff2020)!important}
.rad-tach-arc:after{content:"";position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 222deg,transparent 0 calc(var(--rad-rpm-deg,40deg) - 8deg),#ffefef calc(var(--rad-rpm-deg,40deg) - 7deg) var(--rad-rpm-deg,40deg),transparent calc(var(--rad-rpm-deg,40deg) + 1deg) 360deg);-webkit-mask:inherit;mask:inherit;filter:drop-shadow(0 0 12px #ff2020)}
@keyframes radRedGrow{0%{filter:drop-shadow(0 0 6px #ff2020)}50%{filter:drop-shadow(0 0 22px #ff2020)}100%{filter:drop-shadow(0 0 6px #ff2020)}}
.rad-tach-number{font-size:13px!important}
.rad-rpm-live-dot{position:absolute;width:8px;height:8px;border-radius:50%;background:#ffefef;box-shadow:0 0 18px #ff2020,0 0 6px #fff;left:50%;top:50%;transform:rotate(var(--rad-rpm-deg,40deg)) translateX(82px);transform-origin:0 0;z-index:9;pointer-events:none}
.rad-lap-badge,.rad-session-wait{display:none!important}
</style>`;

const script = `
<script id="RAD_FIX_RPM_LAPS_AUTOCONNECT_V4">
(function(){
  const $ = id => document.getElementById(id);
  function ensureDot(){
    const h=document.querySelector('.hero');
    if(h && !h.querySelector('.rad-rpm-live-dot')){
      const d=document.createElement('div');
      d.className='rad-rpm-live-dot';
      h.appendChild(d);
    }
  }
  function rpmNum(){
    return parseInt((($('rpmSide')&&$('rpmSide').textContent)||'0').replace(/[^0-9]/g,''),10)||0;
  }
  function updateRpm(){
    const rpm=rpmNum();
    const deg=Math.max(6,Math.min(178,Math.round((rpm/10000)*178)));
    document.documentElement.style.setProperty('--rad-rpm-deg',deg+'deg');
    ensureDot();
  }
  function watchRpm(){
    const r=$('rpmSide');
    if(r && !r.dataset.radFixRpmWatch){
      r.dataset.radFixRpmWatch='1';
      new MutationObserver(updateRpm).observe(r,{childList:true,characterData:true,subtree:true});
    }
  }
  function boot(){
    ensureDot();
    watchRpm();
    updateRpm();
  }
  document.addEventListener('DOMContentLoaded',boot);
  window.addEventListener('load',boot);
  setInterval(boot,2500);
})();
</script>`;

html = html.replace('</head>', style + '\n</head>');
html = html.replace('</body>', script + '\n</body>');
fs.writeFileSync(file, html, 'utf8');
console.log('Patch aplicado: RPM visual sem auto conectar e sem alterar voltas.');
