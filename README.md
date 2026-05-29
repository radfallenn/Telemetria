# GT7 Bridge Mobile APK v1.1

Projeto Android pronto para gerar um APK pelo GitHub Actions e usar o celular como ponte de telemetria do Gran Turismo 7.

Fluxo desejado:

PS5 / GT7 -> Celular Android com este APK -> gt7.online

## O que o app faz

- Recebe a telemetria UDP do GT7 direto no Android.
- Envia heartbeat para o PS5.
- Decodifica os pacotes conhecidos do GT7.
- Abre uma API local em `http://127.0.0.1:8787`.
- Abre WebSocket local em `ws://127.0.0.1:8787/ws`.
- Entrega os campos principais para o gt7.online.

## Campos entregues para o gt7.online

- velocidade
- RPM
- marcha
- acelerador
- freio
- combustível
- melhor volta
- tempo total de corrida
- número de voltas completadas
- chuva
- controle de tração
- número de paradas
- mapa/rastro por coordenadas

Observação importante: chuva e controle de tração ficam disponíveis no schema e na API. Quando o pacote UDP não enviar esses dados de forma confiável, os campos voltam como nulo ou manual. Assim o gt7.online não quebra.

## Endpoints locais

- `/api/fields` — campos simplificados para o gt7.online.
- `/api/gt7-online` — estrutura organizada para integração.
- `/api/telemetry` — pacote completo decodificado.
- `/api/map` — rastro de coordenadas.
- `/api/schema` — lista de campos e endpoints.
- `/ws` — WebSocket em tempo real.

## Como gerar o APK pelo celular usando GitHub

1. Crie um repositório no GitHub, por exemplo `gt7-bridge-mobile`.
2. Envie todos os arquivos desta pasta para o repositório.
3. Abra a aba `Actions` do repositório.
4. Abra o workflow `Gerar APK Android`.
5. Toque em `Run workflow`.
6. Aguarde terminar.
7. Entre na execução finalizada e baixe o artefato `GT7-Bridge-Mobile-APK-v1.1`.
8. Dentro do ZIP do artefato estará o `app-debug.apk`.
9. Instale no celular Android.

## Como usar depois de instalar

1. Celular e PS5 precisam estar no mesmo Wi-Fi.
2. Abra o app `GT7 Bridge Mobile`.
3. Digite o IP do PS5.
4. Toque em `Iniciar Bridge`.
5. Abra o GT7 e entre em uma corrida.
6. No navegador do mesmo celular, teste:

`http://127.0.0.1:8787/api/fields`

7. No gt7.online, use a origem local:

`http://127.0.0.1:8787/api/fields`

## Avisos

- Não use o Victory ao mesmo tempo, porque outro app pode ocupar a telemetria.
- Mantenha o app com a notificação ativa enquanto joga.
- Se o Android matar o app em segundo plano, desative a otimização de bateria para ele.
- Se não receber pacotes, confirme o IP do PS5 e se o celular está no mesmo Wi-Fi.
