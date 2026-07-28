import Foundation
import Combine

@MainActor
final class OrderDetailViewModel: ObservableObject {
    @Published private(set) var order: Order
    @Published private(set) var isCancelling = false
    @Published var errorMessage: String?

    private let orderService: OrderServicing
    private let sessionManager: SessionManager

    init(
        order: Order,
        orderService: OrderServicing = OrderService(),
        sessionManager: SessionManager
    ) {
        self.order = order
        self.orderService = orderService
        self.sessionManager = sessionManager
    }

    func cancelOrder() async -> Order? {
        guard let accessToken = sessionManager.accessToken else {
            errorMessage = "Siparişi iptal etmek için giriş yapmalısın."
            return nil
        }

        isCancelling = true
        errorMessage = nil

        do {
            let updatedOrder = try await orderService.cancelOrder(
                id: order.id,
                accessToken: accessToken
            )
            order = updatedOrder
            isCancelling = false
            return updatedOrder
        } catch {
            handle(error)
            isCancelling = false
            return nil
        }
    }

    private func handle(_ error: Error) {
        if let apiError = error as? APIError, apiError.isUnauthorized {
            sessionManager.expireSession()
        }

        errorMessage = error.localizedDescription
    }
}
