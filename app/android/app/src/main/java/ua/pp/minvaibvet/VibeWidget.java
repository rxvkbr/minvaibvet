package ua.pp.minvaibvet;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import java.util.Calendar;

/** "Vibe of the day": one line per day; tap for the next one. */
public class VibeWidget extends AppWidgetProvider {

    static final String NEXT = "ua.pp.minvaibvet.VIBE_NEXT";

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        for (int id : ids) {
            m.updateAppWidget(id, build(c));
        }
    }

    @Override
    public void onReceive(Context c, Intent intent) {
        super.onReceive(c, intent);
        if (NEXT.equals(intent.getAction())) {
            SharedPreferences p = WidgetUtil.prefs(c);
            p.edit().putInt("vibe_off", p.getInt("vibe_off", 0) + 1).apply();
            AppWidgetManager.getInstance(c).updateAppWidget(WidgetUtil.ids(c, VibeWidget.class), build(c));
        }
    }

    static RemoteViews build(Context c) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_vibe);
        SharedPreferences p = WidgetUtil.prefs(c);
        int day = WidgetUtil.dayKey(Calendar.getInstance());
        if (p.getInt("vibe_day", -1) != day) {
            p.edit().putInt("vibe_day", day).putInt("vibe_off", 0).apply();
        }
        String[] vibes = c.getResources().getStringArray(R.array.w_vibes);
        int start = WidgetUtil.seeded(day, 3).nextInt(vibes.length);
        v.setTextViewText(R.id.wv_text, vibes[(start + p.getInt("vibe_off", 0)) % vibes.length]);
        v.setOnClickPendingIntent(R.id.wv_root, WidgetUtil.action(c, VibeWidget.class, NEXT, 31));
        return v;
    }
}
