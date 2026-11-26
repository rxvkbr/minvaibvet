#if canImport(ActivityKit)
import ActivityKit
#endif
import AVFoundation
import Capacitor
import CoreHaptics
import UIKit
import UniformTypeIdentifiers

/// The same API as the Android Purr plugin: play({pattern, intensity}), stop(), tick({kind}).
/// A cat purrs at about 25 Hz with a breathing rhythm, a dog thumps its tail, a rat chatters its teeth.
@objc(PurrPlugin)
public class PurrPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PurrPlugin"
    public let jsName = "Purr"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "play", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "tick", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "awake", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "audioMode", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "island", returnType: CAPPluginReturnPromise)
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

    /// Keep the screen on while the radio plays, so the iPad doesn't lock itself mid-broadcast.
    @objc func awake(_ call: CAPPluginCall) {
        let on = call.getBool("on") ?? false
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = on
            call.resolve()
        }
    }

    /// The microphone needs the session to record as well as play (Цифрова дудка); "play" goes back to radio mode.
    @objc func audioMode(_ call: CAPPluginCall) {
        let record = call.getString("mode") == "record"
        DispatchQueue.main.async {
            SceneDelegate.recording = record
            SceneDelegate.audioOn()
            call.resolve()
        }
    }

    /// A short tap: "tick" (selection), "light", "click", "soft", "rigid", "heavy",
    /// "success", "warning" (system feel, two taps), "error" and "hammer" (two blows) and "message" (three taps: Рація only).
    @objc func tick(_ call: CAPPluginCall) {
        let kind = call.getString("kind") ?? "tick"
        DispatchQueue.main.async {
            switch kind {
            case "heavy": UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
            case "click": UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            case "light": UIImpactFeedbackGenerator(style: .light).impactOccurred()
            case "soft": UIImpactFeedbackGenerator(style: .soft).impactOccurred()
            case "rigid": UIImpactFeedbackGenerator(style: .rigid).impactOccurred()
            case "success": UINotificationFeedbackGenerator().notificationOccurred(.success)
            case "warning": UINotificationFeedbackGenerator().notificationOccurred(.warning)
            case "error":   // the system error is three taps, and three taps belong to Рація: two firm ones instead
                let g = UIImpactFeedbackGenerator(style: .rigid)
                g.impactOccurred(intensity: 1.0)
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.10) { g.impactOccurred(intensity: 1.0) }
            case "hammer":
                let g = UIImpactFeedbackGenerator(style: .heavy)
                g.impactOccurred(intensity: 0.6)
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.16) { g.impactOccurred(intensity: 1.0) }
            case "message":  // three equal taps: a new message in a Рація chat, and nothing else
                let g = UIImpactFeedbackGenerator(style: .rigid)
                g.impactOccurred(intensity: 0.8)
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.13) { g.impactOccurred(intensity: 0.8) }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.26) { g.impactOccurred(intensity: 0.8) }
            default: UISelectionFeedbackGenerator().selectionChanged()
            }
            call.resolve()
        }
    }
    /// «Верф» in the Dynamic Island and on the Lock Screen: a local Live Activity, started and updated from the game.
    /// island({action: "start"|"update"|"end", ship, stage, pct, icon, until (ms since 1970, 0 = none)}).
    @objc func island(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else { call.resolve(["ok": false]); return }
        let action = call.getString("action") ?? "update"
        let untilMs = call.getDouble("until") ?? 0
        let state = ShipAttributes.ContentState(
            stage: call.getString("stage") ?? "",
            pct: call.getInt("pct") ?? 0,
            icon: call.getString("icon") ?? "⚓",
            until: untilMs > 0 ? Date(timeIntervalSince1970: untilMs / 1000) : nil)
        let ship = call.getString("ship") ?? "Вайбкет-1"
        Task {
            let content = ActivityContent(state: state, staleDate: nil)
            let running = Activity<ShipAttributes>.activities
            if action == "end" {
                for a in running { await a.end(content, dismissalPolicy: .after(Date().addingTimeInterval(90))) }
            } else if let a = running.first {
                await a.update(content)
            } else if ActivityAuthorizationInfo().areActivitiesEnabled {
                _ = try? Activity.request(attributes: ShipAttributes(ship: ship), content: content, pushType: nil)
            }
            call.resolve(["ok": true])
        }
    }
}

/// The same type lives in VaibvetWidgets/ShipIsland.swift: the system matches the two by name.
@available(iOS 16.1, *)
struct ShipAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var stage: String
        var pct: Int
        var icon: String
        var until: Date?
    }
    var ship: String
}


/// Lets the listener pick a coloured app icon (Конструктор → Іконка застосунку).
/// The icons are AppIcon-<name> in Assets.xcassets; "efir" is the original one.
@objc(AppIconPlugin)
public class AppIconPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppIconPlugin"
    public let jsName = "AppIcon"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise)
    ]
    static let names = ["zona", "nich", "burshtyn", "okop", "ukr", "mono", "svitanok"]

    @objc func get(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let cur = UIApplication.shared.alternateIconName ?? ""
            let name = cur.hasPrefix("AppIcon-") ? String(cur.dropFirst(8)) : "efir"
            call.resolve(["name": name, "supported": UIApplication.shared.supportsAlternateIcons])
        }
    }

    @objc func set(_ call: CAPPluginCall) {
        let name = call.getString("name") ?? "efir"
        if name != "efir" && !AppIconPlugin.names.contains(name) {
            call.reject("Unknown icon")
            return
        }
        DispatchQueue.main.async {
            guard UIApplication.shared.supportsAlternateIcons else {
                call.reject("Alternate icons are not supported")
                return
            }
            UIApplication.shared.setAlternateIconName(name == "efir" ? nil : "AppIcon-" + name) { error in
                if let error = error { call.reject(error.localizedDescription) } else { call.resolve(["name": name]) }
            }
        }
    }
}


/// Стіл sync through the listener's own iCloud Drive. The app never sees the passphrase or plain data here:
/// Стіл encrypts on the device and only hands over ciphertext. The file is picked once (Files app), then
/// remembered as a security-scoped bookmark and read/written with file coordination, so iCloud keeps it in step.
@objc(SyncFilePlugin)
public class SyncFilePlugin: CAPPlugin, CAPBridgedPlugin, UIDocumentPickerDelegate {
    public let identifier = "SyncFilePlugin"
    public let jsName = "SyncFile"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pick", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "read", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "write", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "unlink", returnType: CAPPluginReturnPromise)
    ]
    static let key = "vv-sync-bookmark"
    private var pending: CAPPluginCall?

    private func linkedURL() -> URL? {
        guard let data = UserDefaults.standard.data(forKey: SyncFilePlugin.key) else { return nil }
        var stale = false
        guard let url = try? URL(resolvingBookmarkData: data, options: [], relativeTo: nil, bookmarkDataIsStale: &stale) else { return nil }
        if stale {
            let ok = url.startAccessingSecurityScopedResource()
            if let fresh = try? url.bookmarkData() { UserDefaults.standard.set(fresh, forKey: SyncFilePlugin.key) }
            if ok { url.stopAccessingSecurityScopedResource() }
        }
        return url
    }

    @objc func status(_ call: CAPPluginCall) {
        if let u = linkedURL() {
            call.resolve(["linked": true, "name": u.lastPathComponent, "folder": u.deletingLastPathComponent().lastPathComponent])
        } else {
            call.resolve(["linked": false])
        }
    }

    /// create: true saves a new file (with `data`) where the listener chooses, e.g. iCloud Drive → Вайбкет.
    /// create: false opens an existing one made on another device.
    @objc func pick(_ call: CAPPluginCall) {
        let create = call.getBool("create") ?? false
        let content = call.getString("data") ?? ""
        DispatchQueue.main.async {
            let picker: UIDocumentPickerViewController
            if create {
                let tmp = FileManager.default.temporaryDirectory.appendingPathComponent("stil.vvsync")
                do { try Data(content.utf8).write(to: tmp, options: .atomic) } catch { call.reject("Could not prepare the file"); return }
                picker = UIDocumentPickerViewController(forExporting: [tmp], asCopy: false)
            } else {
                picker = UIDocumentPickerViewController(forOpeningContentTypes: [UTType.item], asCopy: false)
            }
            picker.delegate = self
            self.pending = call
            self.bridge?.viewController?.present(picker, animated: true)
        }
    }

    public func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        guard let call = pending, let url = urls.first else { return }
        pending = nil
        let ok = url.startAccessingSecurityScopedResource()
        defer { if ok { url.stopAccessingSecurityScopedResource() } }
        do {
            let bm = try url.bookmarkData(options: [], includingResourceValuesForKeys: nil, relativeTo: nil)
            UserDefaults.standard.set(bm, forKey: SyncFilePlugin.key)
            call.resolve(["linked": true, "name": url.lastPathComponent, "folder": url.deletingLastPathComponent().lastPathComponent])
        } catch {
            call.reject("Could not remember the file: \(error.localizedDescription)")
        }
    }

    public func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        pending?.reject("cancelled")
        pending = nil
    }

    @objc func read(_ call: CAPPluginCall) {
        guard let url = linkedURL() else { call.reject("not linked"); return }
        DispatchQueue.global(qos: .userInitiated).async {
            let ok = url.startAccessingSecurityScopedResource()
            defer { if ok { url.stopAccessingSecurityScopedResource() } }
            try? FileManager.default.startDownloadingUbiquitousItem(at: url)
            var err: NSError?
            var text: String?
            NSFileCoordinator(filePresenter: nil).coordinate(readingItemAt: url, options: [], error: &err) { u in
                text = try? String(contentsOf: u, encoding: .utf8)
            }
            if let t = text { call.resolve(["data": t]) } else { call.reject(err?.localizedDescription ?? "The file could not be read") }
        }
    }

    @objc func write(_ call: CAPPluginCall) {
        guard let url = linkedURL() else { call.reject("not linked"); return }
        let data = Data((call.getString("data") ?? "").utf8)
        DispatchQueue.global(qos: .userInitiated).async {
            let ok = url.startAccessingSecurityScopedResource()
            defer { if ok { url.stopAccessingSecurityScopedResource() } }
            var err: NSError?
            var wErr: Error?
            NSFileCoordinator(filePresenter: nil).coordinate(writingItemAt: url, options: .forReplacing, error: &err) { u in
                do { try data.write(to: u, options: .atomic) } catch { wErr = error }
            }
            if let e = err { call.reject(e.localizedDescription) }
            else if let e = wErr { call.reject(e.localizedDescription) }
            else { call.resolve() }
        }
    }

    @objc func unlink(_ call: CAPPluginCall) {
        UserDefaults.standard.removeObject(forKey: SyncFilePlugin.key)
        call.resolve()
    }
}
