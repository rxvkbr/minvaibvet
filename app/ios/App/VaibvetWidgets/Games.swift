import AppIntents
import SwiftUI
import WidgetKit

// Widget games, 1–2 minutes each, played right on the home screen (iOS 17+):
// «Хрестики-нулики з комбатом» and «Вище чи нижче?». Same rules as the Android widgets.

enum TT {
    static let lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
    static var board: [Character] { Array(VV.store.string(forKey: "tt_board") ?? ".........") }
    static func winner(_ b: [Character]) -> Character? {
        for l in lines where b[l[0]] != "." && b[l[0]] == b[l[1]] && b[l[1]] == b[l[2]] { return b[l[0]] }
        return nil
    }
    static func finish(_ b: [Character], _ who: Character) -> Int? {
        for l in lines {
            let mine = l.filter { b[$0] == who }.count, empty = l.first { b[$0] == "." }
            if mine == 2, let e = empty { return e }
        }
        return nil
    }
    /// Wins if he can, blocks if he must (nearly always), likes the centre, otherwise anything.
    static func commander(_ b: [Character]) -> Int {
        if let w = finish(b, "O") { return w }
        if let k = finish(b, "X"), Int.random(in: 0..<10) > 0 { return k }
        if b[4] == "." { return 4 }
        return b.indices.filter { b[$0] == "." }.randomElement()!
    }
    static func play(_ cell: Int) {
        let s = VV.store
        var b = board
        let st = s.integer(forKey: "tt_st")
        guard st < 2, b[cell] == "." else { return }
        b[cell] = "X"
        if winner(b) == "X" { s.set(2, forKey: "tt_st"); s.set(s.integer(forKey: "tt_w") + 1, forKey: "tt_w") }
        else if !b.contains(".") { s.set(4, forKey: "tt_st"); s.set(s.integer(forKey: "tt_d") + 1, forKey: "tt_d") }
        else {
            b[commander(b)] = "O"
            if winner(b) == "O" { s.set(3, forKey: "tt_st"); s.set(s.integer(forKey: "tt_l") + 1, forKey: "tt_l") }
            else if !b.contains(".") { s.set(4, forKey: "tt_st"); s.set(s.integer(forKey: "tt_d") + 1, forKey: "tt_d") }
            else { s.set(1, forKey: "tt_st") }
        }
        s.set(Int.random(in: 0..<8), forKey: "tt_idx")
        s.set(String(b), forKey: "tt_board")
    }
    static func reset() {
        VV.store.set(".........", forKey: "tt_board"); VV.store.set(0, forKey: "tt_st"); VV.store.set(Int.random(in: 0..<2), forKey: "tt_idx")
    }
}

@available(iOS 17.0, *)
struct TTMove: AppIntent {
    static var title: LocalizedStringResource = "Move"
    @Parameter(title: "Cell") var cell: Int
    init() {}
    init(_ c: Int) { cell = c }
    func perform() async throws -> some IntentResult { if cell < 0 { TT.reset() } else { TT.play(cell) }; return .result() }
}

struct TicTacView: View {
    let entry: Tick
    var status: String {
        let s = VV.store, i = s.integer(forKey: "tt_idx")
        let l: [String] = [GS.ttStart, GS.ttMove, GS.ttWin, GS.ttLose, GS.ttDraw][min(4, s.integer(forKey: "tt_st"))]
        return l[i % l.count]
    }
    var body: some View {
        let b = TT.board, s = VV.store
        VStack(alignment: .leading, spacing: 5) {
            HStack {
                Text(GS.ttTitle).font(VV.mono).foregroundColor(VV.amber).lineLimit(1).minimumScaleFactor(0.6)
                Spacer()
                tap(-1) { Text(GS.new).font(.system(size: 10, weight: .heavy, design: .rounded)).foregroundColor(VV.bg).padding(.horizontal, 8).padding(.vertical, 4).background(VV.amber).clipShape(Capsule()) }
            }
            ForEach(0..<3, id: \.self) { r in
                HStack(spacing: 5) {
                    ForEach(0..<3, id: \.self) { col in
                        let i = r * 3 + col, ch = b[i]
                        tap(i) {
                            Text(ch == "X" ? "✕" : ch == "O" ? "◯" : " ").font(.system(size: 22, weight: .heavy, design: .rounded))
                                .foregroundColor(ch == "X" ? VV.bg : VV.neon).frame(maxWidth: .infinity, maxHeight: .infinity)
                                .background(VV.ivory).clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                    }
                }
            }
            Text(status).font(.system(size: 11)).foregroundColor(VV.ivory).lineLimit(2).minimumScaleFactor(0.8)
            Text(String(format: GS.ttScore, s.integer(forKey: "tt_w"), s.integer(forKey: "tt_l"), s.integer(forKey: "tt_d"))).font(.system(size: 9)).foregroundColor(VV.dim)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .vvBackground()
    }
    @ViewBuilder func tap<C: View>(_ cell: Int, @ViewBuilder _ content: () -> C) -> some View {
        if #available(iOS 17.0, *) { Button(intent: TTMove(cell)) { content() }.buttonStyle(.plain) } else { content() }
    }
}

struct TicTacWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "TicTacWidget", provider: DailyProvider()) { TicTacView(entry: $0) }
            .configurationDisplayName(GS.ttName).description(GS.ttDesc)
            .supportedFamilies([.systemLarge])
    }
}

// MARK: - «Вище чи нижче?»

enum HL {
    static let goal = 7
    static func guess(_ up: Bool) {
        let s = VV.store
        if s.integer(forKey: "hl_st") == 3 { s.set(0, forKey: "hl_s"); s.set(0, forKey: "hl_st"); s.set(Int.random(in: 5...45), forKey: "hl_n"); return }
        let cur = s.object(forKey: "hl_n") as? Int ?? 23
        var next = Int.random(in: 0...50)
        while next == cur { next = Int.random(in: 0...50) }
        let right = up ? next > cur : next < cur
        let streak = right ? s.integer(forKey: "hl_s") + 1 : 0
        s.set(next, forKey: "hl_n"); s.set(streak, forKey: "hl_s"); s.set(Int.random(in: 0..<6), forKey: "hl_idx")
        s.set(streak >= goal ? 3 : right ? 1 : 2, forKey: "hl_st")
        s.set(max(s.integer(forKey: "hl_best"), streak), forKey: "hl_best")
    }
}

@available(iOS 17.0, *)
struct HLGuess: AppIntent {
    static var title: LocalizedStringResource = "Guess"
    @Parameter(title: "Up") var up: Bool
    init() {}
    init(_ u: Bool) { up = u }
    func perform() async throws -> some IntentResult { HL.guess(up); return .result() }
}

struct HiLoView: View {
    let entry: Tick
    var text: String {
        let s = VV.store, i = s.integer(forKey: "hl_idx")
        switch s.integer(forKey: "hl_st") {
        case 1: return GS.hlRight[i % GS.hlRight.count]
        case 2: return GS.hlWrong[i % GS.hlWrong.count]
        case 3: return GS.hlWin
        default: return GS.hlStart
        }
    }
    var body: some View {
        let s = VV.store
        VStack(alignment: .leading, spacing: 6) {
            Text(GS.hlTitle).font(VV.mono).foregroundColor(VV.amber).lineLimit(1).minimumScaleFactor(0.6)
            HStack(spacing: 10) {
                Text("\(s.object(forKey: "hl_n") as? Int ?? 23)%").font(.system(size: 36, weight: .heavy, design: .rounded)).foregroundColor(VV.neon)
                Text(text).font(.system(size: 11)).foregroundColor(VV.ivory).lineLimit(3).minimumScaleFactor(0.8)
            }
            HStack(spacing: 6) { btn(true, GS.hlUp, VV.amber, VV.bg); btn(false, GS.hlDown, VV.neon, .white) }
            Text(String(format: GS.hlStreak, s.integer(forKey: "hl_s"), s.integer(forKey: "hl_best"))).font(.system(size: 9)).foregroundColor(VV.dim)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .vvBackground()
    }
    @ViewBuilder func btn(_ up: Bool, _ t: String, _ bg: Color, _ fg: Color) -> some View {
        let label = Text(t).font(.system(size: 13, weight: .heavy, design: .rounded)).foregroundColor(fg)
            .frame(maxWidth: .infinity).padding(.vertical, 8).background(bg).clipShape(Capsule())
        if #available(iOS 17.0, *) { Button(intent: HLGuess(up)) { label }.buttonStyle(.plain) } else { label }
    }
}

struct HiLoWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "HiLoWidget", provider: DailyProvider()) { HiLoView(entry: $0) }
            .configurationDisplayName(GS.hlName).description(GS.hlDesc)
            .supportedFamilies([.systemMedium])
    }
}
