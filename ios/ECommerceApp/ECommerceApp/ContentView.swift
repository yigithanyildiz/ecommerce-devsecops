import SwiftUI

enum AppTab {
    case catalog
    case favorites
    case cart
    case orders
    case profile
    case login
}

extension Notification.Name {
    static let cartDidChange = Notification.Name("cartDidChange")
    static let openCart = Notification.Name("openCart")
}

struct ContentView: View {
    @EnvironmentObject private var sessionManager: SessionManager
    @State private var selectedTab: AppTab = .catalog
    @State private var ordersRefreshToken = 0
    @State private var productsRefreshToken = 0
    @State private var cartBadgeCount = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            if sessionManager.isAuthenticated {
                ProductListView(refreshToken: productsRefreshToken)
                    .tabItem {
                        Label("Ürünler", systemImage: "shippingbox")
                    }
                    .tag(AppTab.catalog)
                FavoritesView(
                    sessionManager: sessionManager,
                    onBrowseProducts: {
                        selectedTab = .catalog
                    }
                )
                .tabItem {
                    Label("Favoriler", systemImage: "heart")
                }
                .tag(AppTab.favorites)
                CartView(
                    sessionManager: sessionManager,
                    onCheckoutSuccess: {
                        ordersRefreshToken += 1
                        productsRefreshToken += 1
                        selectedTab = .orders
                    },
                    onBrowseProducts: {
                        selectedTab = .catalog
                    }
                )
                .tabItem {
                    Label("Sepet", systemImage: "cart")
                }
                .tag(AppTab.cart)
                .badge(cartBadgeCount)

                OrdersView(
                    sessionManager: sessionManager,
                    refreshToken: ordersRefreshToken,
                    onBrowseProducts: {
                        selectedTab = .catalog
                    }
                )
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

                ProductListView(refreshToken: productsRefreshToken)
                    .tabItem {
                        Label("Ürünler", systemImage: "shippingbox")
                    }
                    .tag(AppTab.catalog)
            }
        }
        .tint(LuxeTheme.charcoal)
        .onAppear {
            selectedTab = sessionManager.isAuthenticated ? .catalog : .login

            Task {
                await refreshCartBadge()
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .cartDidChange)) { _ in
            Task {
                await refreshCartBadge()
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .openCart)) { _ in
            if sessionManager.isAuthenticated {
                selectedTab = .cart
            }
        }
        .onChange(of: sessionManager.isAuthenticated) { _, isAuthenticated in
            selectedTab = isAuthenticated ? .catalog : .login

            Task {
                await refreshCartBadge()
            }
        }
    }

    private func refreshCartBadge() async {
        guard sessionManager.isAuthenticated,
              let accessToken = sessionManager.accessToken else {
            cartBadgeCount = 0
            return
        }

        do {
            let cart = try await CartService().fetchCart(accessToken: accessToken)
            cartBadgeCount = cart.items.reduce(0) { total, item in
                total + item.quantity
            }
        } catch {
            cartBadgeCount = 0
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(SessionManager())
}
