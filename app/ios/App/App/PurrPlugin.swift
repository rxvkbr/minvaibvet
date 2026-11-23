import Capacitor
import CoreHaptics
import UIKit

/// The same API as the Android Purr plugin: play({pattern, intensity}), stop(), tick({kind}).
/// A cat purrs at about 25 Hz with a breathing rhythm, a dog thumps its tail, a rat chatters its teeth.
@objc(PurrPlugin)
public class PurrPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PurrPlugin"
    public let jsName = "Purr"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "play", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "tick", returnType: CAPPluginReturnPromise)
    ]

    private var engine: CHHapticEngine?
    private var player: CHHapticAdvancedPatternPlayer?

    private var supportsHaptics: Bool {
        CHHapticEngine.capabilitiesForHardware().supportsHaptics
    }

    private func startEngine() throws -> CHHapticEngine {
        if let e = engine { try e.start(); return e }
        let e = try CHHapticEngine()
        e.isAutoShutdownEnabled = true
        e.resetHandler = { [weak self] in try? self?.engine?.start() }
        try e.start()
        engine = e
        return e
    }

    private func transient(_ t: TimeInterval, _ intensity: Float, _ sharpness: Float) -> CHHapticEvent {
        CHHapticEvent(eventType: .hapticTransient, parameters: [
            CHHapticEventParameter(parameterID: .hapticIntensity, value: intensity),
            CHHapticEventParameter(parameterID: .hapticSharpness, value: sharpness)
        ], relativeTime: t)
    }

    /// One loop of the pattern and its length in seconds.
    private func events(for pattern: String, intensity: Float) -> ([CHHapticEvent], TimeInterval) {
        switch pattern {
        case "dog":
            return ([transient(0, intensity, 0.5)], 0.30)
        case "rat":
            let v = intensity * 0.55
            return ([transient(0, v, 0.9), transient(0.03, v, 0.9), transient(0.06, v, 0.9)], 0.27)
        default:
            // 25 Hz pulses: 18 on the out-breath, 12 softer ones on the in-breath (about 1.2 s per cycle).
            var list: [CHHapticEvent] = []
            for i in 0..<30 {
                let breath: Float = i < 18 ? 1.0 : 0.55
                list.append(transient(Double(i) * 0.04, intensity * breath, 0.15))
            }
            return (list, 1.2)
        }
    }

    @objc func play(_ call: CAPPluginCall) {
        guard supportsHaptics else { call.resolve(); return }
        let pattern = call.getString("pattern") ?? "cat"
        let intensity = Float(max(0.05, min(1.0, call.getDouble("intensity") ?? 0.5)))
        DispatchQueue.main.async {
            do {
                let e = try self.startEngine()
                try? self.player?.stop(atTime: CHHapticTimeImmediate)
                let (list, length) = self.events(for: pattern, intensity: intensity)
                let p = try e.makeAdvancedPlayer(with: CHHapticPattern(events: list, parameters: []))
                p.loopEnabled = true
                p.loopEnd = length
                try p.start(atTime: CHHapticTimeImmediate)
                self.player = p
            } catch {}
            call.resolve()
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            try? self.player?.stop(atTime: CHHapticTimeImmediate)
            self.player = nil
            call.resolve()
        }
    }

    /// A short tap for buttons and tabs: "tick", "click" or "heavy".
    @objc func tick(_ call: CAPPluginCall) {
        let kind = call.getString("kind") ?? "tick"
        DispatchQueue.main.async {
            switch kind {
            case "heavy": UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
            case "click": UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            default: UISelectionFeedbackGenerator().selectionChanged()
            }
            call.resolve()
        }
    }
}
