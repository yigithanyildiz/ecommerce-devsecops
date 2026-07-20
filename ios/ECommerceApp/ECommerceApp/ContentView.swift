import SwiftUI

enum AppTab {
    case catalog
    case cart
    case orders
    case profile
    case login
}

struct ContentView: View {
    @EnvironmentObject private var sessionManager: SessionManager
    @State private var selectedTab: AppTab = .catalog
    @State private var ordersRefreshToken = 0
    var body: some View {
        TabView(selection: $selectedTab) {
            ProductListView()
                .tabItem {
                    Label("Ürünler", systemImage: "shippingbox")
                }
                .tag(AppTab.catalog)

            if sessionManager.isAuthenticated {
                CartView(
                    sessionManager: sessionManager,
                    onCheckoutSuccess: {
                        ordersRefreshToken += 1
                        selectedTab = .orders
                    }
                )
                .tabItem {
                    Label("Sepet", systemImage: "cart")
                }
                .tag(AppTab.cart)

                OrdersView(sessionManager: sessionManager,refreshToken: ordersRefreshToken)
                    .tabItem {
                        Label("Siparişler", systemImage: "bag")
                    }
                    .tag(AppTab.orders)

                ProfileView()
                    .tabItem {
                        Label("Profil", systemImage: "person.crop.circle")
                    }
                    .tag(AppTab.profile)
            } else {
                LoginView(sessionManager: sessionManager)
                    .tabItem {
                        Label("Giriş", systemImage: "person")
                    }
                    .tag(AppTab.login)
            }
        }
        .onChange(of: sessionManager.isAuthenticated) { _, isAuthenticated in
            selectedTab = isAuthenticated ? .catalog : .login
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(SessionManager())
}
