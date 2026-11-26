package ua.pp.minvaibvet;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.RemoteViews;

/** "Thor plays": he hits everything with his hammer, twelve times — then says «Hammer time.» and looks into the camera. */
public class ThorWidget extends AppWidgetProvider {

    static final String HIT = "ua.pp.minvaibvet.THOR_HIT";
    static final int LAST = 12;
    private static final String[] POSES = {"🧔🔨", "🧔⚡", "🔨🧔", "⚡🔨"};

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        for (int id : ids) m.updateAppWidget(id, build(c));
    }

    @Override
    public void onReceive(Context c, Intent intent) {
        super.onReceive(c, intent);
        if (!HIT.equals(intent.getAction())) return;
        SharedPreferences p = WidgetUtil.prefs(c);
        int n = p.getInt("th_n", 0);
        p.edit().putInt("th_n", n >= LAST ? 0 : n + 1).apply();   // after the look into the camera, Thor starts again
        AppWidgetManager.getInstance(c).updateAppWidget(WidgetUtil.ids(c, ThorWidget.class), build(c));
    }

    static RemoteViews build(Context c) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_thor);
        int n = WidgetUtil.prefs(c).getInt("th_n", 0);
        String[] lines = c.getResources().getStringArray(R.array.g_th_lines);
        boolean done = n >= LAST;
        v.setTextViewText(R.id.wr_count, c.getString(R.string.g_th_count, Math.min(n, LAST)));
        v.setTextViewText(R.id.wr_thor, done ? "🧔" : POSES[n % POSES.length]);
        v.setViewVisibility(R.id.wr_big, done ? View.VISIBLE : View.GONE);
        v.setTextViewText(R.id.wr_big, c.getString(R.string.g_th_final));
        v.setTextViewText(R.id.wr_text, done ? c.getString(R.string.g_th_look) : n == 0 ? c.getString(R.string.g_th_desc) : lines[(n - 1) % lines.length]);
        v.setTextViewText(R.id.wr_hit, done ? c.getString(R.string.g_th_again) : c.getString(R.string.g_th_hit));
        v.setOnClickPendingIntent(R.id.wr_hit, WidgetUtil.action(c, ThorWidget.class, HIT, 90));
        return v;
    }
}
