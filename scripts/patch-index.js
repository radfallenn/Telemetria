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

// Remove auto conectar/reconexão adicionados anteriormente.
s = s.replace(/let autoBridgeTimer=null;function bridgeStatusText\(\)\{return \(\(\$\('statusText'\)&&\$\('statusText'\)\.textContent\)\|\|''\)\.toUpperCase\(\)\}function startAutoBridge\(\)\{if\(autoBridgeTimer\)clearInterval\(autoBridgeTimer\);autoBridgeTimer=setInterval\(\(\)=>\{const x=bridgeStatusText\(\);if\(x\.includes\('DESCONECTADO'\)\|\|x\.includes\('FECHADO'\)\|\|x\.includes\('FALHA'\)\)connect\(\)\},1500\)\}/g, '');
s = s.replace(/loadSettings\(\);startAutoBridge\(\);setTimeout\(connect,500\)/g, 'loadSettings()');
s = s.replace(/setTimeout\(connect,500\)/g, '');

// Remove conexão HTTP direta automática adicionada anteriormente.
s = s.replace(/<script id="RAD_FORCE_HTTP_BRIDGE_V1">[\s\S]*?<\/script>\s*/g, '');

fs.writeFileSync(file, s, 'utf8');
console.log('Patch aplicado: sem auto conectar, sem HTTP polling automático, card CARRO / PISTA removido.');
