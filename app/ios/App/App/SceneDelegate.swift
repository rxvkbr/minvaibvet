import Capacitor
import UIKit

/// iOS 27 requires apps built with its SDK to use the scene lifecycle.
/// The window and MainViewController come from Main.storyboard (UISceneStoryboardFile in Info.plist);
/// this only forwards opened URLs to Capacitor, as AppDelegate did before.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        if let url = connectionOptions.urlContexts.first?.url {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: url, options: [:])
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

    /// Quick actions open Вайбвет Стіл: "ua.pp.minvaibvet.stil-shop" -> stil.html#shop.
    private func jump(_ type: String) {
        let allowed = ["shop", "note", "desk"]
        guard let where_ = type.components(separatedBy: "stil-").last, allowed.contains(where_) else { return }
        let js = "if(/stil\\.html$/.test(location.pathname)){location.hash='';location.hash='\(where_)';}else{location.href='stil.html#\(where_)';}"
        let bridge = window?.rootViewController as? CAPBridgeViewController
        bridge?.webView?.evaluateJavaScript(js, completionHandler: nil)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        if let url = URLContexts.first?.url {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: url, options: [:])
        }
    }
}
