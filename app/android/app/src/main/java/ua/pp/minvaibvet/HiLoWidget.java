package ua.pp.minvaibvet;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import java.util.Random;

/** "Higher or lower?": guess whether the next chance of leave is higher. Seven in a row and the leave is approved. */
public class HiLoWidget extends AppWidgetProvider {

    static final String UP = "ua.pp.minvaibvet.HL_UP";
    static final String DOWN = "ua.pp.minvaibvet.HL_DOWN";
    static final int GOAL = 7;
    /** status: 0 start, 1 right, 2 wrong, 3 won */
    private static final Random RNG = new Random();

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        for (int id : ids) m.updateAppWidget(id, build(c));
    }

    @Override
    public void onReceive(Context c, Intent intent) {
        super.onReceive(c, intent);
        String a = intent.getAction();
        if (!UP.equals(a) && !DOWN.equals(a)) return;
        SharedPreferences p = WidgetUtil.prefs(c);
        SharedPreferences.Editor e = p.edit();
        int cur = p.getInt("hl_n", 23), streak = p.getInt("hl_s", 0), st = p.getInt("hl_st", 0);
        if (st == 3) {                                 // after a win any tap starts again
            e.putInt("hl_s", 0).putInt("hl_st", 0).putInt("hl_n", 5 + RNG.nextInt(41)).apply();
        } else {
            int next;
            do { next = RNG.nextInt(51); } while (next == cur);
            boolean right = UP.equals(a) ? next > cur : next < cur;
            streak = right ? streak + 1 : 0;
            e.putInt("hl_n", next).putInt("hl_s", streak).putInt("hl_idx", RNG.nextInt(6))
             .putInt("hl_st", streak >= GOAL ? 3 : right ? 1 : 2)
             .putInt("hl_best", Math.max(p.getInt("hl_best", 0), streak)).apply();
        }
        AppWidgetManager.getInstance(c).updateAppWidget(WidgetUtil.ids(c, HiLoWidget.class), build(c));
    }

    static RemoteViews build(Context c) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_hilo);
        SharedPreferences p = WidgetUtil.prefs(c);
        int st = p.getInt("hl_st", 0), idx = p.getInt("hl_idx", 0);
        v.setTextViewText(R.id.wh_num, p.getInt("hl_n", 23) + "%");
        String text;
        if (st == 1) { String[] l = c.getResources().getStringArray(R.array.g_hl_right); text = l[idx % l.length]; }
        else if (st == 2) { String[] l = c.getResources().getStringArray(R.array.g_hl_wrong); text = l[idx % l.length]; }
        else if (st == 3) text = c.getString(R.string.g_hl_win);
        else text = c.getString(R.string.g_hl_start);
        v.setTextViewText(R.id.wh_text, text);
        v.setTextViewText(R.id.wh_streak, c.getString(R.string.g_hl_streak, p.getInt("hl_s", 0), p.getInt("hl_best", 0)));
        v.setOnClickPendingIntent(R.id.wh_up, WidgetUtil.action(c, HiLoWidget.class, UP, 80));
        v.setOnClickPendingIntent(R.id.wh_down, WidgetUtil.action(c, HiLoWidget.class, DOWN, 81));
        return v;
    }
}
