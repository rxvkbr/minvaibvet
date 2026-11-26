/*
 * «Промінь» — a small path tracer for Вайбкет FM pictures. One file, plain JDK (11+), no libraries.
 *
 *   java Promin.java scene.txt [out.png]      render one scene
 *   java Promin.java --watch inbox out         the local agents: drop a scene into inbox/, get out/<name>.png
 *
 * "Agents" are worker threads, one per core: each takes the next 32×32 tile, so the Mac renders in parallel.
 * Every pass refines the whole picture and the PNG is rewritten after each pass, so you can watch it sharpen.
 *
 * Scene format (one thing per line, # comments):
 *   size 1200 800              image size
 *   samples 64                 rays per pixel (more = cleaner, slower)
 *   bounces 6
 *   camera  0 1.2 -5   0 0.8 0   40          from (x y z), look at (x y z), field of view in degrees
 *   sky     0.55 0.7 0.95   0.95 0.8 0.65    colour at the top, colour at the horizon (0 0 0 for a dark room)
 *   fog     0.02 0.7 0.75 0.8                density and colour (optional)
 *   material NAME diffuse|metal|glass|light  r g b  [roughness or index or strength]
 *   sphere  x y z radius  MATERIAL
 *   plane   y  MATERIAL                       an endless floor (or water) at height y
 *   box     x0 y0 z0  x1 y1 z1  MATERIAL
 */
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class Promin {

    /* ---------------- a little vector maths ---------------- */
    static final class V {
        final double x, y, z;
        V(double x, double y, double z) { this.x = x; this.y = y; this.z = z; }
        V add(V o) { return new V(x + o.x, y + o.y, z + o.z); }
        V sub(V o) { return new V(x - o.x, y - o.y, z - o.z); }
        V mul(double k) { return new V(x * k, y * k, z * k); }
        V mul(V o) { return new V(x * o.x, y * o.y, z * o.z); }
        double dot(V o) { return x * o.x + y * o.y + z * o.z; }
        V cross(V o) { return new V(y * o.z - z * o.y, z * o.x - x * o.z, x * o.y - y * o.x); }
        double len() { return Math.sqrt(dot(this)); }
        V norm() { double l = len(); return l == 0 ? this : mul(1 / l); }
        double max() { return Math.max(x, Math.max(y, z)); }
    }
    static final V ZERO = new V(0, 0, 0);

    /* ---------------- materials and shapes ---------------- */
    enum Kind { DIFFUSE, METAL, GLASS, LIGHT }
    static final class Mat { Kind k; V c; double p; Mat(Kind k, V c, double p) { this.k = k; this.c = c; this.p = p; } }
    static final class Hit { double t; V p, n; Mat m; boolean front; Shape s; }

    interface Shape { boolean hit(V o, V d, double tmin, double tmax, Hit h); }

    static final class Sphere implements Shape {
        final V c; final double r; final Mat m;
        Sphere(V c, double r, Mat m) { this.c = c; this.r = r; this.m = m; }
        public boolean hit(V o, V d, double tmin, double tmax, Hit h) {
            V oc = o.sub(c); double b = oc.dot(d), cc = oc.dot(oc) - r * r, disc = b * b - cc;
            if (disc < 0) return false;
            double s = Math.sqrt(disc), t = -b - s;
            if (t < tmin || t > tmax) { t = -b + s; if (t < tmin || t > tmax) return false; }
            h.t = t; h.p = o.add(d.mul(t)); V n = h.p.sub(c).mul(1 / r); h.front = d.dot(n) < 0; h.n = h.front ? n : n.mul(-1); h.m = m; h.s = this;
            return true;
        }
    }
    static final class Plane implements Shape {
        final double y; final Mat m;
        Plane(double y, Mat m) { this.y = y; this.m = m; }
        public boolean hit(V o, V d, double tmin, double tmax, Hit h) {
            if (Math.abs(d.y) < 1e-9) return false;
            double t = (y - o.y) / d.y; if (t < tmin || t > tmax) return false;
            h.t = t; h.p = o.add(d.mul(t)); h.front = d.y < 0; h.n = new V(0, h.front ? 1 : -1, 0); h.m = m; h.s = this;
            return true;
        }
    }
    static final class Box implements Shape {
        final V a, b; final Mat m;
        Box(V a, V b, Mat m) { this.a = a; this.b = b; this.m = m; }
        public boolean hit(V o, V d, double tmin, double tmax, Hit h) {
            double t0 = tmin, t1 = tmax; int axis = -1; double[] oo = {o.x, o.y, o.z}, dd = {d.x, d.y, d.z}, lo = {a.x, a.y, a.z}, hi = {b.x, b.y, b.z};
            for (int i = 0; i < 3; i++) {
                double inv = 1 / dd[i], ta = (lo[i] - oo[i]) * inv, tb = (hi[i] - oo[i]) * inv;
                if (inv < 0) { double s = ta; ta = tb; tb = s; }
                if (ta > t0) { t0 = ta; axis = i; }
                if (tb < t1) t1 = tb;
                if (t1 <= t0) return false;
            }
            if (axis < 0) return false;
            h.t = t0; h.p = o.add(d.mul(t0));
            double sgn = -Math.signum(dd[axis]);
            h.n = axis == 0 ? new V(sgn, 0, 0) : axis == 1 ? new V(0, sgn, 0) : new V(0, 0, sgn); h.front = true; h.m = m; h.s = this;
            return true;
        }
    }

    /* ---------------- the scene ---------------- */
    int W = 960, H = 640, SPP = 48, BOUNCES = 6; double fov = 40, fog = 0;
    V from = new V(0, 1, -5), at = new V(0, 0.8, 0), skyTop = new V(0.5, 0.7, 0.95), skyLow = new V(0.95, 0.85, 0.7), fogC = new V(0.8, 0.8, 0.85);
    final List<Shape> shapes = new ArrayList<>();
    final Map<String, Mat> mats = new HashMap<>();

    static Promin parse(List<String> lines) {
        Promin s = new Promin();
        s.mats.put("white", new Mat(Kind.DIFFUSE, new V(0.8, 0.8, 0.8), 0));
        for (String raw : lines) {
            String l = raw.replaceAll("#.*", "").trim(); if (l.isEmpty()) continue;
            String[] w = l.split("\\s+"); double[] n = new double[w.length];
            for (int i = 1; i < w.length; i++) try { n[i] = Double.parseDouble(w[i]); } catch (NumberFormatException e) { n[i] = Double.NaN; }
            switch (w[0]) {
                case "size": s.W = (int) n[1]; s.H = (int) n[2]; break;
                case "samples": s.SPP = (int) n[1]; break;
                case "bounces": s.BOUNCES = (int) n[1]; break;
                case "camera": s.from = new V(n[1], n[2], n[3]); s.at = new V(n[4], n[5], n[6]); s.fov = n[7]; break;
                case "sky": s.skyTop = new V(n[1], n[2], n[3]); s.skyLow = new V(n[4], n[5], n[6]); break;
                case "fog": s.fog = n[1]; s.fogC = new V(n[2], n[3], n[4]); break;
                case "material": {
                    Kind k = Kind.valueOf(w[2].toUpperCase());
                    s.mats.put(w[1], new Mat(k, new V(n[3], n[4], n[5]), w.length > 6 ? n[6] : (k == Kind.GLASS ? 1.5 : k == Kind.LIGHT ? 4 : 0)));
                    break;
                }
                case "sphere": s.shapes.add(new Sphere(new V(n[1], n[2], n[3]), n[4], s.mat(w[5]))); break;
                case "plane": s.shapes.add(new Plane(n[1], s.mat(w[2]))); break;
                case "box": s.shapes.add(new Box(new V(n[1], n[2], n[3]), new V(n[4], n[5], n[6]), s.mat(w[7]))); break;
                default: System.err.println("? " + raw);
            }
        }
        return s;
    }
    final List<Sphere> lights = new ArrayList<>();
    void collectLights() { lights.clear(); for (Shape sh : shapes) if (sh instanceof Sphere && ((Sphere) sh).m.k == Kind.LIGHT) lights.add((Sphere) sh); }

    /** Next-event estimation: from a diffuse point, ask every round lamp directly whether it can be seen. */
    V direct(Hit h, ThreadLocalRandom r) {
        V sum = ZERO;
        for (Sphere L : lights) {
            V toC = L.c.sub(h.p); double dist2 = toC.dot(toC), cosMax = Math.sqrt(Math.max(0, 1 - L.r * L.r / dist2));
            /* a random direction inside the cone the lamp covers */
            double cosT = 1 - r.nextDouble() * (1 - cosMax), sinT = Math.sqrt(1 - cosT * cosT), phi = 2 * Math.PI * r.nextDouble();
            V w = toC.norm(), a = Math.abs(w.x) > 0.9 ? new V(0, 1, 0) : new V(1, 0, 0), u = a.cross(w).norm(), v = w.cross(u);
            V dir = u.mul(Math.cos(phi) * sinT).add(v.mul(Math.sin(phi) * sinT)).add(w.mul(cosT)).norm();
            double ndl = h.n.dot(dir); if (ndl <= 0) continue;
            Hit sh = new Hit();
            if (trace(h.p, dir, sh) && sh.s == L) {
                double omega = 2 * Math.PI * (1 - cosMax);
                double att = fog > 0 ? Math.exp(-fog * sh.t) : 1;
                sum = sum.add(L.m.c.mul(L.m.p * ndl * omega / Math.PI * att));
            }
        }
        return sum;
    }

    Mat mat(String name) { Mat m = mats.get(name); if (m == null) throw new IllegalArgumentException("unknown material " + name); return m; }

    boolean trace(V o, V d, Hit best) {
        boolean any = false; Hit h = new Hit(); double far = 1e9;
        for (Shape s : shapes) if (s.hit(o, d, 1e-4, far, h)) { any = true; far = h.t; best.t = h.t; best.p = h.p; best.n = h.n; best.m = h.m; best.front = h.front; best.s = h.s; }
        return any;
    }

    V sky(V d) { double k = Math.sqrt(Math.max(0, d.y)); return skyLow.mul(1 - k).add(skyTop.mul(k)); }

    static V randomUnit(ThreadLocalRandom r) {
        double z = r.nextDouble() * 2 - 1, a = r.nextDouble() * Math.PI * 2, s = Math.sqrt(1 - z * z);
        return new V(s * Math.cos(a), s * Math.sin(a), z);
    }

    V radiance(V o, V d, ThreadLocalRandom r) {
        V col = ZERO, thr = new V(1, 1, 1); boolean sampled = false;
        for (int depth = 0; depth < BOUNCES; depth++) {
            Hit h = new Hit();
            if (!trace(o, d, h)) { col = col.add(thr.mul(sky(d))); break; }
            if (fog > 0) {   /* light gets lost in the mist on the way */
                double f = Math.exp(-fog * h.t); col = col.add(thr.mul(fogC.mul(1 - f))); thr = thr.mul(f);
            }
            Mat m = h.m;
            if (m.k == Kind.LIGHT) { if (!(sampled && lights.contains(h.s))) col = col.add(thr.mul(m.c.mul(m.p))); break; }
            sampled = false;
            if (m.k == Kind.DIFFUSE) { thr = thr.mul(m.c); col = col.add(thr.mul(direct(h, r))); sampled = true; d = h.n.add(randomUnit(r)).norm(); }
            else if (m.k == Kind.METAL) { V refl = d.sub(h.n.mul(2 * d.dot(h.n))); d = refl.add(randomUnit(r).mul(m.p)).norm(); if (d.dot(h.n) <= 0) break; thr = thr.mul(m.c); }
            else {   /* glass: Snell with Schlick's reflectance */
                double eta = h.front ? 1 / m.p : m.p, cos = Math.min(-d.dot(h.n), 1), sin = Math.sqrt(1 - cos * cos);
                double r0 = Math.pow((1 - eta) / (1 + eta), 2), refl = r0 + (1 - r0) * Math.pow(1 - cos, 5);
                if (eta * sin > 1 || r.nextDouble() < refl) d = d.sub(h.n.mul(2 * d.dot(h.n)));
                else { V perp = d.add(h.n.mul(cos)).mul(eta), par = h.n.mul(-Math.sqrt(Math.abs(1 - perp.dot(perp)))); d = perp.add(par).norm(); }
                thr = thr.mul(m.c);
            }
            o = h.p;
            if (depth > 2) { double p = Math.min(0.95, thr.max()); if (r.nextDouble() > p) break; thr = thr.mul(1 / p); }   /* Russian roulette */
        }
        return col;
    }

    /* ---------------- the agents: one per core, tiles, passes ---------------- */
    void render(File out) throws Exception {
        collectLights();
        int cores = Runtime.getRuntime().availableProcessors(), T = 32, tx = (W + T - 1) / T, ty = (H + T - 1) / T;
        double[] acc = new double[W * H * 3];
        V fw = at.sub(from).norm(), rt = new V(0, 1, 0).cross(fw).norm(), up = fw.cross(rt);
        double hh = Math.tan(Math.toRadians(fov) / 2), ww = hh * W / H;
        int passes = Math.max(1, SPP / 8), per = Math.max(1, SPP / passes);
        ExecutorService pool = Executors.newFixedThreadPool(cores);
        long t0 = System.currentTimeMillis();
        System.out.printf("Промінь: %d×%d, %d семплів, %d агентів%n", W, H, passes * per, cores);
        for (int pass = 1; pass <= passes; pass++) {
            AtomicInteger next = new AtomicInteger();
            List<Future<?>> fs = new ArrayList<>();
            for (int a = 0; a < cores; a++) fs.add(pool.submit(() -> {
                ThreadLocalRandom r = ThreadLocalRandom.current();
                for (int tile; (tile = next.getAndIncrement()) < tx * ty; ) {
                    int x0 = (tile % tx) * T, y0 = (tile / tx) * T;
                    for (int y = y0; y < Math.min(H, y0 + T); y++) for (int x = x0; x < Math.min(W, x0 + T); x++) {
                        V sum = ZERO;
                        for (int s = 0; s < per; s++) {
                            double u = (2 * (x + r.nextDouble()) / W - 1) * ww, v = (1 - 2 * (y + r.nextDouble()) / H) * hh;
                            sum = sum.add(radiance(from, fw.add(rt.mul(u)).add(up.mul(v)).norm(), r));
                        }
                        int i = (y * W + x) * 3; acc[i] += sum.x; acc[i + 1] += sum.y; acc[i + 2] += sum.z;
                    }
                }
            }));
            for (Future<?> f : fs) f.get();
            write(acc, pass * per, out);
            System.out.printf("  прохід %d/%d · %.1f с%n", pass, passes, (System.currentTimeMillis() - t0) / 1000.0);
        }
        pool.shutdown();
    }

    void write(double[] acc, int n, File out) throws Exception {
        BufferedImage img = new BufferedImage(W, H, BufferedImage.TYPE_INT_RGB);
        for (int i = 0; i < W * H; i++) {
            int rgb = 0;
            for (int c = 0; c < 3; c++) {
                double v = acc[i * 3 + c] / n; v = v / (1 + v); v = Math.pow(v, 1 / 2.2);   /* Reinhard, then gamma */
                rgb = (rgb << 8) | (int) Math.max(0, Math.min(255, v * 255 + 0.5));
            }
            img.setRGB(i % W, i / W, rgb);
        }
        File tmp = new File(out.getPath() + ".part.png"); ImageIO.write(img, "png", tmp);
        Files.move(tmp.toPath(), out.toPath(), StandardCopyOption.REPLACE_EXISTING);
    }

    /* ---------------- entry ---------------- */
    public static void main(String[] a) throws Exception {
        if (a.length >= 3 && a[0].equals("--watch")) { watch(new File(a[1]), new File(a[2])); return; }
        if (a.length < 1) { System.out.println("java Promin.java scene.txt [out.png]   |   java Promin.java --watch inbox out"); return; }
        File in = new File(a[0]), out = new File(a.length > 1 ? a[1] : in.getName().replaceAll("\\.\\w+$", "") + ".png");
        parse(Files.readAllLines(in.toPath())).render(out);
        System.out.println("Готово: " + out.getAbsolutePath());
    }

    /** The agents wait for scenes: every new or changed .txt in inbox/ becomes out/<name>.png. */
    static void watch(File inbox, File out) throws Exception {
        inbox.mkdirs(); out.mkdirs(); Map<String, Long> seen = new HashMap<>();
        System.out.println("Агенти чекають на сцени в " + inbox.getAbsolutePath() + " → " + out.getAbsolutePath() + "  (Ctrl+C — зупинити)");
        while (true) {
            File[] fs = inbox.listFiles((d, n) -> n.endsWith(".txt")); if (fs != null) Arrays.sort(fs);
            if (fs != null) for (File f : fs) {
                Long was = seen.get(f.getName());
                if (was != null && was == f.lastModified()) continue;
                seen.put(f.getName(), f.lastModified());
                try { parse(Files.readAllLines(f.toPath())).render(new File(out, f.getName().replace(".txt", ".png"))); }
                catch (Exception e) { System.err.println(f.getName() + ": " + e.getMessage()); }
            }
            Thread.sleep(1500);
        }
    }
}
