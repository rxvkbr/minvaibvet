import Capacitor
import UIKit

/// Registers the app's own plugins with the Capacitor bridge.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(PurrPlugin())
        bridge?.registerPluginInstance(AppIconPlugin())
        bridge?.registerPluginInstance(SyncFilePlugin())
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }
}
