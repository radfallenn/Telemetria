const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'www', 'index.html');
let html = fs.readFileSync(file, 'utf8');

if (html.includes('RAD_CUSTOMIZER_V1')) {
  console.log('RAD_CUSTOMIZER_V1 já aplicado.');
  process.exit(0);
}

const style = `
<style id="RAD_CUSTOMIZER_STYLE_V1">
:root{--rad-radius:12px;--rad-gap:12px;--rad-line:8px;--rad-compact:0}
.card{border-radius:var(--rad-radius)!important;margin-bottom:calc(var(--rad-gap) * .18)!important}.cards{gap:var(--rad-gap)!important}.val{line-height:calc(1.1 + var(--rad-line) / 40)!important}.rad-compact-on .card{min-height:70px!important;padding:8px!important}.rad-compact-on .sub{display:none}.rad-compact-on .title{font-size:9px!important}.rad-compact-on .val{font-size:17px!important;margin-top:5px!important}
.rad-card-designer-open{position:fixed;right:18px;bottom:calc(120px + env(safe-area-inset-bottom));z-index:30;width:52px;height:52px;border-radius:16px;border:1px solid rgba(255,255,255,.18);background:linear-gradient(145deg,#1c2634,#070b12);color:#fff;font-size:24px;box-shadow:0 16px 30px rgba(0,0,0,.55)}
.rad-modal-backdrop{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.38);backdrop-filter:blur(10px);display:none;align-items:flex-end;justify-content:center}.rad-modal-backdrop.show{display:flex}.rad-modal{width:min(100% - 32px,430px);max-height:82vh;overflow:auto;border-radius:28px 28px 0 0;background:#1d1d1f;border:1px solid rgba(255,255,255,.12);box-shadow:0 -18px 60px rgba(0,0,0,.7);color:#fff}.rad-modal-head{height:96px;display:flex;align-items:center;justify-content:space-between;padding:0 26px;border-bottom:1px solid rgba(255,255,255,.12)}.rad-modal-title{font-size:24px;font-weight:900}.rad-modal-close{width:42px;height:42px;border:0;background:transparent;color:#aaa;font-size:36px}.rad-seg{margin:12px 16px 0;border-radius:19px;background:#111214;border:1px solid rgba(255,255,255,.09);display:grid;grid-template-columns:1fr 1fr;padding:5px}.rad-seg button{height:48px;border:0;border-radius:14px;background:transparent;color:#8f8f92;font-size:13px;font-weight:900;letter-spacing:.16em}.rad-seg button.active{background:#438df2;color:white}.rad-panel{padding:28px 26px 34px;display:none}.rad-panel.active{display:block}.rad-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:30px}.rad-label{font-size:13px;font-weight:900;letter-spacing:.17em;color:#929296;text-transform:uppercase}.rad-value{font-size:16px;font-weight:900}.rad-switch{width:56px;height:32px;border:0;border-radius:999px;background:#444;position:relative}.rad-switch:before{content:"";position:absolute;width:22px;height:22px;left:5px;top:5px;border-radius:50%;background:#fff;transition:.2s}.rad-switch.on{background:#438df2}.rad-switch.on:before{left:29px}.rad-range{width:100%;accent-color:#438df2;margin:-12px 0 36px}.rad-field-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}.rad-add{height:38px;border:0;border-radius:16px;background:#438df2;color:#fff;font-weight:900;padding:0 18px}.rad-field-list{display:grid;gap:14px}.rad-field-card{border-radius:22px;background:#28282b;border:1px solid rgba(255,255,255,.12);padding:18px;display:grid;grid-template-columns:48px 1fr 74px;gap:14px;align-items:center}.rad-eye{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:#22324d;color:#5ca0ff}.rad-field-name{font-size:18px;font-weight:900}.rad-field-size{font-size:11px;color:#8f8f92;letter-spacing:.16em;font-weight:900;margin-top:14px}.rad-field-select{height:34px;border-radius:12px;background:#101010;color:#fff;border:1px solid rgba(255,255,255,.15);font-weight:900;text-align:center}.rad-tach-options{display:grid;gap:12px}.rad-tach-option{height:58px;border-radius:16px;border:1px solid rgba(255,255,255,.12);background:#242427;color:#fff;text-align:left;padding:0 18px;font-weight:900;display:flex;align-items:center;justify-content:space-between}.rad-tach-option.active{outline:2px solid #438df2}.tach-classic .rpm-ring{filter:saturate(1)}.tach-racing .rpm-ring{filter:saturate(1.6) drop-shadow(0 0 16px #ff315e)}.tach-racing .hero{background:radial-gradient(circle,#12050a 0 42%,#120d12 48%,#03060a 100%)}.tach-digital .rpm-ring{background:conic-gradient(from 222deg,#00e5ff 0deg,#008cff 140deg,#ff2eff 170deg,transparent 171deg 360deg)!important}.tach-digital .hero{border-color:rgba(0,229,255,.55);box-shadow:0 0 42px rgba(0,229,255,.20)}.tach-vintage .rpm-ring{background:conic-gradient(from 222deg,#d6d0b8 0deg,#f2c66d 118deg,#d44d32 170deg,transparent 171deg 360deg)!important}.tach-vintage .hero{filter:sepia(.22);background:radial-gradient(circle,#11100c 0 45%,#17140d 52%,#050402 100%)}.tach-minimal .rpm-ring{background:conic-gradient(from 222deg,#fff 0deg,#fff 120deg,#ff315e 170deg,transparent 171deg 360deg)!important}.tach-minimal .ticks,.tach-minimal .rad-tach-number{opacity:.45}.tach-neon .rpm-ring{background:conic-gradient(from 222deg,#18ff8f 0deg,#00e5ff 76deg,#f7ff00 126deg,#ff00a8 170deg,transparent 171deg 360deg)!important;filter:drop-shadow(0 0 18px #00e5ff)}.tach-neon .hero{box-shadow:0 0 48px rgba(255,0,168,.24),0 0 36px rgba(0,229,255,.18)}
</style>`;

const script = `
<script id="RAD_CUSTOMIZER_V1">
(function(){
  const fields=[['Brand + Car','full'],['Position','1/3'],['Setup','1/2'],['Pits','1/6'],['Melhor Volta','1/2'],['Última Volta','1/2'],['Tempo Total','1/2'],['Média de Tempo','1/2'],['Voltas Corrigidas','full']];
  const tach=[['classic','Clássico GT'],['racing','Racing Vermelho'],['digital','Digital Azul'],['vintage','Vintage Analógico'],['minimal','Minimal Branco'],['neon','Neon Studio rAd']];
  const root=document.documentElement, body=document.body;
  function save(k,v){localStorage.setItem('rad_custom_'+k,String(v))}
  function load(k,d){return localStorage.getItem('rad_custom_'+k)??d}
  function apply(){
    const compact=load('compact','0')==='1'; body.classList.toggle('rad-compact-on',compact);
    root.style.setProperty('--rad-radius',load('radius','12')+'px');
    root.style.setProperty('--rad-gap',load('gap','12')+'px');
    root.style.setProperty('--rad-line',load('line','8')+'px');
    const mode=load('tach','classic'); body.className=body.className.replace(/tach-\w+/g,'').trim(); body.classList.add('tach-'+mode);
  }
  function open(){document.getElementById('radDesigner').classList.add('show');apply();markTach()}
  function close(){document.getElementById('radDesigner').classList.remove('show')}
  function tab(n){document.querySelectorAll('.rad-seg button').forEach(b=>b.classList.toggle('active',b.dataset.tab===n));document.querySelectorAll('.rad-panel').forEach(p=>p.classList.toggle('active',p.dataset.panel===n))}
  function markTach(){document.querySelectorAll('.rad-tach-option').forEach(b=>b.classList.toggle('active',b.dataset.tach===load('tach','classic')))}
  function build(){
    if(document.getElementById('radDesigner'))return;
    const btn=document.createElement('button');btn.className='rad-card-designer-open';btn.innerHTML='⚙';btn.onclick=open;document.body.appendChild(btn);
    const m=document.createElement('div');m.id='radDesigner';m.className='rad-modal-backdrop';m.innerHTML='<div class="rad-modal"><div class="rad-modal-head"><div class="rad-modal-title">Designer do Card</div><button class="rad-modal-close" id="radClose">×</button></div><div class="rad-seg"><button class="active" data-tab="style">ESTILO E TAMANHO</button><button data-tab="fields">FIELDS</button></div><div class="rad-panel active" data-panel="style"><div class="rad-row"><div class="rad-label">Modo compacto</div><button class="rad-switch" id="radCompact"></button></div><div class="rad-row"><div class="rad-label">Arredondamento</div><div class="rad-value" id="radRadiusVal">12px</div></div><input class="rad-range" id="radRadius" type="range" min="6" max="28"><div class="rad-row"><div class="rad-label">Espaçamento</div><div class="rad-value" id="radGapVal">12px</div></div><input class="rad-range" id="radGap" type="range" min="4" max="24"><div class="rad-row"><div class="rad-label">Espaço entre linhas</div><div class="rad-value" id="radLineVal">8px</div></div><input class="rad-range" id="radLine" type="range" min="0" max="22"><div class="rad-label" style="margin-bottom:14px">Conta-giros</div><div class="rad-tach-options" id="radTachOptions"></div></div><div class="rad-panel" data-panel="fields"><div class="rad-field-head"><div class="rad-label">Layout dos campos</div><button class="rad-add">+ PERSONALIZADO</button></div><div class="rad-field-list" id="radFieldList"></div></div></div>';document.body.appendChild(m);
    document.getElementById('radClose').onclick=close;m.addEventListener('click',e=>{if(e.target===m)close()});document.querySelectorAll('.rad-seg button').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
    const c=document.getElementById('radCompact');c.onclick=()=>{save('compact',c.classList.contains('on')?'0':'1');sync();apply()};
    [['radRadius','radius','radRadiusVal'],['radGap','gap','radGapVal'],['radLine','line','radLineVal']].forEach(([id,k,val])=>{const r=document.getElementById(id);r.value=load(k,k==='line'?'8':'12');document.getElementById(val).textContent=r.value+'px';r.oninput=()=>{save(k,r.value);document.getElementById(val).textContent=r.value+'px';apply()}});
    document.getElementById('radTachOptions').innerHTML=tach.map(x=>'<button class="rad-tach-option" data-tach="'+x[0]+'"><span>'+x[1]+'</span><span>›</span></button>').join('');
    document.querySelectorAll('.rad-tach-option').forEach(b=>b.onclick=()=>{save('tach',b.dataset.tach);apply();markTach()});
    document.getElementById('radFieldList').innerHTML=fields.map(f=>'<div class="rad-field-card"><div class="rad-eye">◉</div><div><div class="rad-field-name">'+f[0]+'</div><div class="rad-field-size">TAMANHO:</div></div><select class="rad-field-select"><option>'+f[1]+'</option><option>full</option><option>1/2</option><option>1/3</option><option>1/6</option></select></div>').join('');
    sync();markTach();
  }
  function sync(){const c=document.getElementById('radCompact'); if(c)c.classList.toggle('on',load('compact','0')==='1')}
  apply();document.addEventListener('DOMContentLoaded',()=>{build();apply()});setTimeout(()=>{build();apply()},800);
})();
</script>`;

html = html.replace('</head>', style + '\n</head>');
html = html.replace('</body>', script + '\n</body>');
fs.writeFileSync(file, html, 'utf8');
console.log('Patch aplicado: designer de cards e 6 estilos de conta-giros.');
