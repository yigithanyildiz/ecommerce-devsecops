import Foundation

protocol OrderServicing {
    func checkout(request: CheckoutRequest, accessToken: String) async throws -> Order
    func fetchOrders(accessToken: String) async throws -> [Order]
    func fetchOrder(id: String, accessToken: String) async throws -> Order
}

final class OrderService: OrderServicing {
    private let apiClient: APIClient

    init(apiClient: APIClient = .shared) {
        self.apiClient = apiClient
    }

    func checkout(request: CheckoutRequest, accessToken: String) async throws -> Order {
        try await apiClient.authenticatedPost(
            "orders/checkout",
            body: request,
            accessToken: accessToken
        )
    }

    func fetchOrders(accessToken: String) async throws -> [Order] {
        try await apiClient.authenticatedGet(
            "orders",
            accessToken: accessToken
        )
    }

    func fetchOrder(id: String, accessToken: String) async throws -> Order {
        try await apiClient.authenticatedGet(
            "orders/\(id)",
            accessToken: accessToken
        )
    }
}

struct CheckoutRequest: Encodable {
    let recipientName: String
    let phone: String
    let shippingCity: String
    let shippingAddressLine: String
    let paymentMethod: String
}
