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

fs.writeFileSync(file, s, 'utf8');
console.log('Patch aplicado: IPs/cache atualizados, card CARRO / PISTA removido e auto conexão ativa.');
