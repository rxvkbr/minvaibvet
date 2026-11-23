package ua.pp.minvaibvet;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import java.util.Arrays;
import java.util.List;

public class MainActivity extends BridgeActivity {

    /** Sections of the page a home-screen widget may open. */
    private static final List<String> SECTIONS = Arrays.asList("dron", "hladyty", "prognoz", "gazeta", "kolonka");

    private boolean started = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PurrPlugin.class);
        super.onCreate(savedInstanceState);
        started = true;
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (intent == null || getBridge() == null) {
            return;
        }
        final String section = intent.getStringExtra("section");
        if (section == null || !SECTIONS.contains(section)) {
            return;
        }
        intent.removeExtra("section");
        // On a cold start the page is still loading, so give it a moment before jumping.
        final long delay = started ? 80 : 1600;
        final WebView web = getBridge().getWebView();
        web.postDelayed(
            () -> web.evaluateJavascript("location.hash='';location.hash='" + section + "';", null),
            delay
        );
    }
}
