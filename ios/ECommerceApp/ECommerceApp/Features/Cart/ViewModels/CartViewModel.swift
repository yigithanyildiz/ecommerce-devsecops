import Foundation
import Combine

@MainActor
final class CartViewModel: ObservableObject {
    @Published private(set) var cart: Cart?
    @Published private(set) var isLoading = false
    @Published var errorMessage: String?

    private let cartService: CartServicing
    private let sessionManager: SessionManager

    init(
        cartService: CartServicing = CartService(),
        sessionManager: SessionManager
    ) {
        self.cartService = cartService
        self.sessionManager = sessionManager
    }

    var items: [CartItem] {
        cart?.items ?? []
    }

    var totalPrice: Double {
        items.reduce(0) { total, item in
            let price = item.product.price.currencyValue
            return total + (price * Double(item.quantity))
        }
    }

    func clearItems() {
        guard let cart else { return }

        self.cart = Cart(
            id: cart.id,
            userId: cart.userId,
            items: []
        )
    }

    func loadCart() async {
        guard let accessToken = sessionManager.accessToken else {
            errorMessage = "Sepeti görüntülemek için giriş yapmalısın."
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            cart = try await cartService.fetchCart(accessToken: accessToken)
        } catch {
            handle(error)
        }

        isLoading = false
    }

    func addToCart(product: Product, quantity: Int = 1) async {
        guard let accessToken = sessionManager.accessToken else {
            errorMessage = "Sepete eklemek için giriş yapmalısın."
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            _ = try await cartService.addItem(
                productId: product.id,
                quantity: quantity,
                accessToken: accessToken
            )
            await loadCart()
        } catch {
            handle(error)
        }

        isLoading = false
    }

    func updateQuantity(item: CartItem, quantity: Int) async {
        guard let accessToken = sessionManager.accessToken else {
            errorMessage = "Sepeti güncellemek için giriş yapmalısın."
            return
        }

        if quantity <= 0 {
            await removeItem(item: item)
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            _ = try await cartService.updateItem(
                itemId: item.id,
                quantity: quantity,
                accessToken: accessToken
            )
            await loadCart()
        } catch {
            handle(error)
        }

        isLoading = false
    }

    func removeItem(item: CartItem) async {
        guard let accessToken = sessionManager.accessToken else {
            errorMessage = "Sepetten ürün silmek için giriş yapmalısın."
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            try await cartService.removeItem(
                itemId: item.id,
                accessToken: accessToken
            )
            await loadCart()
        } catch {
            handle(error)
        }

        isLoading = false
    }

    private func handle(_ error: Error) {
        if let apiError = error as? APIError, apiError.isUnauthorized {
            sessionManager.signOut()
        }

        errorMessage = error.localizedDescription
    }
}
