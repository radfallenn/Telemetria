const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'www', 'index.html');
let s = fs.readFileSync(file, 'utf8');

// Remove somente o card CARRO / PISTA da tela principal.
s = s.replace(/<article class="card glass wide"><div class="ico">🏎️<\/div><div class="title">CARRO \/ PISTA<\/div><div class="val" id="carTrackName">--<\/div><div class="sub" id="carTrackIds">IDs: --<\/div><\/article>/g, '');

// Evita erro caso o script antigo tente atualizar elementos removidos.
s = s.replace(/\$\('carTrackName'\)\.textContent='--';\$\('carTrackIds'\)\.textContent='IDs: --';/g, '');
s = s.replace(/\$\('carTrackName'\)\.textContent=\(carName&&carName!=='--'\?carName:'Carro --'\)\+' \/ '\+\(trackName&&trackName!=='--'\?trackName:'Pista --'\);\$\('carTrackIds'\)\.textContent='Carro ID: '\+\(carId\|\|'--'\)\+'  •  Pista ID: '\+\(trackId\|\|'--'\)/g, '');

// Auto conexão sem alterar a função original de conexão.
if (!s.includes('autoBridgeTimer')) {
  s = s.replace(
    "$('moreBtn').onclick=()=>showPage('infoPage');loadSettings();setTimeout(connect,500)",
    "$('moreBtn').onclick=()=>showPage('infoPage');let autoBridgeTimer=null;function bridgeStatusText(){return (($('statusText')&&$('statusText').textContent)||'').toUpperCase()}function startAutoBridge(){if(autoBridgeTimer)clearInterval(autoBridgeTimer);autoBridgeTimer=setInterval(()=>{const x=bridgeStatusText();if(x.includes('DESCONECTADO')||x.includes('FECHADO')||x.includes('FALHA'))connect()},1500)}loadSettings();startAutoBridge();setTimeout(connect,500)"
  );
}

fs.writeFileSync(file, s, 'utf8');
console.log('Patch aplicado: card CARRO / PISTA removido e auto conexão simples ativa.');
