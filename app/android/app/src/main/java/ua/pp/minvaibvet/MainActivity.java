package ua.pp.minvaibvet;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import java.util.Arrays;
import java.util.List;

public class MainActivity extends BridgeActivity {

    /** Sections of the page a home-screen widget may open. */
    private static final List<String> SECTIONS = Arrays.asList("dron", "hladyty", "prognoz", "gazeta", "kolonka", "stil-shop", "stil-note", "stil-desk");

    private boolean started = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PurrPlugin.class);
        registerPlugin(StilWidgetPlugin.class);
        super.onCreate(savedInstanceState);
        // A widget or an app shortcut may have started the app: jump there once the page has loaded.
        jump(getIntent(), 1600);
        started = true;
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        jump(intent, started ? 80 : 1600);
    }

    private void jump(Intent intent, long delay) {
        if (intent == null || getBridge() == null) {
            return;
        }
        final String section = intent.getStringExtra("section");
        if (section == null || !SECTIONS.contains(section)) {
            return;
        }
        intent.removeExtra("section");
        final WebView web = getBridge().getWebView();
        final String js;
        if (section.startsWith("stil-")) {
            // Вайбвет Стіл is its own page: open it, or just switch inside it if it is already open.
            final String where = section.substring(5);
            js = "if(/stil\\.html$/.test(location.pathname)){location.hash='';location.hash='" + where + "';}else{location.href='stil.html#" + where + "';}";
        } else {
            js = "if(/stil\\.html$/.test(location.pathname)){location.href='index.html#" + section + "';}else{location.hash='';location.hash='" + section + "';}";
        }
        web.postDelayed(() -> web.evaluateJavascript(js, null), delay);
    }
}
