package ua.pp.minvaibvet;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import java.util.Calendar;
import java.util.Random;

/** Shared helpers for the Vibevet FM home-screen widgets. */
final class WidgetUtil {

    private WidgetUtil() {}

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences("vibevet_widgets", Context.MODE_PRIVATE);
    }

    static int dayKey(Calendar cal) {
        return cal.get(Calendar.YEAR) * 1000 + cal.get(Calendar.DAY_OF_YEAR);
    }

    /** Same numbers for everyone on the same day, so the forecast feels official. */
    static Random seeded(int dayKey, int salt) {
        return new Random(dayKey * 7919L + salt * 104729L);
    }

    /** Chance of leave for a given date, in percent. Fridays are always zero. */
    static int chance(Calendar cal) {
        int dow = cal.get(Calendar.DAY_OF_WEEK);
        if (dow == Calendar.FRIDAY) {
            return 0;
        }
        Random r = seeded(dayKey(cal), 1);
        int value = r.nextInt(17);
        if (dow == Calendar.SATURDAY) {
            value += 22 + r.nextInt(15);
        } else if (dow == Calendar.SUNDAY) {
            value += 4;
        }
        return value;
    }

    /** Opens the app at a section of the page. */
    static PendingIntent openApp(Context c, String section, int requestCode) {
        Intent i = new Intent(c, MainActivity.class);
        i.putExtra("section", section);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(c, requestCode, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Sends an action back to the widget's own receiver. */
    static PendingIntent action(Context c, Class<?> receiver, String action, int requestCode) {
        Intent i = new Intent(c, receiver);
        i.setAction(action);
        return PendingIntent.getBroadcast(c, requestCode, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static int[] ids(Context c, Class<?> provider) {
        return AppWidgetManager.getInstance(c).getAppWidgetIds(new ComponentName(c, provider));
    }

    /** Random index that differs from the previous one when possible. */
    static int pickOther(Random r, int size, int previous) {
        if (size < 2) {
            return 0;
        }
        int i = r.nextInt(size - 1);
        return i >= previous ? i + 1 : i;
    }
}
