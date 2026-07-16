const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'www', 'index.html');
let html = fs.readFileSync(file, 'utf8');
if (html.includes('RAD_CLOSE_BUTTONS_V12')) process.exit(0);

const style = `
<style id="RAD_CLOSE_BUTTONS_V12">
.rad-close-x{position:sticky;top:8px;float:right;z-index:200;width:44px;height:44px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:#090909;color:#fff;font-size:28px;font-weight:900;line-height:1;display:grid;place-items:center;box-shadow:0 10px 24px rgba(0,0,0,.55)}
.rad-close-x:active{transform:scale(.94)}
.rad-rpm-editor,.rad-tach-adjust-panel,.rad-tach-select-panel,.rad-budget-modal,.rad-modal,.rad-extra-actions,.rad-set-hub{position:relative!important}
.rad-rpm-editor .rad-close-x,.rad-tach-adjust-panel .rad-close-x,.rad-tach-select-panel .rad-close-x{position:absolute;right:12px;top:10px;float:none}
</style>`;

const script = `
<script id="RAD_CLOSE_BUTTONS_V12">
(function(){
  function closeTarget(panel){
    if(!panel)return;
    if(panel.classList.contains('show')) panel.classList.remove('show');
    var overlay = panel.closest('.show');
    if(overlay) overlay.classList.remove('show');
    panel.style.display = '';
  }
  function addClose(panel){
    if(!panel || panel.dataset.radCloseAdded === '1') return;
    panel.dataset.radCloseAdded = '1';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rad-close-x';
    btn.textContent = '×';
    btn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      if(panel.id === 'radRpmEditor' || panel.id === 'radTachAdjustPanel' || panel.id === 'radTachSelectPanel') panel.classList.remove('show');
      else {
        var showParent = panel.closest('.show');
        if(showParent) showParent.classList.remove('show');
        else panel.classList.remove('show');
      }
    }, true);
    panel.insertBefore(btn, panel.firstChild);
  }
  function scan(){
    var selectors = [
      '#radRpmEditor',
      '#radTachAdjustPanel',
      '#radTachSelectPanel',
      '.rad-budget-modal',
      '.rad-modal',
      '.rad-extra-actions',
      '.rad-set-hub'
    ];
    selectors.forEach(function(sel){
      document.querySelectorAll(sel).forEach(addClose);
    });
  }
  document.addEventListener('DOMContentLoaded', scan);
  window.addEventListener('load', scan);
  setTimeout(scan, 500);
  setInterval(scan, 1000);
})();
</script>`;

html = html.replace('</head>', style + '\n</head>');
html = html.replace('</body>', script + '\n</body>');
fs.writeFileSync(file, html, 'utf8');
console.log('Patch aplicado: botões fechar em janelas.');
