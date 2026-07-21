import SwiftUI

struct ProductDetailView: View {
    let product: Product
    @EnvironmentObject private var sessionManager: SessionManager
    @State private var isAddingToCart = false
    @State private var isFavorite = false
    @State private var isUpdatingFavorite = false 
    @State private var errorMessage: String?
    @State private var showLoginAlert = false
    @State private var showAddedAlert = false
    @State private var quantity = 1
    private let cartService: CartServicing = CartService()
    private let favoriteService: FavoriteServicing = FavoriteService()
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                productImage

                VStack(alignment: .leading, spacing: 12) {
                    if let category = product.category {
                        Text(category.name)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }

                    Text(product.name)
                        .font(.largeTitle)
                        .fontWeight(.bold)

                    if let description = product.description {
                        Text(description)
                            .font(.body)
                            .foregroundStyle(.secondary)
                    }

                    HStack {
                        Text(product.price.usdCurrencyText)
                            .font(.title)
                            .fontWeight(.bold)

                        Spacer()

                        Text("Stok: \(product.stock)")
                            .font(.subheadline)
                            .foregroundStyle(product.stock > 0 ? .green : .red)
                    }
                    HStack {
                        Text("Adet")
                            .font(.headline)

                        Spacer()

                        if product.stock > 0 {
                            Stepper(
                                "\(quantity)",
                                value: $quantity,
                                in: 1...product.stock
                            )
                        } else {
                            Text("0")
                                .foregroundStyle(.secondary)
                        }
                    }
                    if product.stock > 0 && quantity >= product.stock {
                        Text("Maksimum stok adedine ulaştın.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Button {
                        Task {
                            await addToCart()
                        }
                    } label: {
                        HStack {
                            if isAddingToCart {
                                ProgressView()
                            } else {
                                Image(systemName: "cart.badge.plus")
                                Text(product.stock > 0 ? "Sepete Ekle (\(quantity))" : "Stokta Yok")
                                    .fontWeight(.semibold)
                            }
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .disabled(product.stock == 0 || isAddingToCart)
                }
                .padding(.horizontal)
            }
        }
        .alert("Giriş gerekli", isPresented: $showLoginAlert) {
            Button("Tamam", role: .cancel) {}
        } message: {
            Text("Sepete ürün eklemek için giriş yapmalısın.")
        }
        .alert("Ürün sepete eklendi", isPresented: $showAddedAlert) {
            Button("Tamam", role: .cancel) {}
        }
        .alert("Sepete eklenemedi", isPresented: Binding(
            get: { errorMessage != nil },
            set: { if !$0 { errorMessage = nil } }
        )) {
            Button("Tamam", role: .cancel) {}
        } message: {
            Text(errorMessage ?? "")
        }
        .navigationTitle(product.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    Task {
                        await toggleFavorite()
                    }
                } label: {
                    Image(systemName: isFavorite ? "heart.fill" : "heart")
                }
                .disabled(isUpdatingFavorite)
            }
        }
        .task {
            await loadFavoriteState()
        }
    }
    private func loadFavoriteState() async {
        guard let accessToken = sessionManager.accessToken else {
            isFavorite = false
            return
        }

        do {
            let favorites = try await favoriteService.fetchFavorites(accessToken: accessToken)
            isFavorite = favorites.contains { $0.id == product.id }
        } catch {
            isFavorite = false
        }
    }

    private func toggleFavorite() async {
        guard let accessToken = sessionManager.accessToken else {
            showLoginAlert = true
            return
        }

        isUpdatingFavorite = true
        defer { isUpdatingFavorite = false }

        do {
            if isFavorite {
                try await favoriteService.removeFavorite(
                    productId: product.id,
                    accessToken: accessToken
                )
                isFavorite = false
            } else {
                try await favoriteService.addFavorite(
                    productId: product.id,
                    accessToken: accessToken
                )
                isFavorite = true
            }
        } catch {
            handle(error)
        }
    }
    private func addToCart() async {
        guard let accessToken = sessionManager.accessToken else {
            showLoginAlert = true
            return
        }

        isAddingToCart = true
        defer { isAddingToCart = false }
        errorMessage = nil

        do {
            _ = try await cartService.addItem(
                productId: product.id,
                quantity: quantity,
                accessToken: accessToken
            )
            NotificationCenter.default.post(
                name: .cartDidChange,
                object: nil,
                userInfo: ["itemCount": 0]
            )
            quantity = 1
            showAddedAlert = true
        } catch {
            handle(error)
        }
    }

    private func handle(_ error: Error) {
        if let apiError = error as? APIError, apiError.isUnauthorized {
            sessionManager.signOut()
        }

        errorMessage = error.localizedDescription
    }

    private var productImage: some View {
        AsyncImage(url: product.imageUrl.flatMap(URL.init(string:))) { phase in
            switch phase {
            case .empty:
                ProgressView()
                    .frame(maxWidth: .infinity, minHeight: 280)

            case .success(let image):
                image
                    .resizable()
                    .scaledToFill()
                    .frame(maxWidth: .infinity, minHeight: 280, maxHeight: 320)
                    .clipped()

            case .failure:
                Image(systemName: "photo")
                    .font(.largeTitle)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, minHeight: 280)
                    .background(Color(.secondarySystemBackground))

            @unknown default:
                EmptyView()
            }
        }
    }
}
