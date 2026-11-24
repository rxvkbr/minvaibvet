package ua.pp.minvaibvet;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Receives what Вайбвет Стіл wants to show on the home-screen widget. Data stays on the phone. */
@CapacitorPlugin(name = "StilWidget")
public class StilWidgetPlugin extends Plugin {

    @PluginMethod
    public void set(PluginCall call) {
        String text = call.getString("text", "");
        int shop = call.getInt("shop", 0);
        if (text != null && text.length() > 2000) {
            text = text.substring(0, 2000);
        }
        WidgetUtil.prefs(getContext()).edit().putString("stil_text", text == null ? "" : text).putInt("stil_shop", shop).apply();
        StilWidget.refresh(getContext());
        call.resolve();
    }
}
