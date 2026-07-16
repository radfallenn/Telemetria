const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'www', 'index.html');
let html = fs.readFileSync(file, 'utf8');

if (html.includes('RAD_TACH_IMAGE_STYLES_V1')) {
  console.log('RAD_TACH_IMAGE_STYLES_V1 já aplicado.');
  process.exit(0);
}

const style = `
<style id="RAD_TACH_IMAGE_STYLES_V1">
body.tach-original .hero{border-radius:999px}
body.tach-img-classic .hero,body.tach-img-red .hero,body.tach-img-blue .hero,body.tach-img-gold .hero{border-radius:50%!important;background:radial-gradient(circle at 50% 50%,#020306 0 46%,#05070c 47% 63%,#111 64% 69%,#000 70% 100%)!important;border:2px solid rgba(255,255,255,.10)!important;box-shadow:inset 0 0 24px rgba(255,255,255,.05),inset 0 -18px 30px rgba(0,0,0,.95),0 18px 52px rgba(0,0,0,.82)!important;overflow:hidden}
body.tach-img-classic .hero:before,body.tach-img-red .hero:before,body.tach-img-blue .hero:before,body.tach-img-gold .hero:before,body.tach-img-wide .hero:before{content:"";position:absolute;inset:5px;border-radius:inherit;pointer-events:none;z-index:1}
body.tach-img-classic .hero:before{background:radial-gradient(circle,transparent 0 58%,rgba(255,255,255,.16) 59% 60%,transparent 61%),conic-gradient(from 225deg,#cfd8dc 0 38deg,#fff 39deg 118deg,#ffe14d 119deg 146deg,#ff3b24 147deg 178deg,transparent 179deg 360deg);-webkit-mask:radial-gradient(circle,transparent 0 68%,#000 69% 77%,transparent 78%);mask:radial-gradient(circle,transparent 0 68%,#000 69% 77%,transparent 78%)}
body.tach-img-red .hero:before{background:radial-gradient(circle,transparent 0 58%,rgba(255,50,50,.28) 59% 60%,transparent 61%),conic-gradient(from 225deg,#ffffff 0 28deg,#ff6b6b 29deg 132deg,#ff2020 133deg 178deg,transparent 179deg 360deg);filter:drop-shadow(0 0 12px #ff1f1f);-webkit-mask:radial-gradient(circle,transparent 0 66%,#000 67% 79%,transparent 80%);mask:radial-gradient(circle,transparent 0 66%,#000 67% 79%,transparent 80%)}
body.tach-img-blue .hero:before{background:conic-gradient(from 230deg,#2ff9ff 0 70deg,#0b9dff 71deg 112deg,#ff274e 113deg 145deg,transparent 146deg 360deg);filter:drop-shadow(0 0 15px #11d8ff);-webkit-mask:radial-gradient(circle,transparent 0 62%,#000 63% 80%,transparent 81%);mask:radial-gradient(circle,transparent 0 62%,#000 63% 80%,transparent 81%)}
body.tach-img-gold .hero:before{background:conic-gradient(from 225deg,#e5d2a0 0 108deg,#ffc948 109deg 150deg,#ff3a24 151deg 178deg,transparent 179deg 360deg);filter:drop-shadow(0 0 10px #b88a29);-webkit-mask:radial-gradient(circle,transparent 0 67%,#000 68% 76%,transparent 77%);mask:radial-gradient(circle,transparent 0 67%,#000 68% 76%,transparent 77%)}
body.tach-img-classic .ticks,body.tach-img-red .ticks,body.tach-img-blue .ticks,body.tach-img-gold .ticks{inset:20px!important;background:repeating-conic-gradient(from 225deg,rgba(255,255,255,.96) 0 .8deg,transparent .8deg 4deg)!important;-webkit-mask:radial-gradient(circle,transparent 0 73%,#000 74% 79%,transparent 80%)!important;mask:radial-gradient(circle,transparent 0 73%,#000 74% 79%,transparent 80%)!important;z-index:2}
body.tach-img-classic .rpm-ring,body.tach-img-red .rpm-ring,body.tach-img-blue .rpm-ring,body.tach-img-gold .rpm-ring{opacity:0!important}
body.tach-img-classic .center,body.tach-img-red .center,body.tach-img-blue .center,body.tach-img-gold .center{margin-top:4px;text-shadow:0 2px 8px #000;z-index:5!important}
body.tach-img-classic .speed,body.tach-img-red .speed,body.tach-img-blue .speed,body.tach-img-gold .speed{font-size:64px!important;color:#fff!important}
body.tach-img-red .speed,body.tach-img-red .gear,body.tach-img-red .max{color:#ff8a8a!important;text-shadow:0 0 13px #ff2020}
body.tach-img-blue .speed{font-size:52px!important;color:#bdf8ff!important;text-shadow:0 0 16px #08dfff}
body.tach-img-blue .kmh{font-size:20px!important}.tach-img-blue .gear{display:none!important}
body.tach-img-gold .kmh,body.tach-img-gold .gear,body.tach-img-gold .max{color:#ffe04d!important}
.rad-needle{position:absolute;left:50%;top:50%;width:41%;height:4px;background:linear-gradient(90deg,transparent,#ff1f2f 18%,#ff1f2f);border-radius:999px;transform-origin:0 50%;transform:rotate(168deg);z-index:4;box-shadow:0 0 8px rgba(255,20,30,.85);pointer-events:none}.rad-needle:after{content:"";position:absolute;right:-5px;top:-3px;width:10px;height:10px;background:#ff1f2f;border-radius:50%}.tach-img-blue .rad-needle{background:linear-gradient(90deg,transparent,#32e8ff);box-shadow:0 0 9px #20e8ff}.tach-img-gold .rad-needle{background:linear-gradient(90deg,transparent,#f2b51e);box-shadow:0 0 9px #f2b51e}.tach-img-wide .hero{height:150px!important;border-radius:34px 34px 12px 12px!important;background:linear-gradient(180deg,#081018,#020305)!important;border:2px solid rgba(255,255,255,.10)!important;box-shadow:inset 0 0 24px rgba(0,230,255,.12),0 18px 50px rgba(0,0,0,.8)!important;margin-top:36px}.tach-img-wide .hero:before{background:linear-gradient(90deg,#03e8ff,#03e8ff 20%,transparent 21% 72%,#ff274e 73% 100%);height:42px;top:8px;left:18px;right:18px;bottom:auto;border-radius:999px;filter:drop-shadow(0 0 12px #03e8ff)}.tach-img-wide .ticks{inset:10px 18px auto!important;height:46px!important;border-radius:999px;background:repeating-linear-gradient(90deg,#dff 0 2px,transparent 2px 12px)!important;-webkit-mask:none!important;mask:none!important;opacity:.9}.tach-img-wide .rpm-ring{display:none!important}.tach-img-wide .center{margin-top:14px}.tach-img-wide .speed{font-size:48px!important;color:#bdf8ff;text-shadow:0 0 18px #00dfff}.tach-img-wide .kmh{font-size:18px!important}.tach-img-wide .gear{display:none!important}.tach-img-wide .max{font-size:18px!important;color:#ffe04d!important}.tach-img-wide .rad-tach-number{font-size:16px!important}.tach-img-wide .rad-n0,.tach-img-wide .rad-n1{display:none}.tach-img-wide .rad-n2{left:18%;top:17%}.tach-img-wide .rad-n3{left:29%;top:8%}.tach-img-wide .rad-n4{left:42%;top:5%}.tach-img-wide .rad-n5{right:39%;top:5%}.tach-img-wide .rad-n6{right:28%;top:8%}.tach-img-wide .rad-n7{right:18%;top:17%}.tach-img-wide .rad-n8{right:10%;top:34%}
body.tach-img-classic .rad-tach-number,body.tach-img-red .rad-tach-number,body.tach-img-blue .rad-tach-number,body.tach-img-gold .rad-tach-number{font-size:22px!important;color:#fff!important;text-shadow:0 2px 6px #000;z-index:4!important}.tach-img-red .rad-tach-number{color:#ff7878!important;text-shadow:0 0 10px #ff2020}.tach-img-blue .rad-tach-number{color:#bdf8ff!important;text-shadow:0 0 10px #00dfff}.tach-img-gold .rad-tach-number{color:#f5d98b!important}.tach-img-classic .rad-n0{left:14%;bottom:31%}.tach-img-classic .rad-n1{left:14%;bottom:45%}.tach-img-classic .rad-n2{left:20%;top:33%}.tach-img-classic .rad-n3{left:31%;top:20%}.tach-img-classic .rad-n4{left:47%;top:13%}.tach-img-classic .rad-n5{right:31%;top:20%}.tach-img-classic .rad-n6{right:20%;top:33%}.tach-img-classic .rad-n7{right:14%;bottom:45%}.tach-img-classic .rad-n8{right:14%;bottom:31%}
.rad-tach-select-panel{position:fixed;left:50%;bottom:calc(92px + env(safe-area-inset-bottom));transform:translateX(-50%);width:min(100% - 28px,430px);z-index:34;background:linear-gradient(180deg,#111214,#070707);border:1px solid #242424;border-radius:18px;padding:12px;display:none;box-shadow:0 18px 44px rgba(0,0,0,.72)}.rad-tach-select-panel.show{display:block}.rad-tach-select-title{font-weight:900;font-size:13px;letter-spacing:.08em;margin-bottom:10px}.rad-tach-select-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.rad-tach-select-grid button{min-height:44px;border-radius:12px;border:1px solid #333;background:#090909;color:#fff;font-weight:900;text-align:left;padding:9px 10px}.rad-tach-select-grid button.active{background:#ff7a18;color:#050505;border-color:#ff7a18}.rad-tach-quick{position:fixed;left:18px;bottom:calc(252px + env(safe-area-inset-bottom));z-index:32;width:52px;height:52px;border-radius:16px;border:1px solid #333;background:#0b0b0c;color:#ff7a18;font-size:22px;box-shadow:0 16px 30px rgba(0,0,0,.55)}
</style>`;

const script = `
<script id="RAD_TACH_IMAGE_STYLES_V1">
(function(){
 const modes=[['original','Original'],['img-classic','Imagem 1 Clássico'],['img-red','Imagem 2 Vermelho'],['img-blue','Imagem 3 Digital'],['img-gold','Imagem 4 Dourado'],['img-wide','Imagem 5 Wide']];
 function get(){return localStorage.getItem('rad_tach_image_style')||'original'}
 function apply(){document.body.className=document.body.className.replace(/tach-(original|img-classic|img-red|img-blue|img-gold|img-wide)/g,'').trim();document.body.classList.add('tach-'+get());installNeedle();mark();}
 function installNeedle(){const h=document.querySelector('.hero');if(h&&!h.querySelector('.rad-needle')){const n=document.createElement('div');n.className='rad-needle';h.appendChild(n)}}
 function set(v){localStorage.setItem('rad_tach_image_style',v);apply()}
 function mark(){document.querySelectorAll('[data-rad-tach-img]').forEach(b=>b.classList.toggle('active',b.dataset.radTachImg===get()))}
 function build(){if(document.getElementById('radTachSelectPanel'))return;const quick=document.createElement('button');quick.className='rad-tach-quick';quick.innerHTML='◴';quick.onclick=()=>document.getElementById('radTachSelectPanel').classList.toggle('show');document.body.appendChild(quick);const p=document.createElement('div');p.id='radTachSelectPanel';p.className='rad-tach-select-panel';p.innerHTML='<div class="rad-tach-select-title">CONTA-GIROS</div><div class="rad-tach-select-grid">'+modes.map(m=>'<button data-rad-tach-img="'+m[0]+'">'+m[1]+'</button>').join('')+'</div>';document.body.appendChild(p);p.querySelectorAll('button').forEach(b=>b.onclick=()=>{set(b.dataset.radTachImg);p.classList.remove('show')});
  const obs=new MutationObserver(()=>installNeedle());const hero=document.querySelector('.hero');if(hero)obs.observe(hero,{childList:true,subtree:true});mark();}
 document.addEventListener('DOMContentLoaded',()=>{build();apply()});setTimeout(()=>{build();apply()},900);apply();
})();
</script>`;

html = html.replace('</head>', style + '\n</head>');
html = html.replace('</body>', script + '\n</body>');
fs.writeFileSync(file, html, 'utf8');
console.log('Patch aplicado: conta-giros Original + 5 modelos fiéis às imagens.');
