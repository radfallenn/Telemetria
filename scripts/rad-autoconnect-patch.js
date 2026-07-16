const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'www', 'index.html');
let html = fs.readFileSync(file, 'utf8');

if (html.includes('RAD_AUTO_CONNECT_V2')) {
  console.log('RAD_AUTO_CONNECT_V2 já aplicado.');
  process.exit(0);
}

const script = `
<script id="RAD_AUTO_CONNECT_V2">
(function(){
  let radAutoTimer = null;
  let radTrying = false;
  let radWakeLock = null;

  function text(id){
    const el = document.getElementById(id);
    return ((el && el.textContent) || '').toUpperCase();
  }

  function disconnected(){
    const s = text('statusText');
    return !s || s.includes('DESCONECTADO') || s.includes('FECHADO') || s.includes('FALHA') || s.includes('ERRO') || s.includes('OFF');
  }

  async function keepScreenOn(){
    try{
      if ('wakeLock' in navigator && document.visibilityState === 'visible' && !radWakeLock) {
        radWakeLock = await navigator.wakeLock.request('screen');
        radWakeLock.addEventListener('release',()=>{ radWakeLock = null; });
      }
    }catch(e){}
  }

  function tryConnect(){
    if (radTrying) return;
    if (typeof window.connect !== 'function' && typeof connect !== 'function') return;
    if (!disconnected()) return;
    radTrying = true;
    Promise.resolve()
      .then(()=> (typeof window.connect === 'function' ? window.connect() : connect()))
      .catch(()=>{})
      .finally(()=>{ setTimeout(()=>{ radTrying = false; }, 900); });
  }

  function startAutoConnect(){
    keepScreenOn();
    setTimeout(tryConnect, 400);
    setTimeout(tryConnect, 1500);
    if (radAutoTimer) clearInterval(radAutoTimer);
    radAutoTimer = setInterval(()=>{
      keepScreenOn();
      tryConnect();
    }, 2500);
  }

  window.radStartAutoConnect = startAutoConnect;

  document.addEventListener('DOMContentLoaded', startAutoConnect);
  window.addEventListener('load', startAutoConnect);
  window.addEventListener('focus', startAutoConnect);
  window.addEventListener('online', startAutoConnect);
  document.addEventListener('visibilitychange', ()=>{
    if (document.visibilityState === 'visible') startAutoConnect();
  });

  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
    try {
      window.Capacitor.Plugins.App.addListener('resume', startAutoConnect);
      window.Capacitor.Plugins.App.addListener('appStateChange', state => {
        if (state && state.isActive) startAutoConnect();
      });
    } catch(e) {}
  }

  startAutoConnect();
})();
</script>`;

html = html.replace('</body>', script + '\n</body>');
fs.writeFileSync(file, html, 'utf8');
console.log('Patch aplicado: auto conectar ao abrir, reconectar ao voltar do minimizado e manter conexão viva.');
