const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'www', 'index.html');
let html = fs.readFileSync(file, 'utf8');

if (html.includes('RAD_PERSISTENT_CACHE_V1')) {
  console.log('RAD_PERSISTENT_CACHE_V1 já aplicado.');
  process.exit(0);
}

const script = `
<script id="RAD_PERSISTENT_CACHE_V1">
(function(){
  const IDS = [
    'speed','gear','maxSpeed','rpmSide','fuelSide','throttleVal','brakeVal',
    'bestLapCard','lastLapCard','totalTimeCard','avgTimeCard','correctedLaps',
    'statusText','connectionChip'
  ];
  const KEY = 'gt7_screen_cache_v1';
  let restoring = false;

  function el(id){ return document.getElementById(id); }

  function read(){
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch(e){ return {}; }
  }

  function write(data){
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function valueIsEmpty(v){
    const s = String(v || '').trim();
    return !s || s === '--' || s === '- -' || s === '0' || s === '0%' || s === 'DESCONECTADO\nAO BRIDGE';
  }

  function restore(){
    restoring = true;
    const data = read();
    IDS.forEach(id => {
      const node = el(id);
      if (!node || data[id] === undefined) return;
      const current = node.textContent;
      if (valueIsEmpty(current) || id === 'connectionChip') node.textContent = data[id];
    });
    restoring = false;
  }

  function save(){
    if (restoring) return;
    const data = read();
    IDS.forEach(id => {
      const node = el(id);
      if (!node) return;
      const txt = node.textContent.trim();
      if (!valueIsEmpty(txt)) data[id] = txt;
    });
    data.updatedAt = new Date().toISOString();
    write(data);
  }

  function watch(){
    IDS.forEach(id => {
      const node = el(id);
      if (!node || node.dataset.radCacheWatch === '1') return;
      node.dataset.radCacheWatch = '1';
      new MutationObserver(save).observe(node,{childList:true,characterData:true,subtree:true,attributes:true});
    });
  }

  function clearCache(){
    if (!confirm('Apagar informações salvas da tela?')) return;
    localStorage.removeItem(KEY);
    localStorage.removeItem('gt7_current_session');
    localStorage.removeItem('gt7_laps');
    ['bestLapCard','lastLapCard','totalTimeCard','avgTimeCard','correctedLaps'].forEach(id=>{ if(el(id)) el(id).textContent='--'; });
    if(el('maxSpeed')) el('maxSpeed').textContent='0';
    if(el('speed')) el('speed').textContent='0';
    alert('Cache apagado pelo usuário.');
  }

  function addClearButton(){
    if (document.getElementById('radClearScreenCache')) return;
    const target = document.querySelector('.actions') || document.querySelector('.cards') || document.body;
    const btn = document.createElement('button');
    btn.id = 'radClearScreenCache';
    btn.textContent = 'LIMPAR CACHE DA TELA';
    btn.style.cssText = 'width:100%;min-height:44px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:#111;color:#fff;font-weight:900;margin-top:10px;';
    btn.onclick = clearCache;
    target.insertAdjacentElement(target.classList && target.classList.contains('cards') ? 'afterend' : 'beforeend', btn);
  }

  function boot(){
    restore();
    watch();
    addClearButton();
    setInterval(()=>{ watch(); save(); }, 3000);
    window.addEventListener('beforeunload', save);
    document.addEventListener('visibilitychange', save);
  }

  document.addEventListener('DOMContentLoaded', boot);
  setTimeout(boot, 700);
})();
</script>`;

html = html.replace('</body>', script + '\n</body>');
fs.writeFileSync(file, html, 'utf8');
console.log('Patch aplicado: cache persistente da tela, apagado apenas pelo usuário.');
