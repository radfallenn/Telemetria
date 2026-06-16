const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'www', 'index.html');
let s = fs.readFileSync(file, 'utf8');

// Atualiza IPs atuais da rede.
s = s.replace(/192\.168\.1\.54/g, '192.168.1.68');
s = s.replace(/192\.168\.1\.72/g, '192.168.1.70');

// Remove somente o card CARRO / PISTA da tela principal.
s = s.replace(/<article class="card glass wide"><div class="ico">🏎️<\/div><div class="title">CARRO \/ PISTA<\/div><div class="val" id="carTrackName">--<\/div><div class="sub" id="carTrackIds">IDs: --<\/div><\/article>/g, '');

// Evita erro caso o script antigo tente atualizar elementos removidos.
s = s.replace(/\$\('carTrackName'\)\.textContent='--';\$\('carTrackIds'\)\.textContent='IDs: --';/g, '');
s = s.replace(/\$\('carTrackName'\)\.textContent=\(carName&&carName!=='--'\?carName:'Carro --'\)\+' \/ '\+\(trackName&&trackName!=='--'\?trackName:'Pista --'\);\$\('carTrackIds'\)\.textContent='Carro ID: '\+\(carId\|\|'--'\)\+'  •  Pista ID: '\+\(trackId\|\|'--'\)/g, '');

// Força o IP novo mesmo se o WebView/APK tiver cache antigo salvo.
const force = "localStorage.setItem('gt7BridgeWsUrl','ws://192.168.1.70:8787/ws');localStorage.setItem('gt7BridgeHttpUrl','http://192.168.1.70:8787');try{localStorage.setItem('gt7_v158_bridge_settings',JSON.stringify({ps5Ip:'192.168.1.68',bridgeIp:'192.168.1.70',bridgeUrl:'ws://192.168.1.70:8787/ws',httpUrl:'http://192.168.1.70:8787'}));}catch(e){}";
if (!s.includes("gt7BridgeHttpUrl','http://192.168.1.70:8787")) {
  s = s.replace('(function(){', '(function(){' + force);
}

// Auto conexão sem alterar a função original de conexão.
if (!s.includes('autoBridgeTimer')) {
  s = s.replace(
    "$('moreBtn').onclick=()=>showPage('infoPage');loadSettings();setTimeout(connect,500)",
    "$('moreBtn').onclick=()=>showPage('infoPage');let autoBridgeTimer=null;function bridgeStatusText(){return (($('statusText')&&$('statusText').textContent)||'').toUpperCase()}function startAutoBridge(){if(autoBridgeTimer)clearInterval(autoBridgeTimer);autoBridgeTimer=setInterval(()=>{const x=bridgeStatusText();if(x.includes('DESCONECTADO')||x.includes('FECHADO')||x.includes('FALHA'))connect()},1500)}loadSettings();startAutoBridge();setTimeout(connect,500)"
  );
}

// Conexão HTTP direta: ignora WebSocket/cache e atualiza a tela principal via /api/fields.
if (!s.includes('RAD_FORCE_HTTP_BRIDGE_V1')) {
  const direct = `<script id="RAD_FORCE_HTTP_BRIDGE_V1">
(function(){
  const URL='http://192.168.1.70:8787/api/fields';
  const $=id=>document.getElementById(id);
  let maxSpeed=0,lastUpdated=0;
  function set(id,v){const e=$(id);if(e)e.textContent=(v===null||v===undefined||v==='')?'--':String(v)}
  function pct(v){let n=Number(v||0);if(n>0&&n<=1)n*=100;return Math.max(0,Math.min(100,Math.round(n)))}
  function setBar(id,v){const e=$(id);if(e)e.style.width=pct(v)+'%'}
  function time(v){return (!v||v==='--'||v==='0'||v===0)?'--':String(v)}
  function status(ok){
    const chip=$('connectionChip'), text=$('statusText');
    if(!chip||!text)return;
    chip.classList.remove('offline','error');
    if(ok){text.innerHTML='CONECTADO<br>HTTP';}
    else{chip.classList.add('offline');text.innerHTML='RECONECTANDO<br>BRIDGE';}
  }
  async function tick(){
    try{
      const r=await fetch(URL,{cache:'no-store'});
      if(!r.ok)throw new Error('HTTP '+r.status);
      const d=await r.json();
      lastUpdated=Date.now();
      status(!!d.connected);
      const vel=Math.round(Number(d.velocidade||d.speed||0));
      const rpm=Math.round(Number(d.rpm||0));
      const fuel=d.combustivelPorcentagem??d.fuelPercent??d.combustivel??d.fuel;
      const thr=pct(d.acelerador??d.throttle??0);
      const brk=pct(d.freio??d.brake??0);
      maxSpeed=Math.max(maxSpeed,Number(d.velocidadeMaxima||0),vel);
      set('speed',vel);
      set('rpmSide',rpm||'--');
      set('gear',d.marcha||d.gear||'N');
      set('maxSpeed',Math.round(maxSpeed));
      set('fuelSide',fuel==null?'--':Math.round(Number(fuel)));
      set('throttleVal',thr+'%');
      set('brakeVal',brk+'%');
      setBar('throttleFill',thr);
      setBar('brakeFill',brk);
      const hero=$('rpmHero');if(hero)hero.style.setProperty('--rpmdeg',Math.min(170,Math.max(0,(rpm/9000)*170))+'deg');
      set('bestLapCard',time(d.melhorVolta??d.bestLap));
      set('lastLapCard',time(d.ultimaVolta??d.lastLap));
      set('totalTimeCard',time(d.tempoTotalCorrida??d.totalTime));
      set('correctedLaps',d.voltasCorrigidas??d.voltasCompletadas??d.voltas??'--');
    }catch(e){
      if(Date.now()-lastUpdated>1500)status(false);
    }
  }
  setInterval(tick,650);
  setTimeout(tick,250);
})();
</script>`;
  s = s.replace('</body>', direct + '\n</body>');
}

fs.writeFileSync(file, s, 'utf8');
console.log('Patch aplicado: HTTP direto do Bridge ativo, sem alterar layout.');
