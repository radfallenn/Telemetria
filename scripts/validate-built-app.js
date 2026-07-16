const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'www', 'index.html'), 'utf8');
const checks = [
  ['patch de conexão v17 instalado', html.includes('RAD_CONNECTION_RECOVERY_V17_SCRIPT')],
  ['payload WebSocket desempacotado', html.includes("packet&&packet.data&&typeof packet.data==='object'?packet.data:packet")],
  ['evento de telemetria emitido', html.includes("gt7-bridge-payload")],
  ['HTTP com timeout', html.includes("signal:ctl.signal") && html.includes("ctl.abort()")],
  ['conexão automática ativa', html.includes('setTimeout(boot,900)') && html.includes('connectNow()')],
  ['reconexão ativa', html.includes("s.includes('FALHA')") && html.includes('RETRY_MS')],
  ['diagnóstico aguardando GT7', html.includes('BRIDGE ONLINE<br>AGUARDANDO GT7')],
  ['diagnóstico recebendo', html.includes('RECEBENDO<br>TELEMETRIA')],
  ['porta Bridge 8787 preservada', html.includes(':8787/ws') && html.includes(':8787')],
  ['porta GT7 33740 preservada', html.includes("udpPort:'33740'")],
  ['modo de teste dinâmico ausente', !html.includes('TESTE-DINAMICO')]
];

let failed = false;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'OK' : 'ERRO'}: ${label}`);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
