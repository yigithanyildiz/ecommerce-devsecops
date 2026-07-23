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
        ZStack(alignment: .bottom) {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    productImage

                    VStack(alignment: .leading, spacing: 18) {
                        headerSection
                        quantitySection
                        descriptionSection
                        trustBadges
                    }
                    .padding(.horizontal, LuxeTheme.horizontalPadding)
                    .padding(.bottom, 112)
                }
            }
            .background(LuxeTheme.background)

            bottomActionBar
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
        .navigationTitle("LUXECART")
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
        let didAdd = await addSelectedProductToCart()

        if didAdd {
            quantity = 1
            showAddedAlert = true
        }
    }

    private func buyNow() async {
        let didAdd = await addSelectedProductToCart()

        if didAdd {
            quantity = 1
            NotificationCenter.default.post(name: .openCart, object: nil)
        }
    }

    private func addSelectedProductToCart() async -> Bool {
        guard let accessToken = sessionManager.accessToken else {
            showLoginAlert = true
            return false
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
            return true
        } catch {
            handle(error)
            return false
        }
    }

    private func handle(_ error: Error) {
        if let apiError = error as? APIError, apiError.isUnauthorized {
            sessionManager.signOut()
        }

        errorMessage = error.localizedDescription
    }

    private var productImage: some View {
        GeometryReader { proxy in
            ZStack {
                LuxeTheme.surfaceLow

                AsyncImage(url: product.imageUrl.flatMap(URL.init(string:))) { phase in
                    switch phase {
                    case .empty:
                        ProgressView()
                            .frame(width: proxy.size.width, height: proxy.size.width * 1.12)

                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
                            .frame(width: proxy.size.width, height: proxy.size.width * 1.12)
                            .clipped()

                    case .failure:
                        Image(systemName: "photo")
                            .font(.largeTitle)
                            .foregroundStyle(.secondary)
                            .frame(width: proxy.size.width, height: proxy.size.width * 1.12)

                    @unknown default:
                        EmptyView()
                    }
                }
            }
            .frame(width: proxy.size.width, height: proxy.size.width * 1.12)
            .clipped()
        }
        .frame(height: UIScreen.main.bounds.width * 1.12)
        .clipped()
    }

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            if let category = product.category {
                Text(category.name.uppercased())
                    .font(.caption)
                    .fontWeight(.semibold)
                    .tracking(1.5)
                    .foregroundStyle(LuxeTheme.secondaryText)
            }

            Text(product.name)
                .font(.system(size: 34, weight: .bold))
                .foregroundStyle(LuxeTheme.charcoal)
                .lineLimit(3)

            HStack(alignment: .center) {
                Text(product.price.usdCurrencyText)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundStyle(LuxeTheme.charcoal)

                Spacer()

                Text(product.stock > 0 ? "Stokta \(product.stock)" : "Stokta Yok")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 7)
                    .foregroundStyle(product.stock > 0 ? LuxeTheme.success : LuxeTheme.danger)
                    .background((product.stock > 0 ? LuxeTheme.success : LuxeTheme.danger).opacity(0.10))
                    .clipShape(Capsule())
            }
        }
    }

    private var quantitySection: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Adet")
                    .font(.headline)
                    .foregroundStyle(LuxeTheme.charcoal)
                Text(product.stock > 0 ? "Sepete eklenecek miktar" : "Bu ürün şu anda tükendi")
                    .font(.caption)
                    .foregroundStyle(LuxeTheme.secondaryText)
            }

            Spacer()

            if product.stock > 0 {
                Stepper("\(quantity)", value: $quantity, in: 1...product.stock)
                    .labelsHidden()
                Text("\(quantity)")
                    .font(.headline)
                    .frame(width: 34)
            } else {
                Text("0")
                    .foregroundStyle(LuxeTheme.secondaryText)
            }
        }
        .padding(18)
        .luxeCard()
    }

    private var descriptionSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Ürün Detayı")
                .font(.headline)
                .foregroundStyle(LuxeTheme.charcoal)

            Text(product.description ?? "Bu ürün için açıklama bulunmuyor.")
                .font(.body)
                .foregroundStyle(LuxeTheme.secondaryText)
                .lineSpacing(4)
        }
    }

    private var trustBadges: some View {
        HStack(spacing: 12) {
            trustBadge(icon: "shippingbox", title: "Hızlı Teslimat")
            trustBadge(icon: "checkmark.shield", title: "Güvenli Alışveriş")
        }
    }

    private func trustBadge(icon: String, title: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .foregroundStyle(LuxeTheme.charcoal)
            Text(title)
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundStyle(LuxeTheme.secondaryText)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(LuxeTheme.surfaceLow)
        .clipShape(RoundedRectangle(cornerRadius: LuxeTheme.controlRadius, style: .continuous))
    }

    private var bottomActionBar: some View {
        HStack(spacing: 12) {
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
                        Text(product.stock > 0 ? "Sepete Ekle" : "Stokta Yok")
                            .fontWeight(.semibold)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
            }
            .foregroundStyle(LuxeTheme.charcoal)
            .background(LuxeTheme.surface)
            .overlay(
                RoundedRectangle(cornerRadius: 999)
                    .stroke(LuxeTheme.charcoal, lineWidth: 1)
            )
            .clipShape(Capsule())
            .disabled(product.stock == 0 || isAddingToCart)

            if product.stock > 0 {
                Button {
                    Task {
                        await buyNow()
                    }
                } label: {
                    Text("Satın Al")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                }
                .foregroundStyle(.white)
                .background(LuxeTheme.charcoal)
                .clipShape(Capsule())
                .disabled(isAddingToCart)
            }
        }
        .padding(.horizontal, LuxeTheme.horizontalPadding)
        .padding(.top, 14)
        .padding(.bottom, 18)
        .background(.ultraThinMaterial)
    }
}
