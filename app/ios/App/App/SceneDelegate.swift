import AVFoundation
import Capacitor
import UIKit

/// iOS 27 requires apps built with its SDK to use the scene lifecycle.
/// The window and MainViewController come from Main.storyboard (UISceneStoryboardFile in Info.plist);
/// this only forwards opened URLs to Capacitor, as AppDelegate did before.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    /// The radio must keep sounding: put the audio session back to playback every time the app comes to the front,
    /// and after anything that interrupted it (a call, Siri, an alarm). Otherwise Web Audio stays mute after the first interruption.
    /// true while a page listens to the microphone (Цифрова дудка): then the session records and plays.
    static var recording = false
    static func audioOn() {
        let a = AVAudioSession.sharedInstance()
        if recording {
            try? a.setCategory(.playAndRecord, mode: .default, options: [.mixWithOthers, .defaultToSpeaker, .allowBluetoothA2DP])
        } else {
            try? a.setCategory(.playback, mode: .default, options: [.mixWithOthers])
        }
        try? a.setActive(true)
    }

    func sceneDidBecomeActive(_ scene: UIScene) { SceneDelegate.audioOn() }
    func sceneWillEnterForeground(_ scene: UIScene) { SceneDelegate.audioOn() }

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        NotificationCenter.default.addObserver(forName: AVAudioSession.interruptionNotification, object: nil, queue: .main) { n in
            let raw = n.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt
            if raw == AVAudioSession.InterruptionType.ended.rawValue { SceneDelegate.audioOn() }
        }
        NotificationCenter.default.addObserver(forName: AVAudioSession.mediaServicesWereResetNotification, object: nil, queue: .main) { _ in
            SceneDelegate.audioOn()
        }
        if let url = connectionOptions.urlContexts.first?.url {
            if url.scheme == "vaibvet" {
                // A widget started the app: wait for the page, then jump.
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.6) { self.open(url) }
            } else {
                _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: url, options: [:])
            }
        }
        // Long-press on the app icon started the app: wait for the page, then jump.
        if let item = connectionOptions.shortcutItem {
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.6) { self.jump(item.type) }
        }
    }

    /// Long-press on the app icon while the app is running in the background.
    func windowScene(_ windowScene: UIWindowScene, performActionFor shortcutItem: UIApplicationShortcutItem, completionHandler: @escaping (Bool) -> Void) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { self.jump(shortcutItem.type) }
        completionHandler(true)
    }

    /// Quick actions open Вайбкет Стіл: "ua.pp.minvaibvet.stil-shop" -> stil.html#shop.
    private func jump(_ type: String) {
        let allowed = ["shop", "note", "desk"]
        guard let where_ = type.components(separatedBy: "stil-").last, allowed.contains(where_) else { return }
        let js = "if(/stil\\.html$/.test(location.pathname)){location.hash='';location.hash='\(where_)';}else{location.href='stil.html#\(where_)';}"
        let bridge = window?.rootViewController as? CAPBridgeViewController
        bridge?.webView?.evaluateJavaScript(js, completionHandler: nil)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        if let url = URLContexts.first?.url {
            if url.scheme == "vaibvet" { DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { self.open(url) }; return }
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: url, options: [:])
        }
    }

    /// Widgets open "vaibvet://section/<name>": the same sections as the Android widgets.
    private func open(_ url: URL) {
        let allowed = ["dron", "hladyty", "prognoz", "gazeta", "kolonka"]
        guard url.host == "section", let section = url.pathComponents.last, allowed.contains(section) else { return }
        let js = "if(/stil\\.html$/.test(location.pathname)){location.href='index.html#\(section)';}else{location.hash='';location.hash='\(section)';}"
        let bridge = window?.rootViewController as? CAPBridgeViewController
        bridge?.webView?.evaluateJavaScript(js, completionHandler: nil)
    }
}
