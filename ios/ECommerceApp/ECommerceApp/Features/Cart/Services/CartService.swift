import Foundation

protocol CartServicing {
    func fetchCart(accessToken: String) async throws -> Cart
    func addItem(productId: String, quantity: Int, accessToken: String) async throws -> CartItem
    func updateItem(itemId: String, quantity: Int, accessToken: String) async throws -> CartItem
    func removeItem(itemId: String, accessToken: String) async throws
}

final class CartService: CartServicing {
    private let apiClient: APIClient

    init(apiClient: APIClient = .shared) {
        self.apiClient = apiClient
    }

    func fetchCart(accessToken: String) async throws -> Cart {
        try await apiClient.authenticatedGet("cart", accessToken: accessToken)
    }

    func addItem(productId: String, quantity: Int, accessToken: String) async throws -> CartItem {
        let request = AddCartItemRequest(productId: productId, quantity: quantity)
        return try await apiClient.authenticatedPost(
            "cart/items",
            body: request,
            accessToken: accessToken
        )
    }
    func updateItem(itemId: String, quantity: Int, accessToken: String) async throws -> CartItem {
        let request = UpdateCartItemRequest(quantity: quantity)

        return try await apiClient.authenticatedPatch(
            "cart/items/\(itemId)",
            body: request,
            accessToken: accessToken
        )
    }

    func removeItem(itemId: String, accessToken: String) async throws {
        let _: RemoveCartItemResponse = try await apiClient.authenticatedDelete(
            "cart/items/\(itemId)",
            accessToken: accessToken
        )
    }
}
