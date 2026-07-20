import Foundation
import Combine

@MainActor
final class OrdersViewModel: ObservableObject {
    @Published private(set) var orders: [Order] = []
    @Published private(set) var isLoading = false
    @Published var errorMessage: String?
    @Published private(set) var lastCreatedOrder: Order?

    private let orderService: OrderServicing
    private let sessionManager: SessionManager

    init(
        orderService: OrderServicing = OrderService(),
        sessionManager: SessionManager
    ) {
        self.orderService = orderService
        self.sessionManager = sessionManager
    }

    func loadOrders() async {
        guard let accessToken = sessionManager.accessToken else {
            errorMessage = "Siparişleri görüntülemek için giriş yapmalısın."
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            orders = try await orderService.fetchOrders(accessToken: accessToken)
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    func checkout() async {
        guard let accessToken = sessionManager.accessToken else {
            errorMessage = "Sipariş oluşturmak için giriş yapmalısın."
            return
        }

        isLoading = true
        errorMessage = nil
        lastCreatedOrder = nil

        do {
            lastCreatedOrder = try await orderService.checkout(accessToken: accessToken)
            await loadOrders()
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}
