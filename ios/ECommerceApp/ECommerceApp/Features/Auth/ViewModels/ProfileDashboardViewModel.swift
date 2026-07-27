import Foundation
import Combine

@MainActor
final class ProfileDashboardViewModel: ObservableObject {
    @Published private(set) var orderCount = 0
    @Published private(set) var favoriteCount = 0
    @Published private(set) var cartItemCount = 0
    @Published private(set) var lastOrder: Order?
    @Published private(set) var isLoading = false
    @Published var errorMessage: String?

    private let sessionManager: SessionManager
    private let orderService: OrderServicing
    private let favoriteService: FavoriteServicing
    private let cartService: CartServicing

    init(
        sessionManager: SessionManager,
        orderService: OrderServicing = OrderService(),
        favoriteService: FavoriteServicing = FavoriteService(),
        cartService: CartServicing = CartService()
    ) {
        self.sessionManager = sessionManager
        self.orderService = orderService
        self.favoriteService = favoriteService
        self.cartService = cartService
    }

    func loadDashboard() async {
        guard let accessToken = sessionManager.accessToken else {
            reset()
            return
        }

        isLoading = true
        errorMessage = nil

        await loadOrders(accessToken: accessToken)
        await loadFavorites(accessToken: accessToken)
        await loadCart(accessToken: accessToken)

        isLoading = false
    }

    private func loadOrders(accessToken: String) async {
        do {
            let loadedOrders = try await orderService.fetchOrders(accessToken: accessToken)
            orderCount = loadedOrders.count
            lastOrder = loadedOrders.first
        } catch {
            handle(error)
        }
    }

    private func loadFavorites(accessToken: String) async {
        do {
            favoriteCount = try await favoriteService.fetchFavorites(accessToken: accessToken).count
        } catch {
            handle(error)
        }
    }

    private func loadCart(accessToken: String) async {
        do {
            let loadedCart = try await cartService.fetchCart(accessToken: accessToken)
            cartItemCount = loadedCart.items.reduce(0) { total, item in
                total + item.quantity
            }
        } catch {
            handle(error)
        }
    }

    private func handle(_ error: Error) {
        if let apiError = error as? APIError, apiError.isUnauthorized {
            sessionManager.signOut()
        } else {
            errorMessage = error.localizedDescription
        }
    }

    private func reset() {
        orderCount = 0
        favoriteCount = 0
        cartItemCount = 0
        lastOrder = nil
        errorMessage = nil
    }
}
