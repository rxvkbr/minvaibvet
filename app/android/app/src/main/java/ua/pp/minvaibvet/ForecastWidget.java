package ua.pp.minvaibvet;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.view.View;
import android.widget.RemoteViews;
import java.util.Calendar;

/** "Leave forecast": today's chance of leave plus the week as a small bar chart. */
public class ForecastWidget extends AppWidgetProvider {

    private static final int AMBER = 0xFFF0A93A;
    private static final int NEON = 0xFFFF5D47;
    private static final int IVORY = 0xFFF2E3BD;
    private static final int DIM = 0xFFB9A47F;
    private static final int GRID = 0x33F2E3BD;

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        for (int id : ids) {
            m.updateAppWidget(id, build(c));
        }
    }

    static RemoteViews build(Context c) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_forecast);
        Calendar now = Calendar.getInstance();
        int today = WidgetUtil.chance(now);
        v.setTextViewText(R.id.wf_percent, today + "%");
        v.setTextViewText(R.id.wf_feels, c.getString(R.string.w_feels, Math.round(today / 6f)));
        String[] notes = c.getResources().getStringArray(R.array.w_forecast_notes);
        v.setTextViewText(R.id.wf_note, notes[WidgetUtil.seeded(WidgetUtil.dayKey(now), 2).nextInt(notes.length)]);
        v.setImageViewBitmap(R.id.wf_chart, chart(c, now));
        v.setOnClickPendingIntent(R.id.wf_root, WidgetUtil.openApp(c, "prognoz", 11));
        return v;
    }

    /** Monday to Sunday of the current week, today's bar in neon. */
    private static Bitmap chart(Context c, Calendar now) {
        final int w = 700, h = 230, top = 42, base = 182, max = 50;
        Bitmap bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas cv = new Canvas(bmp);
        Paint grid = new Paint(Paint.ANTI_ALIAS_FLAG);
        grid.setColor(GRID);
        grid.setStrokeWidth(2);
        cv.drawLine(0, base, w, base, grid);

        Paint bar = new Paint(Paint.ANTI_ALIAS_FLAG);
        Paint num = new Paint(Paint.ANTI_ALIAS_FLAG);
        num.setTextSize(26);
        num.setTextAlign(Paint.Align.CENTER);
        num.setTypeface(Typeface.create(Typeface.MONOSPACE, Typeface.BOLD));
        Paint day = new Paint(Paint.ANTI_ALIAS_FLAG);
        day.setTextSize(25);
        day.setTextAlign(Paint.Align.CENTER);

        String[] days = c.getResources().getStringArray(R.array.w_days);
        boolean rtl = c.getResources().getConfiguration().getLayoutDirection() == View.LAYOUT_DIRECTION_RTL;
        Calendar d = (Calendar) now.clone();
        int shift = (d.get(Calendar.DAY_OF_WEEK) + 5) % 7; // days since Monday
        d.add(Calendar.DAY_OF_YEAR, -shift);
        float slot = w / 7f;
        for (int i = 0; i < 7; i++) {
            int pct = WidgetUtil.chance(d);
            boolean isToday = i == shift;
            int col = rtl ? 6 - i : i;
            float cx = slot * col + slot / 2f;
            float bh = Math.max(4, (base - top) * Math.min(pct, max) / (float) max);
            bar.setColor(isToday ? NEON : AMBER);
            cv.drawRoundRect(new RectF(cx - slot * 0.32f, base - bh, cx + slot * 0.32f, base), 6, 6, bar);
            num.setColor(isToday ? IVORY : AMBER);
            cv.drawText(pct + "%", cx, base - bh - 10, num);
            day.setColor(isToday ? IVORY : DIM);
            day.setTypeface(isToday ? Typeface.DEFAULT_BOLD : Typeface.DEFAULT);
            cv.drawText(days[i], cx, base + 36, day);
            d.add(Calendar.DAY_OF_YEAR, 1);
        }
        return bmp;
    }
}
