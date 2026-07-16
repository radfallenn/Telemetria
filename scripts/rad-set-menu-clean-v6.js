const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'www', 'index.html');
let html = fs.readFileSync(file, 'utf8');

if (html.includes('RAD_SET_MENU_CLEAN_V6')) {
  console.log('RAD_SET_MENU_CLEAN_V6 já aplicado.');
  process.exit(0);
}

const style = `
<style id="RAD_SET_MENU_CLEAN_V6">
.rad-more-actions-btn,.rad-rpm-quick,.rad-tach-quick,.rad-budget-open,.rad-card-designer-open{display:none!important}
.bottom-nav .live,.bottom-nav .center,.bottom-nav .nav-live,.bottom-nav [data-tab="live"],.bottom-nav button:has(.ao-vivo),.bottom-nav button:has(.live){display:none!important}
.bottom-nav{grid-template-columns:repeat(4,1fr)!important}.bottom-nav::before,.bottom-nav::after{display:none!important}
.rad-set-hub-overlay{position:fixed;inset:0;background:rgba(0,0,0,.58);backdrop-filter:blur(8px);z-index:110;display:none;align-items:flex-end;justify-content:center}.rad-set-hub-overlay.show{display:flex}.rad-set-hub{width:min(100% - 24px,430px);max-height:82vh;overflow:auto;background:linear-gradient(180deg,#111214,#070707);border:1px solid #242424;border-radius:24px 24px 0 0;padding:18px;color:#fff;box-shadow:0 -18px 48px rgba(0,0,0,.75)}.rad-set-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}.rad-set-head b{font-size:16px;letter-spacing:.08em}.rad-set-close{width:42px;height:42px;border:0;background:transparent;color:#aaa;font-size:34px}.rad-set-grid{display:grid;grid-template-columns:1fr;gap:12px}.rad-set-action{min-height:64px;border-radius:18px;border:1px solid rgba(255,255,255,.14);background:#0b0b0c;color:#fff;display:grid;grid-template-columns:46px 1fr;gap:12px;align-items:center;text-align:left;padding:12px 14px;font-weight:900}.rad-set-action i{font-style:normal;font-size:28px}.rad-set-action span{display:block;color:#bfcbd8;font-size:12px;margin-top:4px;line-height:1.25}.rad-set-action.teal{background:linear-gradient(135deg,rgba(0,220,255,.38),#07131b)}.rad-set-action.pink{background:linear-gradient(135deg,rgba(255,42,109,.55),#1c0610)}.rad-set-action.orange{background:linear-gradient(135deg,rgba(255,122,24,.42),#130b04)}.rad-set-action.blue{background:linear-gradient(135deg,rgba(47,128,255,.42),#060d1c)}.rad-set-action.dark{background:linear-gradient(135deg,rgba(255,255,255,.12),#050505)}
</style>`;

const script = `
<script id="RAD_SET_MENU_CLEAN_V6">
(function(){
 const $=id=>document.getElementById(id);
 function openHub(){ensureHub();$('radSetHub')?.classList.add('show')}
 function closeHub(){$('radSetHub')?.classList.remove('show')}
 function clickHidden(selector){const el=document.querySelector(selector); if(el) el.click();}
 function openExtra(){clickHidden('.rad-more-actions-btn')}
 function openRpm(){clickHidden('.rad-rpm-quick')}
 function openTach(){clickHidden('.rad-tach-quick')}
 function openBudget(){clickHidden('.rad-budget-open')}
 function openDesigner(){clickHidden('.rad-card-designer-open')}
 function zero(){if(window.radZeroCurrentSection)window.radZeroCurrentSection();else clickHidden('#radExtraStart')}
 function save(){if(window.radSaveCurrentSection)window.radSaveCurrentSection();else clickHidden('#radExtraSave')}
 function ensureHub(){
   if($('radSetHub'))return;
   const hub=document.createElement('div');
   hub.id='radSetHub';
   hub.className='rad-set-hub-overlay';
   hub.innerHTML='<div class="rad-set-hub"><div class="rad-set-head"><b>SET</b><button class="rad-set-close" id="radSetClose">×</button></div><div class="rad-set-grid"><button class="rad-set-action teal" id="setZero"><i>🧹</i><div>ZERAR TUDO<span>Zera a seção atual sem apagar Seções Salvas</span></div></button><button class="rad-set-action pink" id="setSave"><i>💾</i><div>SALVAR SEÇÃO<span>Salva os resultados atuais localmente</span></div></button><button class="rad-set-action orange" id="setRpm"><i>◌</i><div>EDITAR CONTA-GIROS<span>Animação, números, brilho e arco</span></div></button><button class="rad-set-action blue" id="setTach"><i>◴</i><div>MODELO DO CONTA-GIROS<span>Trocar original e estilos visuais</span></div></button><button class="rad-set-action dark" id="setCards"><i>▣</i><div>CUSTOMIZAÇÃO DO APP<span>Layout, campos, temas e cards</span></div></button><button class="rad-set-action dark" id="setDesigner"><i>⚙</i><div>DESIGNER DO CARD<span>Arredondamento, espaçamento e fields</span></div></button></div></div>';
   document.body.appendChild(hub);
   $('radSetClose').onclick=closeHub;
   hub.addEventListener('click',e=>{if(e.target===hub)closeHub()});
   $('setZero').onclick=()=>{zero();closeHub()};
   $('setSave').onclick=()=>{save();closeHub()};
   $('setRpm').onclick=()=>{closeHub();setTimeout(openRpm,80)};
   $('setTach').onclick=()=>{closeHub();setTimeout(openTach,80)};
   $('setCards').onclick=()=>{closeHub();setTimeout(openBudget,80)};
   $('setDesigner').onclick=()=>{closeHub();setTimeout(openDesigner,80)};
 }
 function patchSetButton(){
   const candidates=[...document.querySelectorAll('button,a,div')].filter(e=>{const t=(e.textContent||'').trim().toUpperCase();return t==='SET'||t.endsWith('SET')||e.id?.toLowerCase().includes('set')});
   const btn=candidates.find(e=>e.closest('.bottom-nav'))||candidates.find(e=>(e.textContent||'').toUpperCase().includes('SET'));
   if(btn&&!btn.dataset.radSetHub){btn.dataset.radSetHub='1';btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openHub()},true)}
 }
 function removeLive(){
   [...document.querySelectorAll('.bottom-nav button,.bottom-nav a,.bottom-nav div')].forEach(e=>{const t=(e.textContent||'').toUpperCase();if(t.includes('AO VIVO'))e.style.display='none'});
 }
 function boot(){ensureHub();patchSetButton();removeLive();setInterval(()=>{patchSetButton();removeLive()},2000)}
 document.addEventListener('DOMContentLoaded',boot);setTimeout(boot,800);
})();
</script>`;

html = html.replace('</head>', style + '\n</head>');
html = html.replace('</body>', script + '\n</body>');
fs.writeFileSync(file, html, 'utf8');
console.log('Patch aplicado: botões dentro de Set e Ao Vivo removido.');
