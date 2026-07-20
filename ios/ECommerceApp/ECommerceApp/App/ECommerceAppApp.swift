import SwiftUI

@main
struct ECommerceAppApp: App {
    @StateObject private var sessionManager = SessionManager()
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(sessionManager)
        }
    }
}
