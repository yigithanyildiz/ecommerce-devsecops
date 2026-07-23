import SwiftUI
struct CartView: View {
    @StateObject private var viewModel: CartViewModel
    @StateObject private var ordersViewModel: OrdersViewModel
    @State private var showCheckoutSuccess = false
    private let onCheckoutSuccess: () -> Void
    private let onBrowseProducts: () -> Void
    init(
        sessionManager: SessionManager,
        onCheckoutSuccess: @escaping () -> Void = {},
        onBrowseProducts: @escaping () -> Void = {}

    ) {
        self.onCheckoutSuccess = onCheckoutSuccess
        self.onBrowseProducts = onBrowseProducts

        _viewModel = StateObject(
            wrappedValue: CartViewModel(sessionManager: sessionManager)
        )
        _ordersViewModel = StateObject(
            wrappedValue: OrdersViewModel(sessionManager: sessionManager)
        )
    }

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && viewModel.items.isEmpty {
                    ProgressView("Sepet yükleniyor...")
                } else if viewModel.items.isEmpty {
                    ContentUnavailableView {
                        Label("Sepet boş", systemImage: "cart")
                    } description: {
                        Text(viewModel.errorMessage ?? "Ürün detayından sepete ürün ekleyebilirsin.")
                    } actions: {
                        Button("Ürünlere Git") {
                            onBrowseProducts()
                        }
                        .buttonStyle(.borderedProminent)
                    }
                } else {
                    ScrollView {
                        if let errorMessage = viewModel.errorMessage ?? ordersViewModel.errorMessage {
                            Text(errorMessage)
                                .font(.footnote)
                                .foregroundStyle(.red)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(.horizontal, LuxeTheme.horizontalPadding)
                                .padding(.top, 12)
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            Text("Your Cart")
                                .font(.system(size: 32, weight: .bold))
                                .foregroundStyle(LuxeTheme.charcoal)
                            Text("\(viewModel.items.count) ürün ödeme için hazır.")
                                .font(.subheadline)
                                .foregroundStyle(LuxeTheme.secondaryText)
                        }
                        .padding(.horizontal, LuxeTheme.horizontalPadding)
                        .padding(.top, 18)

                        VStack(spacing: 14) {
                            ForEach(viewModel.items) { item in
                                cartItemCard(item)
                            }
                        }
                        .padding(.horizontal, LuxeTheme.horizontalPadding)
                        .padding(.top, 12)

                        summaryCard
                            .padding(.horizontal, LuxeTheme.horizontalPadding)
                            .padding(.top, 20)
                            .padding(.bottom, 28)
                    }
                    .background(LuxeTheme.background)
                    
                    
                }
                
            }
            .alert("Sipariş oluşturuldu", isPresented: $showCheckoutSuccess) {
                Button("Tamam", role: .cancel) {}
            } message: {
                Text("Siparişini Siparişler sekmesinden takip edebilirsin.")
            }
            .navigationTitle("Sepet")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task {
                            await viewModel.loadCart()
                        }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                    
                }
                
            }
            
            .task {
                await viewModel.loadCart()
            }
            
        }
        
    }

    private func cartItemCard(_ item: CartItem) -> some View {
        HStack(spacing: 14) {
            AsyncImage(url: item.product.imageUrl.flatMap(URL.init(string:))) { image in
                image
                    .resizable()
                    .scaledToFill()
            } placeholder: {
                Image(systemName: "photo")
                    .foregroundStyle(.secondary)
            }
            .frame(width: 86, height: 108)
            .background(LuxeTheme.surfaceLow)
            .clipShape(RoundedRectangle(cornerRadius: LuxeTheme.controlRadius, style: .continuous))

            VStack(alignment: .leading, spacing: 8) {
                Text(item.product.name)
                    .font(.headline)
                    .foregroundStyle(LuxeTheme.charcoal)
                    .lineLimit(2)

                HStack {
                    Text(item.product.price.usdCurrencyText)
                        .font(.subheadline)
                        .foregroundStyle(LuxeTheme.secondaryText)

                    Spacer()

                    Text(lineTotal(for: item).usdCurrencyText)
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundStyle(LuxeTheme.charcoal)
                }

                HStack(spacing: 12) {
                    Button {
                        Task {
                            await viewModel.updateQuantity(
                                item: item,
                                quantity: item.quantity - 1
                            )
                        }
                    } label: {
                        Image(systemName: "minus")
                            .frame(width: 28, height: 28)
                            .background(LuxeTheme.surfaceLow)
                            .clipShape(Circle())
                    }
                    .disabled(viewModel.isLoading)

                    Text("\(item.quantity)")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .frame(minWidth: 24)

                    Button {
                        Task {
                            await viewModel.updateQuantity(
                                item: item,
                                quantity: item.quantity + 1
                            )
                        }
                    } label: {
                        Image(systemName: "plus")
                            .frame(width: 28, height: 28)
                            .background(LuxeTheme.surfaceLow)
                            .clipShape(Circle())
                    }
                    .disabled(viewModel.isLoading || item.quantity >= item.product.stock)

                    Spacer()

                    Button(role: .destructive) {
                        Task {
                            await viewModel.removeItem(item: item)
                        }
                    } label: {
                        Image(systemName: "trash")
                    }
                    .disabled(viewModel.isLoading)
                }
                .buttonStyle(.plain)

                if item.quantity >= item.product.stock {
                    Text("Stok sınırına ulaşıldı")
                        .font(.caption)
                        .foregroundStyle(LuxeTheme.secondaryText)
                }
            }
        }
        .padding(14)
        .luxeCard()
    }

    private var summaryCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Ödeme Özeti")
                .font(.headline)
                .foregroundStyle(LuxeTheme.charcoal)

            summaryRow("Ara Toplam", viewModel.totalPrice.usdCurrencyText)
            summaryRow("Kargo", viewModel.shippingPrice.usdCurrencyText)

            Divider()

            HStack {
                Text("Genel Toplam")
                    .font(.headline)
                    .foregroundStyle(LuxeTheme.charcoal)
                Spacer()
                Text(viewModel.grandTotal.usdCurrencyText)
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundStyle(LuxeTheme.charcoal)
            }

            NavigationLink {
                CheckoutView(
                    cartViewModel: viewModel,
                    ordersViewModel: ordersViewModel,
                    onCheckoutSuccess: {
                        showCheckoutSuccess = true
                        onCheckoutSuccess()
                    }
                )
            } label: {
                Text("Ödemeye Geç")
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(LuxeTheme.charcoal)
                    .clipShape(Capsule())
            }
            .disabled(viewModel.items.isEmpty)
        }
        .padding(20)
        .luxeCard()
    }

    private func summaryRow(_ title: String, _ value: String) -> some View {
        HStack {
            Text(title)
                .foregroundStyle(LuxeTheme.secondaryText)
            Spacer()
            Text(value)
                .foregroundStyle(LuxeTheme.charcoal)
                .fontWeight(.medium)
        }
        .font(.subheadline)
    }
    private func lineTotal(for item: CartItem) -> Double {
        let price = item.product.price.currencyValue
        return price * Double(item.quantity)
    }
}
