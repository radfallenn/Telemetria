const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'www', 'index.html');
let html = fs.readFileSync(file, 'utf8');

if (html.includes('RAD_CONNECTION_RECOVERY_V17')) {
  console.log('RAD_CONNECTION_RECOVERY_V17 já aplicado.');
  process.exit(0);
}

const oldWsHandler = "ws.onmessage=ev=>{try{applyPayload(JSON.parse(ev.data))}catch(e){}}";
const newWsHandler = "ws.onmessage=ev=>{try{const packet=JSON.parse(ev.data),payload=packet&&packet.data&&typeof packet.data==='object'?packet.data:packet;applyPayload(payload);window.dispatchEvent(new CustomEvent('gt7-bridge-payload',{detail:{type:(packet&&packet.type)||'telemetry',payload}}))}catch(e){}}";
if (!html.includes(oldWsHandler)) {
  throw new Error('Handler WebSocket esperado não foi encontrado.');
}
html = html.replace(oldWsHandler, newWsHandler);

const oldHttpFetch = "const r=await fetch(base+p,{cache:'no-store'});if(r.ok){const j=await r.json().catch(()=>null);if(j){applyPayload(j);return true}}";
const newHttpFetch = "const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),1600);const r=await fetch(base+p,{cache:'no-store',signal:ctl.signal});clearTimeout(tm);if(r.ok){const j=await r.json().catch(()=>null);if(j){applyPayload(j);window.dispatchEvent(new CustomEvent('gt7-bridge-payload',{detail:{type:p,payload:j}}));return true}}";
if (!html.includes(oldHttpFetch)) {
  throw new Error('Polling HTTP esperado não foi encontrado.');
}
html = html.replace(oldHttpFetch, newHttpFetch);

const style = `
<style id="RAD_CONNECTION_RECOVERY_V17">
#connectionChip.rad-waiting{border-color:rgba(255,224,77,.55)!important;box-shadow:0 0 18px rgba(255,224,77,.18)!important}
#connectionChip.rad-receiving{border-color:rgba(34,245,162,.65)!important;box-shadow:0 0 20px rgba(34,245,162,.22)!important}
</style>`;

const script = `
<script id="RAD_CONNECTION_RECOVERY_V17_SCRIPT">
(function(){
  const RETRY_MS=7000;
  const WAITING_MS=9000;
  let manualPause=false;
  let lastTelemetryAt=0;
  let connectedAt=0;
  let retryTimer=0;
  function el(id){return document.getElementById(id)}
  function status(){return ((el('statusText')&&el('statusText').textContent)||'').toUpperCase()}
  function setConnectionState(kind,text){
    const chip=el('connectionChip'),label=el('statusText');
    if(!chip||!label)return;
    chip.classList.remove('offline','error','rad-waiting','rad-receiving');
    if(kind==='waiting')chip.classList.add('rad-waiting');
    if(kind==='receiving')chip.classList.add('rad-receiving');
    label.innerHTML=text;
  }
  function hasTelemetry(value){
    if(!value||typeof value!=='object'||value.ok===false)return false;
    const d=value.gt7Online&&value.gt7Online.camposPrincipais?value.gt7Online.camposPrincipais:value;
    return ['speedKph','speed','velocidade','rpm','currentGear','marcha','throttlePercent','acelerador'].some(k=>d[k]!==undefined&&d[k]!==null);
  }
  function connectNow(){
    if(manualPause)return;
    const button=el('connectBtn');
    if(button)button.click();
  }
  function monitor(){
    if(manualPause)return;
    const s=status();
    if(s.includes('CONECTADO')&&!connectedAt)connectedAt=Date.now();
    if(s.includes('FALHA')||s.includes('FECHADO')||s.includes('DESCONECTADO')){
      connectedAt=0;
      clearTimeout(retryTimer);
      retryTimer=setTimeout(connectNow,RETRY_MS);
      return;
    }
    if(connectedAt&&Date.now()-connectedAt>WAITING_MS&&!lastTelemetryAt){
      setConnectionState('waiting','BRIDGE ONLINE<br>AGUARDANDO GT7');
    }
  }
  function boot(){
    const connect=el('connectBtn'),disconnect=el('disconnectBtn'),fullscreen=el('openTelemetryBtn');
    if(disconnect&&!disconnect.dataset.radConnectionPause){
      disconnect.dataset.radConnectionPause='1';
      disconnect.addEventListener('click',()=>{manualPause=true;clearTimeout(retryTimer)},true);
    }
    if(connect&&!connect.dataset.radConnectionResume){
      connect.dataset.radConnectionResume='1';
      connect.addEventListener('click',()=>{manualPause=false;lastTelemetryAt=0;connectedAt=Date.now()},true);
    }
    if(fullscreen&&!fullscreen.dataset.radConnectionResume){
      fullscreen.dataset.radConnectionResume='1';
      fullscreen.addEventListener('click',()=>{manualPause=false},true);
    }
    if(!manualPause&&!connectedAt)connectNow();
  }
  window.addEventListener('gt7-bridge-payload',event=>{
    const payload=event.detail&&event.detail.payload;
    if(!hasTelemetry(payload))return;
    lastTelemetryAt=Date.now();
    connectedAt=connectedAt||lastTelemetryAt;
    setConnectionState('receiving','RECEBENDO<br>TELEMETRIA');
  });
  document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,700));
  window.addEventListener('load',()=>setTimeout(boot,700));
  setTimeout(boot,900);
  setInterval(monitor,2000);
})();
</script>`;

html = html.replace('</head>', style + '\n</head>');
html = html.replace('</body>', script + '\n</body>');
fs.writeFileSync(file, html, 'utf8');
console.log('Patch aplicado: conexão automática, unwrap WebSocket, timeout HTTP e diagnóstico de recepção v17.');
