import ActivityKit
import SwiftUI
import WidgetKit

// «Верф»: the ship being built, in the Dynamic Island and on the Lock Screen.
// The game (korabel.html) starts and updates it through Purr.island; nothing is sent anywhere.

/// The same type lives in App/PurrPlugin.swift: the system matches the two by name.
struct ShipAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var stage: String
        var pct: Int
        var icon: String
        var until: Date?
    }
    var ship: String
}

private let sea = Color(red: 0.31, green: 0.76, blue: 0.91)
private let sun = Color(red: 1.0, green: 0.77, blue: 0.24)

private struct Countdown: View {
    let until: Date?
    var body: some View {
        if let u = until, u > Date() {
            Text(timerInterval: Date()...u, countsDown: true).monospacedDigit()
        }
    }
}

private struct ShipLine: View {
    let state: ShipAttributes.ContentState
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(state.stage).font(.subheadline.weight(.semibold)).lineLimit(1)
                Spacer()
                Countdown(until: state.until).font(.subheadline).foregroundColor(sun)
            }
            ProgressView(value: Double(min(max(state.pct, 0), 100)), total: 100).tint(sun)
        }
    }
}

struct ShipIsland: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: ShipAttributes.self) { ctx in
            HStack(spacing: 12) {
                Text(ctx.state.icon).font(.system(size: 34))
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(ctx.attributes.ship).font(.headline).lineLimit(1)
                        Spacer()
                        Text("\(ctx.state.pct)%").font(.headline.monospacedDigit()).foregroundColor(sun)
                    }
                    ShipLine(state: ctx.state)
                }
            }
            .padding(14)
            .foregroundColor(.white)
            .activityBackgroundTint(Color(red: 0.08, green: 0.2, blue: 0.29))
            .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { ctx in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) { Text(ctx.state.icon).font(.title2) }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("\(ctx.state.pct)%").font(.title3.monospacedDigit()).foregroundColor(sun)
                }
                DynamicIslandExpandedRegion(.center) { Text(ctx.attributes.ship).font(.headline).lineLimit(1) }
                DynamicIslandExpandedRegion(.bottom) { ShipLine(state: ctx.state) }
            } compactLeading: {
                Text(ctx.state.icon)
            } compactTrailing: {
                if let u = ctx.state.until, u > Date() {
                    Text(timerInterval: Date()...u, countsDown: true).monospacedDigit().frame(maxWidth: 44).foregroundColor(sun)
                } else {
                    Text("\(ctx.state.pct)%").monospacedDigit().foregroundColor(sea)
                }
            } minimal: {
                Text(ctx.state.icon)
            }
            .keylineTint(sun)
        }
    }
}


// «Рація»: two ICQ-style statuses in the Dynamic Island, yours on the left and a friend's on the right.
// racia.html starts and updates it through Purr.racia; only the two statuses live here.

/// The same type lives in App/PurrPlugin.swift: the system matches the two by name.
struct RaciaAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var me: String        // flower/emoji for my status
        var meLine: String    // "Вільний для чату"
        var friend: String    // flower/emoji for the pinned friend
        var friendName: String
        var friendLine: String
    }
    var title: String
}

private let uaBlue = Color(red: 0.0, green: 0.36, blue: 0.73)
private let uaYellow = Color(red: 1.0, green: 0.84, blue: 0.0)

private struct UaFlag: View {
    var body: some View {
        VStack(spacing: 0) { uaBlue; uaYellow }
            .frame(width: 18, height: 12).clipShape(RoundedRectangle(cornerRadius: 2))
    }
}

struct RaciaIsland: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: RaciaAttributes.self) { ctx in
            VStack(alignment: .leading, spacing: 8) {
                HStack { UaFlag(); Text(ctx.attributes.title).font(.headline); Spacer() }
                HStack(alignment: .top) {
                    VStack(alignment: .leading) {
                        Text(ctx.state.me).font(.title2)
                        Text(ctx.state.meLine).font(.caption).lineLimit(1)
                    }
                    Spacer()
                    VStack(alignment: .trailing) {
                        Text(ctx.state.friend).font(.title2)
                        Text(ctx.state.friendName).font(.caption.weight(.semibold)).lineLimit(1)
                        Text(ctx.state.friendLine).font(.caption2).lineLimit(1).opacity(0.8)
                    }
                }
            }
            .padding(14)
            .foregroundColor(.white)
            .activityBackgroundTint(Color(red: 0.06, green: 0.08, blue: 0.05))
            .activitySystemActionForegroundColor(uaYellow)
        } dynamicIsland: { ctx in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading) { Text(ctx.state.me).font(.title2); Text(ctx.state.meLine).font(.caption2).lineLimit(1) }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing) { Text(ctx.state.friend).font(.title2); Text(ctx.state.friendLine).font(.caption2).lineLimit(1) }
                }
                DynamicIslandExpandedRegion(.center) {
                    HStack(spacing: 6) { UaFlag(); Text(ctx.state.friendName).font(.subheadline.weight(.semibold)).lineLimit(1) }
                }
            } compactLeading: {
                Text(ctx.state.me)
            } compactTrailing: {
                Text(ctx.state.friend)
            } minimal: {
                Text(ctx.state.friend)
            }
            .keylineTint(uaYellow)
        }
    }
}
