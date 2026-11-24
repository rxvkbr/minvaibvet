package ua.pp.minvaibvet;

import android.content.ComponentName;
import android.content.pm.PackageManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Arrays;
import java.util.List;

/**
 * Lets the listener pick a coloured app icon. Each colour is a launcher activity-alias
 * (.IconEfir, .IconZona, ...); exactly one is enabled at a time.
 */
@CapacitorPlugin(name = "AppIcon")
public class AppIconPlugin extends Plugin {

    static final List<String> NAMES = Arrays.asList("efir", "zona", "nich", "burshtyn", "okop", "ukr", "mono", "svitanok");

    private ComponentName alias(String name) {
        String cls = "Icon" + Character.toUpperCase(name.charAt(0)) + name.substring(1);
        return new ComponentName(getContext().getPackageName(), "ua.pp.minvaibvet." + cls);
    }

    private boolean enabled(String name) {
        int s = getContext().getPackageManager().getComponentEnabledSetting(alias(name));
        if (s == PackageManager.COMPONENT_ENABLED_STATE_DEFAULT) {
            return "efir".equals(name);
        }
        return s == PackageManager.COMPONENT_ENABLED_STATE_ENABLED;
    }

    @PluginMethod
    public void get(PluginCall call) {
        String cur = "efir";
        for (String n : NAMES) {
            if (enabled(n)) {
                cur = n;
                break;
            }
        }
        JSObject r = new JSObject();
        r.put("name", cur);
        r.put("supported", true);
        call.resolve(r);
    }

    @PluginMethod
    public void set(PluginCall call) {
        String name = call.getString("name", "efir");
        if (!NAMES.contains(name)) {
            call.reject("Unknown icon");
            return;
        }
        PackageManager pm = getContext().getPackageManager();
        // Enable the new one first, so the app never has no launcher entry.
        pm.setComponentEnabledSetting(alias(name), PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP);
        for (String n : NAMES) {
            if (!n.equals(name)) {
                pm.setComponentEnabledSetting(alias(n), PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP);
            }
        }
        JSObject r = new JSObject();
        r.put("name", name);
        call.resolve(r);
    }
}
