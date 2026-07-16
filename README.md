# GT7 Telemetria APK

Projeto pronto para gerar APK Android pelo GitHub Actions usando Capacitor.

## Como gerar o APK

1. Suba estes arquivos no repositório do GitHub.
2. Abra a aba Actions.
3. Escolha o workflow Build APK.
4. Clique em Run workflow.
5. Baixe o artifact GT7-Telemetria-v1.80-debug-apk.

## Arquivo principal

O app web está em `www/index.html`.

## Versão

GT7 Telemetria v1.80

- Conexão automática com o Bridge ao abrir.
- Reconexão quando o Bridge fecha ou falha.
- Leitura correta do envelope WebSocket `{ type, data }`.
- Timeout nas tentativas HTTP para evitar conexão travada.
- Estado visível: Bridge online aguardando GT7 ou recebendo telemetria.
