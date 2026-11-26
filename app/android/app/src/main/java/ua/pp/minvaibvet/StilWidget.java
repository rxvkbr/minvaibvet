package ua.pp.minvaibvet;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

/** Вайбкет Стіл on the home screen: the shopping list and today's tasks, plus one-tap "add" buttons. */
public class StilWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        for (int id : ids) {
            m.updateAppWidget(id, build(c));
        }
    }

    static void refresh(Context c) {
        AppWidgetManager.getInstance(c).updateAppWidget(WidgetUtil.ids(c, StilWidget.class), build(c));
    }

    static RemoteViews build(Context c) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_stil);
        SharedPreferences p = WidgetUtil.prefs(c);
        String list = p.getString("stil_text", "");
        int shop = p.getInt("stil_shop", 0);
        v.setTextViewText(R.id.ws_list, list.isEmpty() ? c.getString(R.string.w_stil_empty) : list);
        v.setTextViewText(R.id.ws_count, shop > 0 ? c.getString(R.string.w_stil_count, shop) : "");
        v.setOnClickPendingIntent(R.id.ws_shop, WidgetUtil.openApp(c, "stil-shop", 31));
        v.setOnClickPendingIntent(R.id.ws_note, WidgetUtil.openApp(c, "stil-note", 32));
        v.setOnClickPendingIntent(R.id.ws_open, WidgetUtil.openApp(c, "stil-desk", 33));
        v.setOnClickPendingIntent(R.id.ws_list, WidgetUtil.openApp(c, "stil-shop", 34));
        return v;
    }
}
