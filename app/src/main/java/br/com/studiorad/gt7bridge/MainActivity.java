package br.com.studiorad.gt7bridge;

import android.Manifest;
import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.Bundle;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

public class MainActivity extends Activity {
    private EditText ps5IpInput;
    private TextView statusText;
    private TextView urlText;
    private TextView telemetryText;
    private final android.os.Handler handler = new android.os.Handler();

    private final Runnable refreshRunnable = new Runnable() {
        @Override public void run() {
            refreshStatus();
            handler.postDelayed(this, 1000);
        }
    };

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestNotificationPermissionIfNeeded();

        SharedPreferences prefs = getSharedPreferences("gt7_bridge", MODE_PRIVATE);
        String savedIp = prefs.getString("ps5_ip", "192.168.1.100");

        ScrollView scroll = new ScrollView(this);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(18), dp(18), dp(18), dp(18));
        root.setBackgroundColor(Color.rgb(238, 241, 246));
        scroll.addView(root);

        TextView title = new TextView(this);
        title.setText("GT7 Bridge Mobile");
        title.setTextSize(28);
        title.setTextColor(Color.rgb(17, 24, 39));
        title.setGravity(Gravity.START);
        title.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        root.addView(title);

        TextView subtitle = new TextView(this);
        subtitle.setText("Recebe a telemetria UDP do Gran Turismo 7 direto no Android e entrega para o gt7.online por API local. Mantenha o celular no mesmo Wi-Fi do PS5.");
        subtitle.setTextSize(14);
        subtitle.setTextColor(Color.rgb(102, 112, 133));
        subtitle.setPadding(0, dp(8), 0, dp(16));
        root.addView(subtitle);

        TextView label = label("IP do PS5");
        root.addView(label);

        ps5IpInput = new EditText(this);
        ps5IpInput.setSingleLine(true);
        ps5IpInput.setInputType(InputType.TYPE_CLASS_TEXT);
        ps5IpInput.setText(savedIp);
        ps5IpInput.setTextSize(18);
        ps5IpInput.setPadding(dp(12), dp(10), dp(12), dp(10));
        root.addView(ps5IpInput, new LinearLayout.LayoutParams(-1, -2));

        LinearLayout buttons = new LinearLayout(this);
        buttons.setOrientation(LinearLayout.HORIZONTAL);
        buttons.setPadding(0, dp(14), 0, dp(10));
        root.addView(buttons);

        Button start = button("Iniciar Bridge", Color.rgb(37, 99, 235));
        Button stop = button("Parar", Color.rgb(220, 38, 38));
        buttons.addView(start, new LinearLayout.LayoutParams(0, dp(48), 1));
        LinearLayout.LayoutParams stopParams = new LinearLayout.LayoutParams(0, dp(48), 1);
        stopParams.setMargins(dp(10), 0, 0, 0);
        buttons.addView(stop, stopParams);

        Button copy = button("Copiar URLs para gt7.online", Color.rgb(71, 84, 103));
        root.addView(copy, new LinearLayout.LayoutParams(-1, dp(48)));

        statusText = cardText("Status: parado");
        root.addView(statusText);

        urlText = cardText(buildUrlsText());
        root.addView(urlText);

        telemetryText = cardText("Aguardando dados do GT7...");
        root.addView(telemetryText);

        start.setOnClickListener(v -> {
            String ip = ps5IpInput.getText().toString().trim();
            if (ip.isEmpty()) {
                Toast.makeText(this, "Informe o IP do PS5.", Toast.LENGTH_SHORT).show();
                return;
            }
            prefs.edit().putString("ps5_ip", ip).apply();
            Intent i = new Intent(this, Gt7BridgeService.class);
            i.setAction(Gt7BridgeService.ACTION_START);
            i.putExtra("ps5_ip", ip);
            if (Build.VERSION.SDK_INT >= 26) startForegroundService(i); else startService(i);
            Toast.makeText(this, "Bridge iniciado.", Toast.LENGTH_SHORT).show();
            refreshStatus();
        });

        stop.setOnClickListener(v -> {
            Intent i = new Intent(this, Gt7BridgeService.class);
            i.setAction(Gt7BridgeService.ACTION_STOP);
            startService(i);
            Toast.makeText(this, "Bridge parado.", Toast.LENGTH_SHORT).show();
            refreshStatus();
        });

        copy.setOnClickListener(v -> {
            ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            cm.setPrimaryClip(ClipData.newPlainText("GT7 Bridge URLs", buildUrlsText()));
            Toast.makeText(this, "URLs copiadas.", Toast.LENGTH_SHORT).show();
        });

        setContentView(scroll);
    }

    @Override protected void onResume() {
        super.onResume();
        handler.post(refreshRunnable);
    }

    @Override protected void onPause() {
        super.onPause();
        handler.removeCallbacks(refreshRunnable);
    }

    private void requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1001);
        }
    }

    private void refreshStatus() {
        boolean running = Gt7BridgeService.isBridgeRunning();
        long age = Gt7BridgeService.getLastPacketAgeMs();
        String status = running ? "rodando" : "parado";
        String packet = age >= 0 ? String.format(Locale.US, "último pacote há %.1fs", age / 1000.0) : "nenhum pacote recebido";
        statusText.setText("Status: " + status + "\n" + packet + "\nPS5: " + Gt7BridgeService.getCurrentPs5Ip());
        telemetryText.setText(Gt7BridgeService.getReadableTelemetry());
    }

    private TextView label(String text) {
        TextView tv = new TextView(this);
        tv.setText(text);
        tv.setTextSize(12);
        tv.setTextColor(Color.rgb(102, 112, 133));
        tv.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        tv.setPadding(0, dp(8), 0, dp(6));
        return tv;
    }

    private Button button(String text, int color) {
        Button b = new Button(this);
        b.setText(text);
        b.setTextColor(Color.WHITE);
        b.setTextSize(13);
        b.setAllCaps(false);
        b.setBackgroundColor(color);
        return b;
    }

    private TextView cardText(String text) {
        TextView tv = new TextView(this);
        tv.setText(text);
        tv.setTextSize(14);
        tv.setTextColor(Color.rgb(17, 24, 39));
        tv.setPadding(dp(14), dp(14), dp(14), dp(14));
        tv.setBackgroundColor(Color.WHITE);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(-1, -2);
        params.setMargins(0, dp(12), 0, 0);
        tv.setLayoutParams(params);
        return tv;
    }

    private String buildUrlsText() {
        String local = "127.0.0.1";
        String wifi = getWifiIp();
        return "No mesmo celular:\n" +
                "http://" + local + ":8787/api/fields\n" +
                "ws://" + local + ":8787/ws\n\n" +
                "Em outro aparelho da mesma rede:\n" +
                "http://" + wifi + ":8787/api/fields\n" +
                "ws://" + wifi + ":8787/ws";
    }

    private String getWifiIp() {
        try {
            List<NetworkInterface> interfaces = Collections.list(NetworkInterface.getNetworkInterfaces());
            for (NetworkInterface ni : interfaces) {
                List<InetAddress> addresses = Collections.list(ni.getInetAddresses());
                for (InetAddress addr : addresses) {
                    if (!addr.isLoopbackAddress() && addr.getHostAddress().indexOf(':') < 0) {
                        String ip = addr.getHostAddress();
                        if (ip.startsWith("192.") || ip.startsWith("10.") || ip.startsWith("172.")) return ip;
                    }
                }
            }
        } catch (Exception ignored) {}
        try {
            WifiManager wm = (WifiManager) getApplicationContext().getSystemService(WIFI_SERVICE);
            int ip = wm.getConnectionInfo().getIpAddress();
            return String.format(Locale.US, "%d.%d.%d.%d", ip & 0xff, (ip >> 8) & 0xff, (ip >> 16) & 0xff, (ip >> 24) & 0xff);
        } catch (Exception ignored) {}
        return "IP_DO_CELULAR";
    }

    private int dp(int value) {
        return (int) (value * getResources().getDisplayMetrics().density + 0.5f);
    }
}
