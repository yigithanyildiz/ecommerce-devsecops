import SwiftUI

@main
struct ECommerceAppApp: App {
    @StateObject private var sessionManager = SessionManager()

    init() {
        GooglePlacesConfigurator.configure()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(sessionManager)
        }
    }
}
