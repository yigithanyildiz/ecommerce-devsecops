import SwiftUI

struct OrdersView: View {
    @StateObject private var viewModel: OrdersViewModel
    private let refreshToken: Int
    private let onBrowseProducts: () -> Void

    init(
        sessionManager: SessionManager,
        refreshToken: Int = 0,
        onBrowseProducts: @escaping () -> Void = {}

    ) {
        self.refreshToken = refreshToken
        self.onBrowseProducts = onBrowseProducts

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
                    ContentUnavailableView {
                        Label("Sipariş yok", systemImage: "bag")
                    } description: {
                        Text("Tamamladığın siparişler burada görünecek.")
                    } actions: {
                        Button("Ürünlere Git") {
                            onBrowseProducts()
                        }
                        .buttonStyle(.borderedProminent)
                    }
                } else {
                    ScrollView {
                        if let errorMessage = viewModel.errorMessage {
                            Text(errorMessage)
                                .font(.footnote)
                                .foregroundStyle(LuxeTheme.danger)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(.horizontal, LuxeTheme.horizontalPadding)
                                .padding(.top, 12)
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            Text("Order Tracking")
                                .font(.system(size: 32, weight: .bold))
                                .foregroundStyle(LuxeTheme.charcoal)

                            Text("Siparişlerinin durumunu ve geçmiş alışverişlerini takip et.")
                                .font(.subheadline)
                                .foregroundStyle(LuxeTheme.secondaryText)
                        }
                        .padding(.horizontal, LuxeTheme.horizontalPadding)
                        .padding(.top, 18)

                        VStack(spacing: 14) {
                            ForEach(viewModel.orders) { order in
                                NavigationLink {
                                    OrderDetailView(order: order)
                                } label: {
                                    orderCard(order)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.horizontal, LuxeTheme.horizontalPadding)
                        .padding(.top, 14)
                        .padding(.bottom, 28)
                    }
                    .background(LuxeTheme.background)
                    .refreshable {
                        await viewModel.loadOrders()
                    }
                }
            }
            .navigationTitle("Siparişlerim")
            .navigationBarTitleDisplayMode(.inline)
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

    private func orderCard(_ order: Order) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Sipariş #\(order.id.prefix(8))")
                        .font(.headline)
                        .foregroundStyle(LuxeTheme.charcoal)

                    Text(order.formattedCreatedDate)
                        .font(.caption)
                        .foregroundStyle(LuxeTheme.secondaryText)
                }

                Spacer()

                OrderStatusBadgeView(status: order.status)
            }

            HStack(spacing: 12) {
                Image(systemName: "bag")
                    .font(.headline)
                    .foregroundStyle(LuxeTheme.charcoal)
                    .frame(width: 42, height: 42)
                    .background(LuxeTheme.surfaceLow)
                    .clipShape(Circle())

                VStack(alignment: .leading, spacing: 3) {
                    Text("\(order.items.count) ürün")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundStyle(LuxeTheme.charcoal)

                    Text("Detay ve sipariş sürecini görüntüle")
                        .font(.caption)
                        .foregroundStyle(LuxeTheme.secondaryText)
                }

                Spacer()

                Text(order.totalAmount.usdCurrencyText)
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundStyle(LuxeTheme.charcoal)
            }
        }
        .padding(18)
        .luxeCard()
    }
}
