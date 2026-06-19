const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'www', 'index.html');
let html = fs.readFileSync(file, 'utf8');
if (html.includes('RAD_UDM_PERFORMANCE_V13')) process.exit(0);

const style = `
<style id="RAD_UDM_PERFORMANCE_V13">
.rad-udm-panel{margin-top:12px;border-radius:16px;padding:14px;background:linear-gradient(145deg,rgba(13,26,43,.94),rgba(4,9,17,.96));border:1px solid rgba(80,124,170,.24);box-shadow:0 18px 38px rgba(0,0,0,.65),inset 0 1px 0 rgba(255,255,255,.06)}
.rad-udm-title{font-size:14px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;margin-bottom:12px;color:#f7fbff}.rad-udm-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.rad-udm-card{border-radius:13px;background:rgba(255,255,255,.045);border:1px solid rgba(100,150,200,.16);padding:11px}.rad-udm-label{font-size:9px;color:#a8b5c6;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.rad-udm-value{font-size:22px;font-weight:900;margin-top:5px}.rad-udm-sub{font-size:10px;color:#8fa1b5;margin-top:2px}.rad-udm-good{color:#22f5a2}.rad-udm-mid{color:#ffe04d}.rad-udm-bad{color:#ff315e}.rad-heat{display:flex;gap:5px;flex-wrap:wrap;margin-top:9px}.rad-heat span{width:28px;height:24px;border-radius:8px;display:grid;place-items:center;font-size:10px;font-weight:900;color:#00140c}.rad-heat .g{background:#22f5a2}.rad-heat .m{background:#ffe04d}.rad-heat .b{background:#ff315e;color:#fff}.rad-radar{display:grid;gap:7px;margin-top:8px}.rad-radar-row{display:grid;grid-template-columns:82px 1fr 34px;gap:7px;align-items:center;font-size:10px;font-weight:900;color:#a8b5c6}.rad-radar-track{height:7px;border-radius:99px;background:rgba(255,255,255,.09);overflow:hidden}.rad-radar-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#12e8ff,#22f5a2)}.rad-coach{font-size:12px;line-height:1.45;color:#dce8f6;display:grid;gap:5px}.rad-rank-list{display:grid;gap:7px;margin-top:8px}.rad-rank-item{display:grid;grid-template-columns:24px 1fr auto;gap:8px;align-items:center;font-size:11px;border-radius:10px;background:rgba(255,255,255,.045);padding:8px}.rad-rank-pos{font-weight:900;color:#ffe04d}.rad-rank-time{font-weight:900;color:#fff}
</style>`;

const script = `
<script id="RAD_UDM_PERFORMANCE_V13">
(function(){
  const $=id=>document.getElementById(id);
  function read(k,d){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(e){return d}}
  function write(k,v){localStorage.setItem(k,JSON.stringify(v))}
  function records(){let a=read('gt7_lap_records_v8',[]); if(!a.length)a=read('gt7_lap_records_v4',[]); return Array.isArray(a)?a.filter(x=>x&&Number.isFinite(Number(x.ms))):[]}
  function fmt(ms){if(!Number.isFinite(ms)||ms<=0)return'--';const m=Math.floor(ms/60000),s=Math.floor((ms%60000)/1000),x=Math.round(ms%1000);return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+'.'+String(x).padStart(3,'0')}
  function pct(v){return Math.max(0,Math.min(100,Math.round(v)))}
  function avg(a){return a.length?a.reduce((s,x)=>s+x,0)/a.length:0}
  function std(a){if(a.length<2)return 0;const m=avg(a);return Math.sqrt(avg(a.map(x=>(x-m)*(x-m))))}
  function ensure(){
    if($('radUdmPanel'))return;
    const cards=document.querySelector('.cards'); if(!cards)return;
    const p=document.createElement('section');
    p.id='radUdmPanel'; p.className='rad-udm-panel';
    p.innerHTML='<div class="rad-udm-title">UDM PERFORMANCE</div><div class="rad-udm-grid"><div class="rad-udm-card"><div class="rad-udm-label">Consistência</div><div class="rad-udm-value" id="udmConsistency">--</div><div class="rad-udm-sub" id="udmConsistencySub">voltas estáveis</div></div><div class="rad-udm-card"><div class="rad-udm-label">Delta melhor</div><div class="rad-udm-value" id="udmDelta">--</div><div class="rad-udm-sub">última vs melhor</div></div><div class="rad-udm-card"><div class="rad-udm-label">Nota sessão</div><div class="rad-udm-value" id="udmGrade">--</div><div class="rad-udm-sub" id="udmGradeSub">aguardando voltas</div></div><div class="rad-udm-card"><div class="rad-udm-label">Velocidade máx</div><div class="rad-udm-value" id="udmMaxSpeed">--</div><div class="rad-udm-sub">km/h</div></div></div><div class="rad-udm-card" style="margin-top:8px"><div class="rad-udm-label">Heatmap de voltas</div><div class="rad-heat" id="udmHeat"></div></div><div class="rad-udm-card" style="margin-top:8px"><div class="rad-udm-label">Radar de pilotagem</div><div class="rad-radar" id="udmRadar"></div></div><div class="rad-udm-card" style="margin-top:8px"><div class="rad-udm-label">Coach da sessão</div><div class="rad-coach" id="udmCoach">Aguardando dados válidos.</div></div><div class="rad-udm-card" style="margin-top:8px"><div class="rad-udm-label">Ranking local</div><div class="rad-rank-list" id="udmRank"></div></div>';
    cards.insertAdjacentElement('afterend',p);
  }
  function colorClass(score){return score>=85?'rad-udm-good':score>=65?'rad-udm-mid':'rad-udm-bad'}
  function setVal(id,v,score){const e=$(id); if(!e)return; e.textContent=v; e.classList.remove('rad-udm-good','rad-udm-mid','rad-udm-bad'); if(score!==undefined)e.classList.add(colorClass(score))}
  function updateRanking(best){
    if(!best)return;
    const item={time:best.t,ms:best.ms,at:Date.now(),laps:records().length};
    let r=read('gt7_udm_ranking',[]).filter(x=>x&&Number.isFinite(Number(x.ms)));
    if(!r.some(x=>Math.abs(Number(x.ms)-item.ms)<20)) r.push(item);
    r.sort((a,b)=>Number(a.ms)-Number(b.ms)); r=r.slice(0,10); write('gt7_udm_ranking',r);
  }
  function render(){
    ensure();
    const rec=records();
    const ms=rec.map(x=>Number(x.ms)).filter(Number.isFinite);
    const maxSpeed=parseInt((($('maxSpeed')&&$('maxSpeed').textContent)||'0').replace(/[^0-9]/g,''),10)||0;
    setVal('udmMaxSpeed',maxSpeed?String(maxSpeed):'--');
    if(!ms.length){setVal('udmConsistency','--');setVal('udmDelta','--');setVal('udmGrade','--');$('udmHeat').innerHTML='';$('udmRadar').innerHTML='';$('udmCoach').textContent='Aguardando voltas válidas.';return;}
    const bestMs=Math.min.apply(null,ms), worstMs=Math.max.apply(null,ms), lastMs=ms[ms.length-1];
    const best=rec.find(x=>Number(x.ms)===bestMs);
    updateRanking(best);
    const dev=std(ms);
    const consistency=pct(100-(dev/Math.max(bestMs,1))*650);
    const delta=lastMs-bestMs;
    const gradeScore=pct((consistency*.55)+(Math.min(ms.length,12)/12*25)+(maxSpeed?20:8));
    const grade=gradeScore>=92?'A+':gradeScore>=84?'A':gradeScore>=74?'B':gradeScore>=62?'C':'D';
    setVal('udmConsistency',consistency+'%',consistency); $('udmConsistencySub').textContent='desvio '+(dev/1000).toFixed(2)+'s';
    setVal('udmDelta',(delta>=0?'+':'')+(delta/1000).toFixed(3)+'s',100-Math.min(100,delta/40));
    setVal('udmGrade',grade,gradeScore); $('udmGradeSub').textContent=gradeScore+' pontos';
    $('udmHeat').innerHTML=ms.map((v,i)=>{const d=v-bestMs;const c=d<500?'g':d<1800?'m':'b';return '<span class="'+c+'">V'+(i+1)+'</span>'}).join('');
    const braking=pct(100-Math.min(100,(worstMs-bestMs)/80));
    const accel=pct(maxSpeed?Math.min(100,maxSpeed/3.2):55);
    const economy=pct(100-Math.min(100,ms.length>1?Math.abs((lastMs-avg(ms))/80):35));
    const radar=[['Consist.',consistency],['Ritmo',pct(100-Math.min(100,(avg(ms)-bestMs)/70))],['Acel.',accel],['Controle',braking],['Economia',economy]];
    $('udmRadar').innerHTML=radar.map(r=>'<div class="rad-radar-row"><span>'+r[0]+'</span><div class="rad-radar-track"><div class="rad-radar-fill" style="width:'+r[1]+'%"></div></div><b>'+r[1]+'</b></div>').join('');
    const tips=[];
    if(consistency<70)tips.push('• Foque em repetir pontos de freada: sua consistência está baixa.');
    if(delta>1200)tips.push('• Última volta ficou mais de 1.2s acima da melhor. Verifique pneus, combustível ou erro de curva.');
    if(ms.length<5)tips.push('• Faça pelo menos 5 voltas válidas para análise mais confiável.');
    if(consistency>=85&&delta<800)tips.push('• Boa sequência: ritmo está estável e próximo da melhor volta.');
    $('udmCoach').innerHTML=tips.join('<br>')||'• Sessão equilibrada. Continue acumulando voltas para melhorar o radar.';
    const rank=read('gt7_udm_ranking',[]).slice(0,5);
    $('udmRank').innerHTML=rank.map((x,i)=>'<div class="rad-rank-item"><div class="rad-rank-pos">#'+(i+1)+'</div><div>'+new Date(x.at).toLocaleDateString('pt-BR')+' • '+(x.laps||0)+' voltas</div><div class="rad-rank-time">'+fmt(Number(x.ms))+'</div></div>').join('')||'<div class="rad-udm-sub">Sem ranking ainda.</div>';
  }
  document.addEventListener('DOMContentLoaded',render); window.addEventListener('load',render); setTimeout(render,800); setInterval(render,2500);
})();
</script>`;

html = html.replace('</head>', style + '\n</head>');
html = html.replace('</body>', script + '\n</body>');
fs.writeFileSync(file, html, 'utf8');
console.log('Patch aplicado: UDM Performance v13.');
