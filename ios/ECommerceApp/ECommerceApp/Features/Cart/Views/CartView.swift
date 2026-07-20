import SwiftUI
struct CartView: View {
    @StateObject private var viewModel: CartViewModel
    @StateObject private var ordersViewModel: OrdersViewModel
    private let onCheckoutSuccess: () -> Void
    init(
        sessionManager: SessionManager,
        onCheckoutSuccess: @escaping () -> Void = {}
    ) {
        self.onCheckoutSuccess = onCheckoutSuccess

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
                    ContentUnavailableView(
                        "Sepet boş",
                        systemImage: "cart",
                        description: Text(viewModel.errorMessage ?? "Ürün detayından sepete ürün ekleyebilirsin.")
                    )
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
                        Section {
                            HStack {
                                Text("Toplam")
                                    .fontWeight(.semibold)

                                Spacer()

                                Text(viewModel.totalPrice.usdCurrencyText)
                                    .fontWeight(.bold)
                            }
                        }
                        Section {
                            Button {
                                Task {
                                    await ordersViewModel.checkout()
                                    await viewModel.loadCart()

                                    if ordersViewModel.lastCreatedOrder != nil {
                                        onCheckoutSuccess()
                                    }
                                }
                            } label: {
                                if ordersViewModel.isLoading {
                                    ProgressView()
                                        .frame(maxWidth: .infinity)
                                } else {
                                    Text("Siparişi Tamamla")
                                        .fontWeight(.semibold)
                                        .frame(maxWidth: .infinity)
                                }
                            }
                            .disabled(ordersViewModel.isLoading || viewModel.items.isEmpty)
                        }
                        
                    }
                    
                    
                }
                
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
