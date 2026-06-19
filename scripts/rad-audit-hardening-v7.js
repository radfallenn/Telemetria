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
/* Auditoria v7: remove botões flutuantes antigos da área de toque, estabiliza nav e evita sobreposição */
.rad-more-actions-btn,.rad-rpm-quick,.rad-tach-quick,.rad-budget-open,.rad-card-designer-open{display:none!important;pointer-events:none!important;opacity:0!important}
.bottom-nav{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:0!important;overflow:hidden!important}
.bottom-nav button,.bottom-nav a,.bottom-nav>div{min-width:0!important}
.bottom-nav *{user-select:none}
.rad-set-hub-overlay,.rad-extra-actions-overlay,.rad-rpm-editor,.rad-budget-overlay,.rad-modal-backdrop,.rad-tach-adjust-panel{overscroll-behavior:contain}
.rad-lap-badge{pointer-events:none!important}
.card input,.card select,.card button{cursor:auto!important}
.rad-card-copy-flash{transition:outline .15s ease,box-shadow .15s ease}
</style>`;

const script = `
<script id="RAD_AUDIT_HARDENING_V7">
(function(){
  const $ = id => document.getElementById(id);
  let lastSavedHash = '';

  function readJSON(key, fallback){
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch(e){ return fallback; }
  }

  function getLapRecords(){
    const records = readJSON('gt7_lap_records_v4', []);
    return Array.isArray(records) ? records.filter(x => x && Number.isFinite(Number(x.ms))) : [];
  }

  function setCorrectedLapsSafe(){
    const records = getLapRecords();
    const corrected = Math.max(0, records.length - 1);
    const el = $('correctedLaps');
    if (el && String(el.textContent).trim() !== String(corrected)) {
      el.dataset.radAuditLock = '1';
      el.textContent = String(corrected);
      setTimeout(()=>{ el.dataset.radAuditLock = '0'; }, 0);
    }
    document.querySelectorAll('.rad-lap-badge').forEach(b => b.textContent = 'REGISTROS ' + records.length);
  }

  function preventSelfDecrement(){
    const el = $('correctedLaps');
    if (!el || el.dataset.radAuditWatch === '1') return;
    el.dataset.radAuditWatch = '1';
    new MutationObserver(()=>setTimeout(setCorrectedLapsSafe, 20)).observe(el,{childList:true,characterData:true,subtree:true});
  }

  function hideLiveButton(){
    document.querySelectorAll('.bottom-nav button,.bottom-nav a,.bottom-nav>div').forEach(el=>{
      const t = (el.textContent || '').toUpperCase();
      if (t.includes('AO VIVO')) el.style.display = 'none';
    });
  }

  function strengthenSet(){
    const nav = document.querySelector('.bottom-nav');
    if (!nav) return;
    const candidates = [...nav.querySelectorAll('button,a,div')];
    const setBtn = candidates.find(el => (el.textContent || '').toUpperCase().includes('SET')) || candidates[candidates.length - 1];
    if (setBtn && setBtn.dataset.radAuditSet !== '1') {
      setBtn.dataset.radAuditSet = '1';
      setBtn.addEventListener('click', e => {
        if (typeof window.radOpenSetHub === 'function') {
          e.preventDefault();
          e.stopPropagation();
          window.radOpenSetHub();
        } else {
          const hub = document.getElementById('radSetHub');
          if (hub) {
            e.preventDefault();
            e.stopPropagation();
            hub.classList.add('show');
          }
        }
      }, true);
    }
  }

  function exposeSetHub(){
    if (typeof window.radOpenSetHub !== 'function') {
      window.radOpenSetHub = function(){
        const hub = document.getElementById('radSetHub');
        if (hub) hub.classList.add('show');
      };
    }
  }

  function dedupeSavedSections(){
    const list = readJSON('gt7_saved_sections', []);
    if (!Array.isArray(list) || !list.length) return;
    const seen = new Set();
    const clean = [];
    for (const item of list) {
      const hash = [item.best,item.last,item.total,item.avg,item.laps,item.max].join('|');
      if (seen.has(hash)) continue;
      seen.add(hash);
      clean.push(item);
    }
    const newHash = JSON.stringify(clean.slice(0,100));
    if (newHash !== lastSavedHash) {
      lastSavedHash = newHash;
      localStorage.setItem('gt7_saved_sections', newHash);
    }
  }

  function repairCardsCopy(){
    document.querySelectorAll('.card').forEach(card => {
      if (card.dataset.radAuditCopy === '1') return;
      card.dataset.radAuditCopy = '1';
      card.addEventListener('click', e => {
        if (e.target.closest('button,input,select,textarea,a,.bottom-nav,.rad-set-hub-overlay,.rad-extra-actions-overlay')) return;
      }, true);
    });
  }

  function boot(){
    exposeSetHub();
    hideLiveButton();
    strengthenSet();
    preventSelfDecrement();
    setCorrectedLapsSafe();
    dedupeSavedSections();
    repairCardsCopy();
  }

  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('load', boot);
  setTimeout(boot, 800);
  setInterval(boot, 2000);
})();
</script>`;

html = html.replace('</head>', style + '\n</head>');
html = html.replace('</body>', script + '\n</body>');
fs.writeFileSync(file, html, 'utf8');
console.log('Patch aplicado: auditoria e hardening v7.');
