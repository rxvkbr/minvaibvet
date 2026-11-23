package ua.pp.minvaibvet;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import java.util.Random;

/** "Bullshit buttons": stream, +1 vibe, hotline, pet, submit a request. */
public class ButtonsWidget extends AppWidgetProvider {

    static final String PLUS = "ua.pp.minvaibvet.BTN_PLUS";
    static final String HOTLINE = "ua.pp.minvaibvet.BTN_HOTLINE";
    static final String REQUEST = "ua.pp.minvaibvet.BTN_REQUEST";

    /** What the status line shows; stored as a type and index so it follows the phone's language. */
    private static final int IDLE = 0, VIBED = 1, HOT = 2, REJECTED = 3;

    private static final Random RNG = new Random();

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        for (int id : ids) {
            m.updateAppWidget(id, build(c));
        }
    }

    @Override
    public void onReceive(Context c, Intent intent) {
        super.onReceive(c, intent);
        String a = intent.getAction();
        if (a == null) {
            return;
        }
        SharedPreferences p = WidgetUtil.prefs(c);
        SharedPreferences.Editor e = p.edit();
        if (PLUS.equals(a)) {
            e.putInt("vibes", p.getInt("vibes", 0) + 1).putInt("st_type", VIBED);
        } else if (HOTLINE.equals(a)) {
            int n = c.getResources().getStringArray(R.array.w_hotline).length;
            int prev = p.getInt("st_type", IDLE) == HOT ? p.getInt("st_idx", -1) : -1;
            e.putInt("st_type", HOT).putInt("st_idx", WidgetUtil.pickOther(RNG, n, prev));
        } else if (REQUEST.equals(a)) {
            int n = c.getResources().getStringArray(R.array.w_rejections).length;
            int prev = p.getInt("st_type", IDLE) == REJECTED ? p.getInt("st_idx", -1) : -1;
            e.putInt("st_type", REJECTED).putInt("st_idx", WidgetUtil.pickOther(RNG, n, prev));
        } else {
            return;
        }
        e.apply();
        AppWidgetManager.getInstance(c).updateAppWidget(WidgetUtil.ids(c, ButtonsWidget.class), build(c));
    }

    static RemoteViews build(Context c) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_buttons);
        SharedPreferences p = WidgetUtil.prefs(c);
        v.setTextViewText(R.id.wb_count, c.getString(R.string.w_count, p.getInt("vibes", 0)));
        v.setTextViewText(R.id.wb_status, status(c, p.getInt("st_type", IDLE), p.getInt("st_idx", 0)));
        v.setOnClickPendingIntent(R.id.wb_stream, WidgetUtil.openApp(c, "dron", 21));
        v.setOnClickPendingIntent(R.id.wb_pet, WidgetUtil.openApp(c, "hladyty", 22));
        v.setOnClickPendingIntent(R.id.wb_plus, WidgetUtil.action(c, ButtonsWidget.class, PLUS, 23));
        v.setOnClickPendingIntent(R.id.wb_hotline, WidgetUtil.action(c, ButtonsWidget.class, HOTLINE, 24));
        v.setOnClickPendingIntent(R.id.wb_request, WidgetUtil.action(c, ButtonsWidget.class, REQUEST, 25));
        return v;
    }

    private static String status(Context c, int type, int idx) {
        String[] list;
        switch (type) {
            case VIBED:
                return c.getString(R.string.w_vibe_plus_msg);
            case HOT:
                list = c.getResources().getStringArray(R.array.w_hotline);
                break;
            case REJECTED:
                list = c.getResources().getStringArray(R.array.w_rejections);
                break;
            default:
                return c.getString(R.string.w_status_idle);
        }
        return list[Math.max(0, Math.min(idx, list.length - 1))];
    }
}
