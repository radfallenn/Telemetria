package br.com.studiorad.gt7bridge;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;
import java.util.concurrent.CopyOnWriteArrayList;

public class Gt7BridgeService extends Service {
    public static final String ACTION_START = "br.com.studiorad.gt7bridge.START";
    public static final String ACTION_STOP = "br.com.studiorad.gt7bridge.STOP";

    private static final int NOTIFICATION_ID = 7007;
    private static final String CHANNEL_ID = "gt7_bridge_channel";
    private static final int HTTP_PORT = 8787;
    private static final int UDP_RECEIVE_PORT = 33740;
    private static final int UDP_SEND_PORT = 33739;

    private static volatile boolean running = false;
    private static volatile String currentPs5Ip = "--";
    private static volatile long lastPacketAtMs = 0;
    private static volatile JSONObject latestTelemetry = null;
    private static volatile JSONObject latestFields = emptyFields();
    private static volatile String lastError = null;
    private static volatile String readableTelemetry = "Aguardando dados do GT7...";

    private UdpLoop udpLoop;
    private MiniHttpServer httpServer;
    private PowerManager.WakeLock wakeLock;

    private final SessionState sessionState = new SessionState();
    private final CopyOnWriteArrayList<WebSocketClient> wsClients = new CopyOnWriteArrayList<>();

    @Override public IBinder onBind(Intent intent) { return null; }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        if (ACTION_STOP.equals(action)) {
            stopBridge();
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }
        if (ACTION_START.equals(action)) {
            String ip = intent.getStringExtra("ps5_ip");
            if (ip == null || ip.trim().isEmpty()) ip = getSharedPreferences("gt7_bridge", MODE_PRIVATE).getString("ps5_ip", "192.168.1.100");
            getSharedPreferences("gt7_bridge", MODE_PRIVATE).edit().putString("ps5_ip", ip).apply();
            startForeground(NOTIFICATION_ID, buildNotification("Iniciando bridge..."));
            startBridge(ip.trim());
            return START_STICKY;
        }
        return START_NOT_STICKY;
    }

    @Override public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override public void onDestroy() {
        stopBridge();
        super.onDestroy();
    }

    private synchronized void startBridge(String ps5Ip) {
        stopBridge();
        currentPs5Ip = ps5Ip;
        lastError = null;
        lastPacketAtMs = 0;
        latestTelemetry = null;
        latestFields = emptyFields();
        readableTelemetry = "Bridge rodando. Aguardando dados do GT7...";
        sessionState.reset();
        running = true;

        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "GT7Bridge:TelemetryWakeLock");
            wakeLock.acquire(6 * 60 * 60 * 1000L);
        } catch (Exception ignored) {}

        httpServer = new MiniHttpServer(this, HTTP_PORT, wsClients);
        httpServer.start();
        udpLoop = new UdpLoop(ps5Ip);
        udpLoop.start();
        notifyText("GT7 Bridge ativo");
    }

    private synchronized void stopBridge() {
        running = false;
        if (udpLoop != null) { udpLoop.shutdown(); udpLoop = null; }
        if (httpServer != null) { httpServer.shutdown(); httpServer = null; }
        for (WebSocketClient c : wsClients) c.closeQuietly();
        wsClients.clear();
        try { if (wakeLock != null && wakeLock.isHeld()) wakeLock.release(); } catch (Exception ignored) {}
        wakeLock = null;
        readableTelemetry = "Bridge parado.";
    }

    private void onPacket(byte[] packet, InetAddress source) {
        byte[] decrypted = decryptPacket(packet);
        if (decrypted == null) return;
        JSONObject telemetry = parseTelemetry(decrypted, packet.length, source);
        if (telemetry == null) return;
        latestTelemetry = telemetry;
        latestFields = telemetry.optJSONObject("gt7Online").optJSONObject("camposPrincipais");
        lastPacketAtMs = System.currentTimeMillis();
        readableTelemetry = buildReadable(latestFields);
        JSONObject message = new JSONObject();
        try {
            message.put("type", "telemetry");
            message.put("data", telemetry);
        } catch (Exception ignored) {}
        broadcast(message.toString());
    }

    private void broadcast(String text) {
        for (WebSocketClient c : wsClients) {
            if (!c.sendText(text)) wsClients.remove(c);
        }
    }

    private JSONObject parseTelemetry(byte[] buf, int encryptedSize, InetAddress source) {
        if (buf.length < 0x93) return null;
        long nowMs = System.currentTimeMillis();
        float speedMs = safeFloat(buf, 0x4c, 0f);
        double speedKph = round(speedMs * 3.6, 2);
        double rpm = round(safeFloat(buf, 0x3c, 0f), 1);
        int gearByte = safeUInt8(buf, 0x90);
        int currentGear = gearByte & 0x0f;
        int suggestedGear = (gearByte >> 4) & 0x0f;
        int throttleRaw = safeUInt8(buf, 0x91);
        int brakeRaw = safeUInt8(buf, 0x92);
        double throttlePercent = round((throttleRaw / 255.0) * 100.0, 1);
        double brakePercent = round((brakeRaw / 255.0) * 100.0, 1);
        Float fuelLevel = safeFloatObj(buf, 0x44);
        Float fuelCapacity = safeFloatObj(buf, 0x48);
        Double fuelPercent = deriveFuelPercent(fuelLevel, fuelCapacity);
        int lapCount = safeInt16(buf, 0x74, 0);
        int totalLaps = safeInt16(buf, 0x76, 0);
        int bestLapMs = safeInt32(buf, 0x78, -1);
        int lastLapMs = safeInt32(buf, 0x7c, -1);
        Integer currentLapMs = buf.length >= 0x144 ? safeInt32(buf, 0x140, -1) : null;
        double[] position = readFloatArray(buf, 0x04, 3);
        double heading = safeFloat(buf, 0x28, 0f);

        SessionDerived derived = sessionState.update(nowMs, lapCount, lastLapMs, currentLapMs, speedKph, fuelLevel, position, heading);
        Double rain = getManualRain();
        Integer traction = getManualTraction();

        try {
            JSONObject telemetry = new JSONObject();
            telemetry.put("timestamp", iso(nowMs));
            telemetry.put("sourceIp", source != null ? source.getHostAddress() : JSONObject.NULL);
            telemetry.put("app", "GT7 Bridge Mobile APK");
            telemetry.put("version", "v1.1");
            telemetry.put("encryptedSize", encryptedSize);
            telemetry.put("decryptedSize", buf.length);
            telemetry.put("packetId", safeInt32(buf, 0x70, 0));

            telemetry.put("speedMs", round(speedMs, 4));
            telemetry.put("speedKph", speedKph);
            telemetry.put("velocidade", speedKph);
            telemetry.put("rpm", rpm);
            telemetry.put("currentGear", currentGear);
            telemetry.put("marcha", currentGear);
            telemetry.put("marchaTexto", formatGear(currentGear));
            telemetry.put("suggestedGear", suggestedGear);
            telemetry.put("suggestedGearText", formatGear(suggestedGear));
            telemetry.put("throttleRaw", throttleRaw);
            telemetry.put("brakeRaw", brakeRaw);
            telemetry.put("throttlePercent", throttlePercent);
            telemetry.put("brakePercent", brakePercent);
            telemetry.put("aceleradorPercent", throttlePercent);
            telemetry.put("freioPercent", brakePercent);
            putNullable(telemetry, "fuelLevel", fuelLevel);
            putNullable(telemetry, "fuelCapacity", fuelCapacity);
            putNullable(telemetry, "fuelPercent", fuelPercent);
            putNullable(telemetry, "combustivelLitros", fuelLevel);
            putNullable(telemetry, "combustivelPercent", fuelPercent);
            telemetry.put("lapCount", lapCount);
            telemetry.put("voltasCompletadas", derived.completedLaps);
            telemetry.put("totalLaps", totalLaps);
            telemetry.put("bestLapMs", bestLapMs);
            telemetry.put("bestLap", msToTime(bestLapMs));
            telemetry.put("melhorVolta", msToTime(bestLapMs));
            telemetry.put("lastLapMs", lastLapMs);
            telemetry.put("lastLap", msToTime(lastLapMs));
            putNullable(telemetry, "currentLapMs", currentLapMs);
            telemetry.put("currentLap", msToTime(currentLapMs));
            telemetry.put("totalRaceTimeMs", derived.totalRaceTimeMs);
            telemetry.put("totalRaceTime", msToTime(derived.totalRaceTimeMs));
            telemetry.put("tempoTotalCorridaMs", derived.totalRaceTimeMs);
            telemetry.put("tempoTotalCorrida", msToTime(derived.totalRaceTimeMs));
            telemetry.put("numeroParadas", derived.pitStopCount);
            putNullable(telemetry, "chuva", rain);
            putNullable(telemetry, "controleTracao", traction);
            telemetry.put("position", toJsonArray(position));
            telemetry.put("mapa", derived.mapJson);

            JSONObject gt7Online = new JSONObject();
            gt7Online.put("versao", "GT7 Bridge Mobile APK v1.1");
            gt7Online.put("fonte", "Android UDP Bridge");
            gt7Online.put("timestamp", iso(nowMs));
            gt7Online.put("conectado", true);

            JSONObject velocidade = new JSONObject();
            velocidade.put("kph", speedKph);
            velocidade.put("ms", round(speedMs, 4));
            velocidade.put("texto", Math.round(speedKph) + " km/h");
            gt7Online.put("velocidade", velocidade);
            gt7Online.put("rpm", rpm);
            JSONObject marcha = new JSONObject();
            marcha.put("atual", currentGear);
            marcha.put("atualTexto", formatGear(currentGear));
            marcha.put("sugerida", suggestedGear);
            marcha.put("sugeridaTexto", formatGear(suggestedGear));
            gt7Online.put("marcha", marcha);
            gt7Online.put("acelerador", new JSONObject().put("raw", throttleRaw).put("percentual", throttlePercent));
            gt7Online.put("freio", new JSONObject().put("raw", brakeRaw).put("percentual", brakePercent));
            JSONObject comb = new JSONObject();
            putNullable(comb, "litros", fuelLevel);
            putNullable(comb, "capacidadeLitros", fuelCapacity);
            putNullable(comb, "percentual", fuelPercent);
            comb.put("texto", fuelLevel != null ? round(fuelLevel, 2) + " L" : JSONObject.NULL);
            gt7Online.put("combustivel", comb);
            gt7Online.put("melhorVolta", new JSONObject().put("ms", bestLapMs).put("texto", msToTime(bestLapMs)));
            gt7Online.put("tempoTotalCorrida", new JSONObject().put("ms", derived.totalRaceTimeMs).put("texto", msToTime(derived.totalRaceTimeMs)).put("fonte", "voltas + volta_atual"));
            gt7Online.put("numeroVoltasCompletadas", derived.completedLaps);
            gt7Online.put("chuva", new JSONObject().put("valor", rain == null ? JSONObject.NULL : rain).put("percentual", rain == null ? JSONObject.NULL : rain).put("disponivel", rain != null).put("fonte", rain != null ? "manual" : "nulo"));
            gt7Online.put("controleTracao", new JSONObject().put("nivel", traction == null ? JSONObject.NULL : traction).put("disponivel", traction != null).put("fonte", traction != null ? "manual" : "nulo"));
            gt7Online.put("numeroParadas", derived.pitStopCount);
            gt7Online.put("mapa", derived.mapJson);

            JSONObject campos = new JSONObject();
            campos.put("ok", true);
            campos.put("timestamp", iso(nowMs));
            campos.put("velocidade", speedKph);
            campos.put("rpm", rpm);
            campos.put("marcha", formatGear(currentGear));
            campos.put("acelerador", throttlePercent);
            campos.put("freio", brakePercent);
            campos.put("combustivel", fuelPercent != null ? fuelPercent : fuelLevel);
            campos.put("melhorVolta", msToTime(bestLapMs));
            campos.put("tempoTotalCorrida", msToTime(derived.totalRaceTimeMs));
            campos.put("numeroVoltasCompletadas", derived.completedLaps);
            putNullable(campos, "chuva", rain);
            putNullable(campos, "controleTracao", traction);
            campos.put("numeroParadas", derived.pitStopCount);
            campos.put("mapa", derived.currentMapPoint != null ? derived.currentMapPoint : JSONObject.NULL);
            campos.put("rastroTotal", derived.trailSize);
            gt7Online.put("camposPrincipais", campos);
            telemetry.put("gt7Online", gt7Online);
            return telemetry;
        } catch (Exception e) {
            lastError = e.getMessage();
            return null;
        }
    }

    private Double getManualRain() {
        try {
            String s = getSharedPreferences("gt7_bridge", MODE_PRIVATE).getString("rain", null);
            if (s == null || s.trim().isEmpty()) return null;
            return Double.parseDouble(s);
        } catch (Exception e) { return null; }
    }

    private Integer getManualTraction() {
        try {
            String s = getSharedPreferences("gt7_bridge", MODE_PRIVATE).getString("traction", null);
            if (s == null || s.trim().isEmpty()) return null;
            return Integer.parseInt(s);
        } catch (Exception e) { return null; }
    }

    private class UdpLoop extends Thread {
        private final String ps5Ip;
        private volatile boolean keepRunning = true;
        private DatagramSocket socket;
        private long lastHeartbeat = 0;
        UdpLoop(String ps5Ip) { this.ps5Ip = ps5Ip; setName("GT7-UDP-Loop"); }
        void shutdown() { keepRunning = false; try { if (socket != null) socket.close(); } catch (Exception ignored) {} }
        @Override public void run() {
            try {
                socket = new DatagramSocket(null);
                socket.setReuseAddress(true);
                socket.bind(new InetSocketAddress(UDP_RECEIVE_PORT));
                socket.setSoTimeout(500);
                InetAddress ps = InetAddress.getByName(ps5Ip);
                byte[] buffer = new byte[2048];
                while (keepRunning && running) {
                    long now = System.currentTimeMillis();
                    if (now - lastHeartbeat >= 1000) {
                        byte[] hb = "A".getBytes(StandardCharsets.UTF_8);
                        socket.send(new DatagramPacket(hb, hb.length, ps, UDP_SEND_PORT));
                        lastHeartbeat = now;
                    }
                    try {
                        DatagramPacket p = new DatagramPacket(buffer, buffer.length);
                        socket.receive(p);
                        byte[] data = new byte[p.getLength()];
                        System.arraycopy(p.getData(), p.getOffset(), data, 0, p.getLength());
                        onPacket(data, p.getAddress());
                    } catch (java.net.SocketTimeoutException ignored) {}
                }
            } catch (Exception e) {
                lastError = e.getMessage();
                readableTelemetry = "Erro UDP: " + e.getMessage();
            } finally {
                try { if (socket != null) socket.close(); } catch (Exception ignored) {}
            }
        }
    }

    private static class MiniHttpServer extends Thread {
        private final Gt7BridgeService service;
        private final int port;
        private final CopyOnWriteArrayList<WebSocketClient> clients;
        private volatile boolean keepRunning = true;
        private ServerSocket serverSocket;
        MiniHttpServer(Gt7BridgeService service, int port, CopyOnWriteArrayList<WebSocketClient> clients) {
            this.service = service; this.port = port; this.clients = clients; setName("GT7-HTTP-Server");
        }
        void shutdown() { keepRunning = false; try { if (serverSocket != null) serverSocket.close(); } catch (Exception ignored) {} }
        @Override public void run() {
            try {
                serverSocket = new ServerSocket();
                serverSocket.setReuseAddress(true);
                serverSocket.bind(new InetSocketAddress(port));
                while (keepRunning && running) {
                    Socket socket = serverSocket.accept();
                    new Thread(() -> handle(socket), "GT7-HTTP-Client").start();
                }
            } catch (Exception e) { lastError = e.getMessage(); }
        }
        private void handle(Socket socket) {
            try {
                socket.setSoTimeout(5000);
                InputStream in = new BufferedInputStream(socket.getInputStream());
                OutputStream out = socket.getOutputStream();
                ByteArrayOutputStream headerBytes = new ByteArrayOutputStream();
                int matched = 0;
                while (true) {
                    int b = in.read();
                    if (b < 0) break;
                    headerBytes.write(b);
                    if ((matched == 0 && b == '\r') || (matched == 1 && b == '\n') || (matched == 2 && b == '\r') || (matched == 3 && b == '\n')) matched++; else matched = 0;
                    if (matched == 4 || headerBytes.size() > 16384) break;
                }
                String headers = headerBytes.toString("UTF-8");
                String[] lines = headers.split("\\r?\\n");
                if (lines.length == 0) { socket.close(); return; }
                String[] first = lines[0].split(" ");
                String method = first.length > 0 ? first[0] : "GET";
                String path = first.length > 1 ? first[1] : "/";
                String lower = headers.toLowerCase(Locale.US);
                int contentLength = 0;
                for (String l : lines) if (l.toLowerCase(Locale.US).startsWith("content-length:")) contentLength = Integer.parseInt(l.split(":", 2)[1].trim());
                byte[] body = new byte[Math.max(0, contentLength)];
                int read = 0;
                while (read < body.length) {
                    int n = in.read(body, read, body.length - read);
                    if (n < 0) break;
                    read += n;
                }
                if ("OPTIONS".equalsIgnoreCase(method)) { send(out, 204, "text/plain", ""); socket.close(); return; }
                if (path.startsWith("/ws") && lower.contains("upgrade: websocket")) {
                    String key = null;
                    for (String l : lines) if (l.toLowerCase(Locale.US).startsWith("sec-websocket-key:")) key = l.split(":", 2)[1].trim();
                    if (key == null) { send(out, 400, "text/plain", "missing websocket key"); socket.close(); return; }
                    String accept = Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-1").digest((key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").getBytes(StandardCharsets.UTF_8)));
                    String response = "HTTP/1.1 101 Switching Protocols\r\n" +
                            "Upgrade: websocket\r\n" +
                            "Connection: Upgrade\r\n" +
                            "Sec-WebSocket-Accept: " + accept + "\r\n\r\n";
                    out.write(response.getBytes(StandardCharsets.UTF_8)); out.flush();
                    WebSocketClient client = new WebSocketClient(socket, out);
                    clients.add(client);
                    client.sendText(new JSONObject().put("type", "status").put("data", statusJson()).toString());
                    while (keepRunning && running && !socket.isClosed()) {
                        int b = in.read();
                        if (b < 0) break;
                        // discard incoming frames; this bridge only broadcasts telemetry.
                    }
                    clients.remove(client);
                    client.closeQuietly();
                    return;
                }
                if ("POST".equalsIgnoreCase(method) && path.startsWith("/api/manual")) {
                    try {
                        JSONObject json = new JSONObject(new String(body, StandardCharsets.UTF_8));
                        if (json.has("chuva")) service.getSharedPreferences("gt7_bridge", Context.MODE_PRIVATE).edit().putString("rain", String.valueOf(json.optDouble("chuva"))).apply();
                        if (json.has("controleTracao")) service.getSharedPreferences("gt7_bridge", Context.MODE_PRIVATE).edit().putString("traction", String.valueOf(json.optInt("controleTracao"))).apply();
                        send(out, 200, "application/json", new JSONObject().put("ok", true).toString());
                    } catch (Exception e) { send(out, 400, "application/json", new JSONObject().put("ok", false).put("error", e.getMessage()).toString()); }
                    socket.close(); return;
                }
                String cleanPath = path.split("\\?")[0];
                String contentType = "application/json";
                String response;
                if ("/".equals(cleanPath)) { contentType = "text/html; charset=utf-8"; response = dashboardHtml(); }
                else if ("/api/status".equals(cleanPath) || "/api/health".equals(cleanPath)) response = statusJson().toString();
                else if ("/api/fields".equals(cleanPath)) response = latestFields.toString();
                else if ("/api/gt7-online".equals(cleanPath)) response = gt7OnlineJson().toString();
                else if ("/api/telemetry".equals(cleanPath) || "/api/latest".equals(cleanPath)) response = latestTelemetry != null ? latestTelemetry.toString() : emptyTelemetry().toString();
                else if ("/api/map".equals(cleanPath)) response = service.sessionState.mapResponse().toString();
                else if ("/api/schema".equals(cleanPath)) response = schemaJson().toString();
                else { send(out, 404, "application/json", new JSONObject().put("ok", false).put("error", "not_found").toString()); socket.close(); return; }
                send(out, 200, contentType, response);
                socket.close();
            } catch (Exception e) {
                try { socket.close(); } catch (Exception ignored) {}
            }
        }
        private void send(OutputStream out, int code, String type, String body) throws Exception {
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            String text = "HTTP/1.1 " + code + " OK\r\n" +
                    "Content-Type: " + type + "\r\n" +
                    "Access-Control-Allow-Origin: *\r\n" +
                    "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n" +
                    "Access-Control-Allow-Headers: Content-Type, Authorization, Access-Control-Request-Private-Network\r\n" +
                    "Access-Control-Allow-Private-Network: true\r\n" +
                    "Cache-Control: no-store\r\n" +
                    "Connection: close\r\n" +
                    "Content-Length: " + bytes.length + "\r\n\r\n";
            out.write(text.getBytes(StandardCharsets.UTF_8)); out.write(bytes); out.flush();
        }
    }

    private static class WebSocketClient {
        private final Socket socket;
        private final OutputStream out;
        WebSocketClient(Socket socket, OutputStream out) { this.socket = socket; this.out = out; }
        synchronized boolean sendText(String text) {
            try {
                byte[] data = text.getBytes(StandardCharsets.UTF_8);
                ByteArrayOutputStream frame = new ByteArrayOutputStream();
                frame.write(0x81);
                if (data.length < 126) frame.write(data.length);
                else if (data.length <= 65535) { frame.write(126); frame.write((data.length >> 8) & 0xff); frame.write(data.length & 0xff); }
                else { frame.write(127); for (int i = 7; i >= 0; i--) frame.write((data.length >> (8 * i)) & 0xff); }
                frame.write(data);
                out.write(frame.toByteArray()); out.flush(); return true;
            } catch (Exception e) { closeQuietly(); return false; }
        }
        void closeQuietly() { try { socket.close(); } catch (Exception ignored) {} }
    }

    private static class SessionState {
        long sessionStartedAtMs;
        long totalCompletedLapMs;
        int lastLapCount = -1;
        int lastLastLapMs = -1;
        int pitStopCount = 0;
        long lastPitStopAtMs = 0;
        Float lastFuel = null;
        double maxSpeed = 0;
        long lastMapPointAtMs = 0;
        final List<JSONObject> trail = Collections.synchronizedList(new ArrayList<>());
        void reset() { sessionStartedAtMs = System.currentTimeMillis(); totalCompletedLapMs = 0; lastLapCount = -1; lastLastLapMs = -1; pitStopCount = 0; lastPitStopAtMs = 0; lastFuel = null; maxSpeed = 0; lastMapPointAtMs = 0; trail.clear(); }
        SessionDerived update(long nowMs, int lapCount, int lastLapMs, Integer currentLapMs, double speedKph, Float fuel, double[] position, double heading) {
            if (sessionStartedAtMs <= 0) sessionStartedAtMs = nowMs;
            if (lapCount >= 0) {
                if (lastLapCount < 0) lastLapCount = lapCount;
                else if (lapCount > lastLapCount) {
                    int valid = safeMs(lastLapMs);
                    if (valid > 0 && lastLapMs != lastLastLapMs) { totalCompletedLapMs += valid; lastLastLapMs = lastLapMs; }
                    lastLapCount = lapCount;
                } else if (lapCount < lastLapCount) { lastLapCount = lapCount; totalCompletedLapMs = 0; trail.clear(); }
            }
            if (fuel != null) {
                if (lastFuel != null && fuel - lastFuel > 5.0 && nowMs - lastPitStopAtMs > 15000) { pitStopCount++; lastPitStopAtMs = nowMs; }
                lastFuel = fuel;
            }
            maxSpeed = Math.max(maxSpeed, speedKph);
            JSONObject current = null;
            if (position != null && position.length >= 3 && isFinite(position[0]) && isFinite(position[1]) && isFinite(position[2])) {
                try {
                    current = new JSONObject();
                    current.put("timestamp", iso(nowMs));
                    current.put("x", round(position[0], 3));
                    current.put("y", round(position[1], 3));
                    current.put("z", round(position[2], 3));
                    current.put("heading", round(heading, 5));
                    current.put("speedKph", round(speedKph, 2));
                    if (nowMs - lastMapPointAtMs >= 250) {
                        trail.add(current);
                        lastMapPointAtMs = nowMs;
                        while (trail.size() > 2400) trail.remove(0);
                    }
                } catch (Exception ignored) {}
            }
            int curr = safeMs(currentLapMs);
            long elapsed = nowMs - sessionStartedAtMs;
            long totalRace = curr >= 0 ? totalCompletedLapMs + curr : elapsed;
            JSONObject mapJson = new JSONObject();
            try {
                mapJson.put("pontoAtual", current != null ? current : JSONObject.NULL);
                JSONArray arr = new JSONArray();
                synchronized (trail) {
                    int start = Math.max(0, trail.size() - 600);
                    for (int i = start; i < trail.size(); i++) arr.put(trail.get(i));
                }
                mapJson.put("rastro", arr);
                mapJson.put("observacao", "Rastro criado pelas coordenadas x, y, z da telemetria.");
            } catch (Exception ignored) {}
            return new SessionDerived(totalRace, Math.max(0, lapCount), pitStopCount, current, mapJson, trail.size());
        }
        JSONObject mapResponse() {
            JSONObject o = new JSONObject();
            try {
                o.put("ok", true);
                JSONArray arr = new JSONArray();
                synchronized (trail) { for (JSONObject p : trail) arr.put(p); }
                o.put("rastro", arr);
                o.put("total", trail.size());
            } catch (Exception ignored) {}
            return o;
        }
    }

    private static class SessionDerived {
        final long totalRaceTimeMs; final int completedLaps; final int pitStopCount; final JSONObject currentMapPoint; final JSONObject mapJson; final int trailSize;
        SessionDerived(long totalRaceTimeMs, int completedLaps, int pitStopCount, JSONObject currentMapPoint, JSONObject mapJson, int trailSize) {
            this.totalRaceTimeMs = totalRaceTimeMs; this.completedLaps = completedLaps; this.pitStopCount = pitStopCount; this.currentMapPoint = currentMapPoint; this.mapJson = mapJson; this.trailSize = trailSize;
        }
    }

    private static byte[] decryptPacket(byte[] buffer) {
        if (buffer == null || buffer.length < 0x44) return null;
        byte[] keySource = "Simulator Interface Packet GT7 ver 0.0".getBytes(StandardCharsets.US_ASCII);
        byte[] key = new byte[32]; System.arraycopy(keySource, 0, key, 0, 32);
        long iv1 = readUInt32LE(buffer, 0x40);
        long[] xorCandidates = new long[]{0xDEADBEAFL, 0xDEADBEEFL, 0x55FABB4FL};
        for (long xor : xorCandidates) {
            long iv2 = (iv1 ^ xor) & 0xffffffffL;
            byte[] nonce = new byte[8];
            writeUInt32LE(nonce, 0, iv2); writeUInt32LE(nonce, 4, iv1);
            byte[] out = salsa20Xor(buffer, key, nonce);
            if (out.length >= 4 && readUInt32LE(out, 0) == 0x47375330L) return out;
        }
        return null;
    }

    private static byte[] salsa20Xor(byte[] input, byte[] key, byte[] nonce) {
        byte[] output = new byte[input.length];
        long counter = 0;
        for (int offset = 0; offset < input.length; offset += 64) {
            byte[] block = salsa20Block(key, nonce, counter++);
            int end = Math.min(64, input.length - offset);
            for (int i = 0; i < end; i++) output[offset + i] = (byte)(input[offset + i] ^ block[i]);
        }
        return output;
    }

    private static byte[] salsa20Block(byte[] key, byte[] nonce, long counter) {
        int[] state = new int[16];
        byte[] sigma = "expand 32-byte k".getBytes(StandardCharsets.US_ASCII);
        state[0] = readIntLE(sigma, 0); state[5] = readIntLE(sigma, 4); state[10] = readIntLE(sigma, 8); state[15] = readIntLE(sigma, 12);
        for (int i = 0; i < 4; i++) state[1 + i] = readIntLE(key, i * 4);
        for (int i = 0; i < 4; i++) state[11 + i] = readIntLE(key, 16 + i * 4);
        state[6] = readIntLE(nonce, 0); state[7] = readIntLE(nonce, 4); state[8] = (int)counter; state[9] = (int)(counter >>> 32);
        int[] x = state.clone();
        for (int i = 0; i < 10; i++) {
            qr(x, 0, 4, 8, 12); qr(x, 5, 9, 13, 1); qr(x, 10, 14, 2, 6); qr(x, 15, 3, 7, 11);
            qr(x, 0, 1, 2, 3); qr(x, 5, 6, 7, 4); qr(x, 10, 11, 8, 9); qr(x, 15, 12, 13, 14);
        }
        byte[] out = new byte[64];
        for (int i = 0; i < 16; i++) writeIntLE(out, i * 4, x[i] + state[i]);
        return out;
    }
    private static void qr(int[] x, int a, int b, int c, int d) { x[b] ^= rotl(x[a] + x[d], 7); x[c] ^= rotl(x[b] + x[a], 9); x[d] ^= rotl(x[c] + x[b], 13); x[a] ^= rotl(x[d] + x[c], 18); }
    private static int rotl(int v, int c) { return (v << c) | (v >>> (32 - c)); }
    private static int readIntLE(byte[] b, int o) { return (b[o] & 255) | ((b[o+1] & 255) << 8) | ((b[o+2] & 255) << 16) | ((b[o+3] & 255) << 24); }
    private static long readUInt32LE(byte[] b, int o) { return readIntLE(b, o) & 0xffffffffL; }
    private static void writeIntLE(byte[] b, int o, int v) { b[o]=(byte)v; b[o+1]=(byte)(v>>>8); b[o+2]=(byte)(v>>>16); b[o+3]=(byte)(v>>>24); }
    private static void writeUInt32LE(byte[] b, int o, long v) { writeIntLE(b, o, (int)v); }

    private static float safeFloat(byte[] buf, int offset, float fallback) { try { return ByteBuffer.wrap(buf, offset, 4).order(ByteOrder.LITTLE_ENDIAN).getFloat(); } catch (Exception e) { return fallback; } }
    private static Float safeFloatObj(byte[] buf, int offset) { try { return ByteBuffer.wrap(buf, offset, 4).order(ByteOrder.LITTLE_ENDIAN).getFloat(); } catch (Exception e) { return null; } }
    private static int safeInt32(byte[] buf, int offset, int fallback) { try { return ByteBuffer.wrap(buf, offset, 4).order(ByteOrder.LITTLE_ENDIAN).getInt(); } catch (Exception e) { return fallback; } }
    private static int safeInt16(byte[] buf, int offset, int fallback) { try { return ByteBuffer.wrap(buf, offset, 2).order(ByteOrder.LITTLE_ENDIAN).getShort(); } catch (Exception e) { return fallback; } }
    private static int safeUInt8(byte[] buf, int offset) { try { return buf[offset] & 0xff; } catch (Exception e) { return 0; } }
    private static double[] readFloatArray(byte[] buf, int offset, int count) { double[] arr = new double[count]; for (int i=0;i<count;i++) arr[i]=round(safeFloat(buf, offset+i*4, 0), 4); return arr; }
    private static JSONArray toJsonArray(double[] arr) { JSONArray a = new JSONArray(); try { for (double v : arr) a.put(v); } catch (Exception ignored) {} return a; }
    private static Double deriveFuelPercent(Float level, Float cap) { if (level == null || cap == null || cap <= 0) return null; return round((level / cap) * 100.0, 2); }
    private static int safeMs(Integer value) { return value == null || value < 0 || value > 24*60*60*1000 ? -1 : value; }
    private static String msToTime(Integer ms) { return msToTime(ms == null ? -1 : ms.longValue()); }
    private static String msToTime(long ms) { if (ms < 0) return "--"; long total = ms / 1000; long millis = ms % 1000; long h = total / 3600; long m = (total % 3600) / 60; long s = total % 60; return h > 0 ? String.format(Locale.US, "%d:%02d:%02d.%03d", h,m,s,millis) : String.format(Locale.US, "%d:%02d.%03d", m,s,millis); }
    private static String formatGear(int g) { if (g == 0) return "N"; if (g == 15) return "R"; return String.valueOf(g); }
    private static double round(double v, int p) { double m = Math.pow(10, p); return Math.round(v*m)/m; }
    private static boolean isFinite(double v) { return !Double.isNaN(v) && !Double.isInfinite(v); }
    private static void putNullable(JSONObject o, String key, Object value) { try { o.put(key, value == null ? JSONObject.NULL : value); } catch (Exception ignored) {} }
    private static String iso(long ms) { SimpleDateFormat fmt = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US); fmt.setTimeZone(TimeZone.getTimeZone("UTC")); return fmt.format(new Date(ms)); }

    private static JSONObject emptyFields() {
        JSONObject o = new JSONObject();
        try { o.put("ok", false); o.put("message", "Nenhum pacote recebido ainda."); o.put("velocidade", JSONObject.NULL); o.put("rpm", JSONObject.NULL); o.put("marcha", JSONObject.NULL); o.put("acelerador", JSONObject.NULL); o.put("freio", JSONObject.NULL); o.put("combustivel", JSONObject.NULL); o.put("melhorVolta", JSONObject.NULL); o.put("tempoTotalCorrida", JSONObject.NULL); o.put("numeroVoltasCompletadas", JSONObject.NULL); o.put("chuva", JSONObject.NULL); o.put("controleTracao", JSONObject.NULL); o.put("numeroParadas", JSONObject.NULL); o.put("mapa", JSONObject.NULL); }
        catch (Exception ignored) {}
        return o;
    }
    private static JSONObject emptyTelemetry() { JSONObject o = new JSONObject(); try { o.put("ok", false); o.put("message", "Nenhum pacote recebido ainda."); o.put("fields", latestFields); } catch (Exception ignored) {} return o; }
    private static JSONObject statusJson() { JSONObject o = new JSONObject(); try { o.put("ok", true); o.put("running", running); o.put("ps5Ip", currentPs5Ip); o.put("lastPacketAt", lastPacketAtMs > 0 ? iso(lastPacketAtMs) : JSONObject.NULL); o.put("lastPacketAgeMs", getLastPacketAgeMs()); o.put("lastError", lastError == null ? JSONObject.NULL : lastError); o.put("httpPort", HTTP_PORT); o.put("udpReceivePort", UDP_RECEIVE_PORT); o.put("udpSendPort", UDP_SEND_PORT); } catch (Exception ignored) {} return o; }
    private static JSONObject gt7OnlineJson() { try { return latestTelemetry != null ? latestTelemetry.optJSONObject("gt7Online") : new JSONObject().put("ok", false).put("camposPrincipais", latestFields); } catch (Exception e) { return new JSONObject(); } }
    private static JSONObject schemaJson() { JSONObject o = new JSONObject(); try { o.put("app", "gt7.online"); o.put("bridge", "GT7 Bridge Mobile APK"); o.put("version", "v1.1"); o.put("apiFields", "/api/fields"); o.put("apiTelemetry", "/api/telemetry"); o.put("apiGt7Online", "/api/gt7-online"); o.put("websocket", "/ws"); JSONArray f = new JSONArray(); for (String s : new String[]{"velocidade","rpm","marcha","acelerador","freio","combustivel","melhorVolta","tempoTotalCorrida","numeroVoltasCompletadas","chuva","controleTracao","numeroParadas","mapa"}) f.put(s); o.put("fields", f); } catch (Exception ignored) {} return o; }
    private static String buildReadable(JSONObject f) { if (f == null) return "Aguardando dados do GT7..."; return "Velocidade: " + f.opt("velocidade") + " km/h\nRPM: " + f.opt("rpm") + "\nMarcha: " + f.opt("marcha") + "\nAcelerador: " + f.opt("acelerador") + "%\nFreio: " + f.opt("freio") + "%\nCombustível: " + f.opt("combustivel") + "\nMelhor volta: " + f.opt("melhorVolta") + "\nTempo total: " + f.opt("tempoTotalCorrida") + "\nVoltas: " + f.opt("numeroVoltasCompletadas") + "\nParadas: " + f.opt("numeroParadas"); }
    private static String dashboardHtml() { return "<!doctype html><html><head><meta name=viewport content='width=device-width,initial-scale=1'><title>GT7 Bridge Mobile</title><style>body{font-family:system-ui;background:#eef1f6;color:#111827;margin:0;padding:20px}.card{background:#fff;border-radius:22px;padding:18px;box-shadow:0 16px 40px #0002;max-width:760px;margin:auto}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.box{background:#f8fafc;border:1px solid #e5e7eb;border-radius:16px;padding:14px}.k{color:#667085;font-size:12px}.v{font-size:28px;font-weight:900}pre{white-space:pre-wrap;background:#111827;color:#fff;border-radius:14px;padding:12px}@media(max-width:560px){.grid{grid-template-columns:1fr}}</style></head><body><div class=card><h1>GT7 Bridge Mobile</h1><p>API local para gt7.online</p><div class=grid id=g></div><pre id=s>Conectando...</pre></div><script>function show(d){let g=document.getElementById('g');g.innerHTML='';['velocidade','rpm','marcha','acelerador','freio','combustivel','melhorVolta','tempoTotalCorrida','numeroVoltasCompletadas','chuva','controleTracao','numeroParadas'].forEach(k=>{g.innerHTML+=`<div class=box><div class=k>${k}</div><div class=v>${d[k]??'--'}</div></div>`});document.getElementById('s').textContent=JSON.stringify(d,null,2)}async function poll(){try{let r=await fetch('/api/fields');show(await r.json())}catch(e){document.getElementById('s').textContent=e}setTimeout(poll,500)}poll()</script></body></html>"; }
    public static boolean isBridgeRunning() { return running; }
    public static String getCurrentPs5Ip() { return currentPs5Ip; }
    public static long getLastPacketAgeMs() { return lastPacketAtMs <= 0 ? -1 : System.currentTimeMillis() - lastPacketAtMs; }
    public static String getReadableTelemetry() { return readableTelemetry; }

    private void notifyText(String text) { try { NotificationManager nm = (NotificationManager)getSystemService(NOTIFICATION_SERVICE); nm.notify(NOTIFICATION_ID, buildNotification(text)); } catch (Exception ignored) {} }
    private Notification buildNotification(String text) {
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CHANNEL_ID) : new Notification.Builder(this);
        b.setContentTitle("GT7 Bridge Mobile").setContentText(text).setSmallIcon(br.com.studiorad.gt7bridge.R.drawable.ic_stat_gt7).setOngoing(true);
        if (Build.VERSION.SDK_INT >= 31) b.setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE);
        return b.build();
    }
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "GT7 Bridge", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Serviço local de telemetria do GT7");
            NotificationManager nm = (NotificationManager)getSystemService(NOTIFICATION_SERVICE);
            nm.createNotificationChannel(ch);
        }
    }
}
