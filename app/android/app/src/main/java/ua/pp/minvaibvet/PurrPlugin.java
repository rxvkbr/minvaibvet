package ua.pp.minvaibvet;

import android.content.Context;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Plays looping haptic patterns while an animal is being petted:
 * a cat purr (about 25 Hz with a breathing rhythm), a dog's tail thump, a rat's teeth chatter.
 */
@CapacitorPlugin(name = "Purr")
public class PurrPlugin extends Plugin {

    private Vibrator vibrator() {
        Context c = getContext();
        if (Build.VERSION.SDK_INT >= 31) {
            VibratorManager m = (VibratorManager) c.getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
            return m == null ? null : m.getDefaultVibrator();
        }
        return (Vibrator) c.getSystemService(Context.VIBRATOR_SERVICE);
    }

    @PluginMethod
    public void play(PluginCall call) {
        Vibrator v = vibrator();
        if (v == null || !v.hasVibrator()) {
            call.resolve();
            return;
        }
        String pattern = call.getString("pattern", "cat");
        double intensity = Math.max(0.05, Math.min(1.0, call.getDouble("intensity", 0.5)));

        long[] timings;
        int[] amps;
        if ("dog".equals(pattern)) {
            timings = new long[] {35, 265};
            amps = new int[] {amp(intensity, 1.0), 0};
        } else if ("rat".equals(pattern)) {
            timings = new long[] {7, 23, 7, 23, 7, 233};
            amps = new int[] {amp(intensity, 0.55), 0, amp(intensity, 0.55), 0, amp(intensity, 0.55), 0};
        } else {
            // 25 Hz pulses: 18 on the out-breath, 12 softer ones on the in-breath (about 1.2 s per cycle).
            int n = 30;
            timings = new long[n * 2];
            amps = new int[n * 2];
            for (int i = 0; i < n; i++) {
                double breath = i < 18 ? 1.0 : 0.55;
                timings[i * 2] = 18;
                timings[i * 2 + 1] = 22;
                amps[i * 2] = amp(intensity, breath);
                amps[i * 2 + 1] = amp(intensity, breath * 0.18);
            }
        }

        v.cancel();
        if (Build.VERSION.SDK_INT >= 26) {
            if (v.hasAmplitudeControl()) {
                v.vibrate(VibrationEffect.createWaveform(timings, amps, 0));
            } else {
                v.vibrate(VibrationEffect.createWaveform(onOff(timings, amps), 0));
            }
        } else {
            v.vibrate(onOff(timings, amps), 0);
        }
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Vibrator v = vibrator();
        if (v != null) {
            v.cancel();
        }
        call.resolve();
    }

    private static int amp(double intensity, double factor) {
        return Math.max(1, Math.min(255, (int) Math.round(255 * intensity * factor)));
    }

    /**
     * Fallback for motors without amplitude control: off/on pairs that keep the rhythm,
     * with each pulse shortened in proportion to its strength.
     */
    private static long[] onOff(long[] timings, int[] amps) {
        long[] out = new long[timings.length + 1];
        out[0] = 0;
        for (int i = 0; i + 1 < timings.length; i += 2) {
            long period = timings[i] + timings[i + 1];
            double strength = amps[i] / 255.0;
            long on = Math.max(3, Math.min(timings[i], Math.round(timings[i] * (0.3 + 0.7 * strength))));
            out[i + 1] = on;
            out[i + 2] = period - on;
        }
        return out;
    }
}
