import AppIntents
import SwiftUI
import WidgetKit

// «Тор грає»: twelve strikes of the hammer, each with its own line — then «Hammer time.» and a look into the camera.

enum Thor {
    static let last = 12
    static let poses = ["🧔🔨", "🧔⚡", "🔨🧔", "⚡🔨"]
    static var n: Int { VV.store.integer(forKey: "th_n") }
    static func hit() { VV.store.set(n >= last ? 0 : n + 1, forKey: "th_n") }
}

@available(iOS 17.0, *)
struct ThorHit: AppIntent {
    static var title: LocalizedStringResource = "Strike"
    func perform() async throws -> some IntentResult { Thor.hit(); return .result() }
}

struct ThorView: View {
    let entry: Tick
    var body: some View {
        let n = Thor.n, done = n >= Thor.last
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(GS.thTitle).font(VV.mono).foregroundColor(VV.amber)
                Spacer()
                Text(String(format: GS.thCount, min(n, Thor.last))).font(.system(size: 9)).foregroundColor(VV.dim)
            }
            HStack(spacing: 10) {
                Text(done ? "🧔" : Thor.poses[n % Thor.poses.count]).font(.system(size: done ? 46 : 38))
                VStack(alignment: .leading, spacing: 2) {
                    if done { Text(GS.thFinal).font(.system(size: 20, weight: .heavy, design: .rounded)).foregroundColor(VV.neon) }
                    Text(done ? GS.thLook : n == 0 ? GS.thDesc : GS.thLines[(n - 1) % GS.thLines.count])
                        .font(.system(size: 11)).foregroundColor(VV.ivory).lineLimit(3).minimumScaleFactor(0.8)
                }
            }
            hitButton(done ? GS.thAgain : GS.thHit)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .vvBackground()
    }
    @ViewBuilder func hitButton(_ t: String) -> some View {
        let label = Text(t).font(.system(size: 13, weight: .heavy, design: .rounded)).foregroundColor(VV.bg)
            .frame(maxWidth: .infinity).padding(.vertical, 8).background(VV.amber).clipShape(Capsule())
        if #available(iOS 17.0, *) { Button(intent: ThorHit()) { label }.buttonStyle(.plain) } else { label }
    }
}

struct ThorWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "ThorWidget", provider: DailyProvider()) { ThorView(entry: $0) }
            .configurationDisplayName(GS.thName).description(GS.thDesc)
            .supportedFamilies([.systemMedium])
    }
}
