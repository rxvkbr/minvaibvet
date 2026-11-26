import AppIntents
import SwiftUI
import WidgetKit

// Вайбвет FM home-screen widgets for iOS — the same three as on Android:
// «Вайб дня» (tap for the next line), «Прогноз відпустки» (today + the week) and «Кнопки-фігня».
// State lives in the extension's own UserDefaults; nothing is shared with the app or sent anywhere.

// MARK: - Shared helpers (match WidgetUtil.java, so Android and iOS show the same numbers)

/// java.util.Random, so a seed gives the same sequence as on Android.
struct JavaRandom {
    private var seed: Int64
    init(_ s: Int64) { seed = (s ^ 0x5DEECE66D) & ((1 << 48) - 1) }
    mutating func next(_ bits: Int) -> Int32 {
        seed = (seed &* 0x5DEECE66D &+ 0xB) & ((1 << 48) - 1)
        return Int32(truncatingIfNeeded: seed >> (48 - Int64(bits)))
    }
    mutating func nextInt(_ bound: Int) -> Int {
        let b = Int32(bound)
        if b & -b == b { return Int((Int64(b) &* Int64(next(31))) >> 31) }
        var bits: Int32, val: Int32
        repeat { bits = next(31); val = bits % b } while bits &- val &+ (b &- 1) < 0
        return Int(val)
    }
}

enum VV {
    static let store = UserDefaults.standard
    static var cal: Calendar { var c = Calendar(identifier: .gregorian); c.timeZone = .current; return c }

    static func dayKey(_ d: Date) -> Int { cal.component(.year, from: d) * 1000 + cal.ordinality(of: .day, in: .year, for: d)! }
    static func seeded(_ day: Int, _ salt: Int) -> JavaRandom { JavaRandom(Int64(day) &* 7919 &+ Int64(salt) &* 104729) }

    /// Chance of leave in percent. Fridays are always zero.
    static func chance(_ d: Date) -> Int {
        let dow = cal.component(.weekday, from: d)   // 1 = Sunday … 7 = Saturday, as in java.util.Calendar
        if dow == 6 { return 0 }
        var r = seeded(dayKey(d), 1)
        var v = r.nextInt(17)
        if dow == 7 { v += 22 + r.nextInt(15) } else if dow == 1 { v += 4 }
        return v
    }

    static func vibe(_ d: Date) -> String {
        let day = dayKey(d)
        if store.integer(forKey: "vibe_day") != day { store.set(day, forKey: "vibe_day"); store.set(0, forKey: "vibe_off") }
        var r = seeded(day, 3)
        let start = r.nextInt(WS.vibes.count)
        return WS.vibes[(start + store.integer(forKey: "vibe_off")) % WS.vibes.count]
    }

    static func note(_ d: Date) -> String {
        var r = seeded(dayKey(d), 2)
        return WS.forecastNotes[r.nextInt(WS.forecastNotes.count)]
    }

    static func open(_ section: String) -> URL { URL(string: "vaibvet://section/\(section)")! }

    static let bg = Color(red: 0.102, green: 0.063, blue: 0.043)        // #1a100b
    static let ivory = Color(red: 0.949, green: 0.890, blue: 0.741)     // #f2e3bd
    static let dim = Color(red: 0.725, green: 0.643, blue: 0.498)       // #b9a47f
    static let amber = Color(red: 0.941, green: 0.663, blue: 0.227)     // #f0a93a
    static let neon = Color(red: 1.0, green: 0.365, blue: 0.278)        // #ff5d47
    static let mint = Color(red: 0.345, green: 0.788, blue: 0.725)      // #58c9b9
    static let mono = Font.system(size: 10, weight: .bold, design: .monospaced)
}

struct Tick: TimelineEntry { let date: Date }

/// Refreshes just after midnight, so the vibe and the forecast change with the day.
struct DailyProvider: TimelineProvider {
    func placeholder(in context: Context) -> Tick { Tick(date: .now) }
    func getSnapshot(in context: Context, completion: @escaping (Tick) -> Void) { completion(Tick(date: .now)) }
    func getTimeline(in context: Context, completion: @escaping (Timeline<Tick>) -> Void) {
        let midnight = VV.cal.startOfDay(for: .now.addingTimeInterval(86_400)).addingTimeInterval(5)
        completion(Timeline(entries: [Tick(date: .now)], policy: .after(midnight)))
    }
}

extension View {
    @ViewBuilder func vvBackground() -> some View {
        if #available(iOS 17.0, *) { containerBackground(VV.bg, for: .widget) } else { background(VV.bg) }
    }
}

// MARK: - Intents (iOS 17+: buttons work right on the widget)

@available(iOS 17.0, *)
struct NextVibe: AppIntent {
    static var title: LocalizedStringResource = "Next vibe"
    func perform() async throws -> some IntentResult {
        VV.store.set(VV.store.integer(forKey: "vibe_off") + 1, forKey: "vibe_off")
        return .result()
    }
}

/// 1 = +1 vibe, 2 = hotline, 3 = submit a request.
@available(iOS 17.0, *)
struct PressButton: AppIntent {
    static var title: LocalizedStringResource = "Press"
    @Parameter(title: "Kind") var kind: Int
    init() {}
    init(_ k: Int) { kind = k }
    func perform() async throws -> some IntentResult {
        let s = VV.store
        switch kind {
        case 1: s.set(s.integer(forKey: "vibes") + 1, forKey: "vibes"); s.set(1, forKey: "st_type")
        case 2: s.set(pickOther(WS.hotlineLines.count, s.integer(forKey: "st_type") == 2 ? s.integer(forKey: "st_idx") : -1), forKey: "st_idx"); s.set(2, forKey: "st_type")
        default: s.set(pickOther(WS.rejections.count, s.integer(forKey: "st_type") == 3 ? s.integer(forKey: "st_idx") : -1), forKey: "st_idx"); s.set(3, forKey: "st_type")
        }
        return .result()
    }
    private func pickOther(_ n: Int, _ prev: Int) -> Int {
        guard n > 1 else { return 0 }
        let i = Int.random(in: 0..<(n - 1))
        return prev >= 0 && i >= prev ? i + 1 : i
    }
}

// MARK: - «Вайб дня»

struct VibeView: View {
    let entry: Tick
    var body: some View {
        let text = VStack(alignment: .leading, spacing: 6) {
            Text(WS.vibeTitle).font(VV.mono).foregroundColor(VV.amber).lineLimit(1).minimumScaleFactor(0.7)
            Spacer(minLength: 0)
            Text(VV.vibe(entry.date)).font(.system(size: 17, weight: .semibold, design: .serif)).foregroundColor(VV.ivory).minimumScaleFactor(0.6)
            Spacer(minLength: 0)
            Text(WS.vibeHint).font(.system(size: 10)).foregroundColor(VV.dim)
        }.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        if #available(iOS 17.0, *) {
            Button(intent: NextVibe()) { text }.buttonStyle(.plain).vvBackground()
        } else {
            text.padding().vvBackground()
        }
    }
}

struct VibeWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "VibeWidget", provider: DailyProvider()) { VibeView(entry: $0) }
            .configurationDisplayName(WS.vibeName).description(WS.vibeDesc)
            .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - «Прогноз відпустки»

struct ForecastView: View {
    let entry: Tick
    @Environment(\.widgetFamily) var family
    var body: some View {
        let today = VV.chance(entry.date)
        let note = VV.note(entry.date)
        VStack(alignment: .leading, spacing: 4) {
            Text(WS.forecastTitle).font(VV.mono).foregroundColor(VV.amber).lineLimit(1).minimumScaleFactor(0.7)
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text("\(today)%").font(.system(size: 34, weight: .heavy, design: .rounded)).foregroundColor(VV.neon)
                Text(WS.today).font(.system(size: 11)).foregroundColor(VV.dim)
            }
            Text(String(format: WS.feels, Int((Double(today) / 6).rounded()))).font(.system(size: 11)).foregroundColor(VV.ivory)
            if family == .systemSmall {
                Spacer(minLength: 0)
                Text(note).font(.system(size: 10)).foregroundColor(VV.dim).lineLimit(3)
            } else {
                week
                Text(note).font(.system(size: 10)).foregroundColor(VV.dim).lineLimit(1)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .widgetURL(VV.open("prognoz"))
        .vvBackground()
    }
    /// Monday to Sunday of this week, today's bar in neon.
    var week: some View {
        let shift = (VV.cal.component(.weekday, from: entry.date) + 5) % 7
        let monday = VV.cal.date(byAdding: .day, value: -shift, to: entry.date)!
        return HStack(alignment: .bottom, spacing: 6) {
            ForEach(0..<7, id: \.self) { i in
                let d = VV.cal.date(byAdding: .day, value: i, to: monday)!
                let pct = VV.chance(d), isToday = i == shift
                VStack(spacing: 2) {
                    Text("\(pct)%").font(.system(size: 8, weight: .bold, design: .monospaced)).foregroundColor(isToday ? VV.ivory : VV.amber)
                    RoundedRectangle(cornerRadius: 3).fill(isToday ? VV.neon : VV.amber)
                        .frame(height: max(3, 30 * CGFloat(min(pct, 50)) / 50))
                    Text(WS.days[i]).font(.system(size: 9, weight: isToday ? .bold : .regular)).foregroundColor(isToday ? VV.ivory : VV.dim)
                }.frame(maxWidth: .infinity)
            }
        }.frame(maxHeight: .infinity, alignment: .bottom)
    }
}

struct ForecastWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "ForecastWidget", provider: DailyProvider()) { ForecastView(entry: $0) }
            .configurationDisplayName(WS.forecastName).description(WS.forecastDesc)
            .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - «Кнопки-фігня»

struct ButtonsView: View {
    let entry: Tick
    var status: String {
        let s = VV.store, i = s.integer(forKey: "st_idx")
        switch s.integer(forKey: "st_type") {
        case 1: return WS.vibePlusMsg
        case 2: return WS.hotlineLines[max(0, min(i, WS.hotlineLines.count - 1))]
        case 3: return WS.rejections[max(0, min(i, WS.rejections.count - 1))]
        default: return WS.statusIdle
        }
    }
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(WS.buttonsTitle).font(VV.mono).foregroundColor(VV.amber).lineLimit(1).minimumScaleFactor(0.7)
                Spacer()
                Text(String(format: WS.count, VV.store.integer(forKey: "vibes"))).font(VV.mono).foregroundColor(VV.mint)
            }
            HStack(spacing: 6) {
                Link(destination: VV.open("dron")) { chip(WS.stream, VV.neon) }
                press(1, WS.plus, VV.amber)
                press(2, WS.hotline, VV.mint)
            }
            HStack(spacing: 6) {
                Link(destination: VV.open("hladyty")) { chip(WS.pet, VV.ivory) }
                press(3, WS.request, VV.dim)
            }
            Text(status).font(.system(size: 10)).foregroundColor(VV.ivory).lineLimit(2).minimumScaleFactor(0.8)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .vvBackground()
    }
    func chip(_ t: String, _ c: Color) -> some View {
        Text(t).font(.system(size: 10, weight: .heavy, design: .rounded)).foregroundColor(VV.bg).lineLimit(1).minimumScaleFactor(0.6)
            .padding(.vertical, 7).frame(maxWidth: .infinity).background(c).clipShape(Capsule())
    }
    @ViewBuilder func press(_ k: Int, _ t: String, _ c: Color) -> some View {
        if #available(iOS 17.0, *) {
            Button(intent: PressButton(k)) { chip(t, c) }.buttonStyle(.plain)
        } else {
            Link(destination: VV.open("gazeta")) { chip(t, c) }
        }
    }
}

struct ButtonsWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "ButtonsWidget", provider: DailyProvider()) { ButtonsView(entry: $0) }
            .configurationDisplayName(WS.buttonsName).description(WS.buttonsDesc)
            .supportedFamilies([.systemMedium])
    }
}

@main
struct VaibvetWidgets: WidgetBundle {
    var body: some Widget {
        VibeWidget()
        ForecastWidget()
        ButtonsWidget()
        TicTacWidget()
        HiLoWidget()
        ThorWidget()
        ShipIsland()
    }
}
