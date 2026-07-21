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
                    List {
                        if let errorMessage = viewModel.errorMessage ?? ordersViewModel.errorMessage {
                            Section {
                                Text(errorMessage)
                                    .font(.footnote)
                                    .foregroundStyle(.red)
                            }
                        }
                        ForEach(viewModel.items) { item in
                            HStack(spacing: 12) {
                                AsyncImage(url: item.product.imageUrl.flatMap(URL.init(string:))) { image in
                                    image
                                        .resizable()
                                        .scaledToFill()
                                } placeholder: {
                                    Image(systemName: "photo")
                                        .foregroundStyle(.secondary)
                                }
                                .frame(width: 56, height: 56)
                                .background(Color(.secondarySystemBackground))
                                .clipShape(RoundedRectangle(cornerRadius: 10))

                                VStack(alignment: .leading, spacing: 6) {
                                    Text(item.product.name)
                                        .font(.headline)

                                    Text(item.product.price.usdCurrencyText)
                                        .font(.subheadline)
                                        .foregroundStyle(.secondary)

                                    HStack(spacing: 12) {
                                        Button {
                                            Task {
                                                await viewModel.updateQuantity(
                                                    item: item,
                                                    quantity: item.quantity - 1
                                                )
                                            }
                                        } label: {
                                            Image(systemName: "minus.circle")
                                        }
                                        .disabled(viewModel.isLoading)


                                        Text("\(item.quantity)")
                                            .font(.subheadline)
                                            .frame(minWidth: 24)

                                        Button {
                                            Task {
                                                await viewModel.updateQuantity(
                                                    item: item,
                                                    quantity: item.quantity + 1
                                                )
                                            }
                                        } label: {
                                            Image(systemName: "plus.circle")
                                        }
                                        .disabled(viewModel.isLoading || item.quantity >= item.product.stock)
                                    }
                                    .buttonStyle(.borderless)
                                    if item.quantity >= item.product.stock {
                                        Text("Stok sınırına ulaşıldı")
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                    }
                                }
                                

                                Spacer()

                                Text(lineTotal(for: item).usdCurrencyText)
                                    .fontWeight(.semibold)
                            }
                            .padding(.vertical, 4)
                            .swipeActions {
                                Button(role: .destructive) {
                                    guard !viewModel.isLoading else { return }

                                    Task {
                                        await viewModel.removeItem(item: item)
                                    }
                                } label: {
                                    Label("Sil", systemImage: "trash")
                                }
                                
                            }
                        }
                        Section("Ödeme Özeti") {
                            HStack {
                                Text("Ara Toplam")

                                Spacer()

                                Text(viewModel.totalPrice.usdCurrencyText)
                                    .foregroundStyle(.secondary)
                            }

                            HStack {
                                Text("Kargo")

                                Spacer()

                                Text(viewModel.shippingPrice.usdCurrencyText)
                                    .foregroundStyle(.secondary)
                            }

                            HStack {
                                Text("Genel Toplam")
                                    .fontWeight(.semibold)

                                Spacer()

                                Text(viewModel.grandTotal.usdCurrencyText)
                                    .fontWeight(.bold)
                            }
                        }
                        Section {
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
                                    .fontWeight(.semibold)
                                    .frame(maxWidth: .infinity)
                            }
                            .disabled(viewModel.items.isEmpty)
                        }
                        
                    }
                    
                    
                }
                
            }
            .alert("Sipariş oluşturuldu", isPresented: $showCheckoutSuccess) {
                Button("Tamam", role: .cancel) {}
            } message: {
                Text("Siparişini Siparişler sekmesinden takip edebilirsin.")
            }
            .navigationTitle("Sepet")
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
    private func lineTotal(for item: CartItem) -> Double {
        let price = item.product.price.currencyValue
        return price * Double(item.quantity)
    }
}
