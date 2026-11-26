package ua.pp.minvaibvet;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/** "Tic-tac-toe with the commander": you are X, the battalion commander answers with O right away. */
public class TicTacWidget extends AppWidgetProvider {

    static final String TAP = "ua.pp.minvaibvet.TT_TAP";
    static final String NEW = "ua.pp.minvaibvet.TT_NEW";
    private static final int[] CELLS = {R.id.wt_c0, R.id.wt_c1, R.id.wt_c2, R.id.wt_c3, R.id.wt_c4, R.id.wt_c5, R.id.wt_c6, R.id.wt_c7, R.id.wt_c8};
    private static final int[][] LINES = {{0,1,2},{3,4,5},{6,7,8},{0,3,6},{1,4,7},{2,5,8},{0,4,8},{2,4,6}};
    /** status: 0 start, 1 commander moved, 2 you won, 3 commander won, 4 draw */
    private static final Random RNG = new Random();

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        for (int id : ids) m.updateAppWidget(id, build(c));
    }

    @Override
    public void onReceive(Context c, Intent intent) {
        super.onReceive(c, intent);
        String a = intent.getAction();
        SharedPreferences p = WidgetUtil.prefs(c);
        if (NEW.equals(a)) {
            p.edit().putString("tt_board", ".........").putInt("tt_st", 0).putInt("tt_idx", RNG.nextInt(2)).apply();
        } else if (a != null && a.startsWith(TAP)) {
            int cell = Integer.parseInt(a.substring(TAP.length()));
            play(c, p, cell);
            int st = p.getInt("tt_st", 0);
            WidgetUtil.buzz(c, st == 2 ? "success" : st == 3 ? "error" : st == 4 ? "click" : "tick");
        } else {
            return;
        }
        AppWidgetManager.getInstance(c).updateAppWidget(WidgetUtil.ids(c, TicTacWidget.class), build(c));
    }

    private static void play(Context c, SharedPreferences p, int cell) {
        char[] b = p.getString("tt_board", ".........").toCharArray();
        int st = p.getInt("tt_st", 0);
        if (st >= 2 || b[cell] != '.') return;   // the game is over, or the cell is taken
        b[cell] = 'X';
        SharedPreferences.Editor e = p.edit();
        if (winner(b) == 'X') {
            e.putInt("tt_st", 2).putInt("tt_w", p.getInt("tt_w", 0) + 1);
        } else if (full(b)) {
            e.putInt("tt_st", 4).putInt("tt_d", p.getInt("tt_d", 0) + 1);
        } else {
            b[commander(b)] = 'O';
            if (winner(b) == 'O') e.putInt("tt_st", 3).putInt("tt_l", p.getInt("tt_l", 0) + 1);
            else if (full(b)) e.putInt("tt_st", 4).putInt("tt_d", p.getInt("tt_d", 0) + 1);
            else e.putInt("tt_st", 1);
        }
        e.putInt("tt_idx", RNG.nextInt(8)).putString("tt_board", new String(b)).apply();
    }

    /** Wins if he can, blocks if he must, likes the centre, otherwise anything — and sometimes he just goes for coffee. */
    private static int commander(char[] b) {
        int w = finish(b, 'O');
        if (w >= 0) return w;
        int block = finish(b, 'X');
        if (block >= 0 && RNG.nextInt(10) > 0) return block;
        if (b[4] == '.') return 4;
        List<Integer> free = new ArrayList<>();
        for (int i = 0; i < 9; i++) if (b[i] == '.') free.add(i);
        return free.get(RNG.nextInt(free.size()));
    }

    private static int finish(char[] b, char who) {
        for (int[] l : LINES) {
            int mine = 0, empty = -1;
            for (int i : l) { if (b[i] == who) mine++; else if (b[i] == '.') empty = i; }
            if (mine == 2 && empty >= 0) return empty;
        }
        return -1;
    }

    private static char winner(char[] b) {
        for (int[] l : LINES) if (b[l[0]] != '.' && b[l[0]] == b[l[1]] && b[l[1]] == b[l[2]]) return b[l[0]];
        return '.';
    }

    private static boolean full(char[] b) {
        for (char ch : b) if (ch == '.') return false;
        return true;
    }

    static RemoteViews build(Context c) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_tictac);
        SharedPreferences p = WidgetUtil.prefs(c);
        char[] b = p.getString("tt_board", ".........").toCharArray();
        for (int i = 0; i < 9; i++) {
            v.setTextViewText(CELLS[i], b[i] == 'X' ? "✕" : b[i] == 'O' ? "◯" : "");
            v.setTextColor(CELLS[i], b[i] == 'X' ? 0xFF1A100B : 0xFFFF5D47);
            v.setOnClickPendingIntent(CELLS[i], WidgetUtil.action(c, TicTacWidget.class, TAP + i, 60 + i));
        }
        int st = p.getInt("tt_st", 0), idx = p.getInt("tt_idx", 0);
        int arr = st == 2 ? R.array.g_tt_win : st == 3 ? R.array.g_tt_lose : st == 4 ? R.array.g_tt_draw : st == 1 ? R.array.g_tt_move : R.array.g_tt_start;
        String[] lines = c.getResources().getStringArray(arr);
        v.setTextViewText(R.id.wt_status, lines[idx % lines.length]);
        v.setTextViewText(R.id.wt_score, c.getString(R.string.g_tt_score, p.getInt("tt_w", 0), p.getInt("tt_l", 0), p.getInt("tt_d", 0)));
        v.setOnClickPendingIntent(R.id.wt_new, WidgetUtil.action(c, TicTacWidget.class, NEW, 70));
        return v;
    }
}
