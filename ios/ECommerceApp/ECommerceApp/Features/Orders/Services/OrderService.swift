import Foundation

protocol OrderServicing {
    func checkout(accessToken: String) async throws -> Order
    func fetchOrders(accessToken: String) async throws -> [Order]
    func fetchOrder(id: String, accessToken: String) async throws -> Order
}

final class OrderService: OrderServicing {
    private let apiClient: APIClient

    init(apiClient: APIClient = .shared) {
        self.apiClient = apiClient
    }

    func checkout(accessToken: String) async throws -> Order {
        try await apiClient.authenticatedPost(
            "orders/checkout",
            body: EmptyRequest(),
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

private struct EmptyRequest: Encodable {}
