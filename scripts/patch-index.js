const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'www', 'index.html');
let s = fs.readFileSync(file, 'utf8');

// Remove apenas o card CARRO / PISTA da tela principal.
s = s.replace(/<article class="card glass wide"><div class="ico">🏎️<\/div><div class="title">CARRO \/ PISTA<\/div><div class="val" id="carTrackName">--<\/div><div class="sub" id="carTrackIds">IDs: --<\/div><\/article>/g, '');

// Evita erro caso o script antigo tente atualizar elementos removidos.
s = s.replace(/\$\('carTrackName'\)\.textContent='--';\$\('carTrackIds'\)\.textContent='IDs: --';/g, '');
s = s.replace(/\$\('carTrackName'\)\.textContent=\(carName&&carName!=='--'\?carName:'Carro --'\)\+' \/ '\+\(trackName&&trackName!=='--'\?trackName:'Pista --'\);\$\('carTrackIds'\)\.textContent='Carro ID: '\+\(carId\|\|'--'\)\+'  •  Pista ID: '\+\(trackId\|\|'--'\)/g, '');

// Auto reconexão: sem mudar layout.
s = s.replace("let ws=null,pollTimer=null,demoTimer=null,maxSpeed=0,", "let ws=null,pollTimer=null,demoTimer=null,reconnectTimer=null,manualStop=false,maxSpeed=0,");

s = s.replace(
  "function stop(){if(demoTimer)clearInterval(demoTimer);demoTimer=null;if(pollTimer)clearInterval(pollTimer);pollTimer=null;if(ws){try{ws.close()}catch(e){}ws=null}setStatus('offline','DESCONECTADO<br>AO BRIDGE')}",
  "function stop(manual=true){manualStop=manual;if(reconnectTimer)clearTimeout(reconnectTimer);if(demoTimer)clearInterval(demoTimer);demoTimer=null;if(pollTimer)clearInterval(pollTimer);pollTimer=null;if(ws){try{ws.close()}catch(e){}ws=null}setStatus('offline','DESCONECTADO<br>AO BRIDGE')}function scheduleReconnect(){if(manualStop)return;if(reconnectTimer)clearTimeout(reconnectTimer);setStatus('offline','RECONECTANDO<br>BRIDGE');reconnectTimer=setTimeout(connect,1200)}"
);

s = s.replace(
  "function startPolling(base){if(pollTimer)clearInterval(pollTimer);pollTimer=setInterval(()=>tryHttp(base),500);setStatus('connected','CONECTADO<br>HTTP')}",
  "function startPolling(base){if(pollTimer)clearInterval(pollTimer);pollTimer=setInterval(async()=>{const ok=await tryHttp(base);if(!ok){clearInterval(pollTimer);pollTimer=null;scheduleReconnect()}},700);setStatus('connected','CONECTADO<br>HTTP')}"
);

s = s.replace("async function connect(){stop();const c=candidates();", "async function connect(){manualStop=false;if(reconnectTimer)clearTimeout(reconnectTimer);stop(false);const c=candidates();");
s = s.replace("ws.onclose=()=>{if(opened&&!pollTimer)setStatus('offline','BRIDGE<br>FECHADO')}}async function tryHttpFallback()", "ws.onclose=()=>{if(opened&&!pollTimer)scheduleReconnect()}}async function tryHttpFallback()");
s = s.replace("setStatus('error','FALHA<br>CONEXÃO')}nextWs()}", "setStatus('error','FALHA<br>CONEXÃO');scheduleReconnect()}nextWs()}");
s = s.replace("function demo(){stop();setStatus('connected','DEMO<br>ATIVO');", "function demo(){stop(true);setStatus('connected','DEMO<br>ATIVO');");
s = s.replace("$('disconnectBtn').onclick=stop;", "$('disconnectBtn').onclick=()=>stop(true);");

fs.writeFileSync(file, s, 'utf8');
console.log('Patch aplicado: card CARRO / PISTA removido e auto reconexão ativa.');
