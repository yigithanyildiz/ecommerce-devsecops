import SwiftUI

struct OrdersView: View {
    @StateObject private var viewModel: OrdersViewModel
    private let refreshToken: Int

    init(
        sessionManager: SessionManager,
        refreshToken: Int = 0
    ) {
        self.refreshToken = refreshToken
        _viewModel = StateObject(
            wrappedValue: OrdersViewModel(sessionManager: sessionManager)
        )
    }

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && viewModel.orders.isEmpty {
                    ProgressView("Siparişler yükleniyor...")
                } else if let errorMessage = viewModel.errorMessage, viewModel.orders.isEmpty {
                    ContentUnavailableView(
                        "Siparişler yüklenemedi",
                        systemImage: "exclamationmark.triangle",
                        description: Text(errorMessage)
                    )
                } else if viewModel.orders.isEmpty {
                    ContentUnavailableView(
                        "Sipariş yok",
                        systemImage: "bag",
                        description: Text("Tamamladığın siparişler burada görünecek.")
                    )
                } else {
                    List(viewModel.orders) { order in
                        NavigationLink {
                            OrderDetailView(order: order)
                        } label: {
                            VStack(alignment: .leading, spacing: 6) {
                                HStack {
                                    Text("Sipariş")
                                        .font(.headline)

                                    Spacer()

                                    OrderStatusBadgeView(status: order.status)
                                }

                                Text(order.totalAmount.usdCurrencyText)
                                    .font(.subheadline)
                                    .fontWeight(.semibold)

                                Text("\(order.items.count) ürün • \(order.formattedCreatedDate)")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            .padding(.vertical, 4)
                        }
                    }
                    .refreshable {
                        await viewModel.loadOrders()
                    }
                }
            }
            .navigationTitle("Siparişlerim")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task {
                            await viewModel.loadOrders()
                        }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
            .task {
                await viewModel.loadOrders()
                
            }
            .onChange(of: refreshToken) { _, _ in
                Task {
                    await viewModel.loadOrders()
                }
            }
        }
    }
}
