import SwiftUI

struct ProductListView: View {
    let refreshToken: Int
    @StateObject private var viewModel = ProductListViewModel()
    @EnvironmentObject private var sessionManager: SessionManager
    @State private var addingProductId: String?
    @State private var errorMessage: String?
    @State private var toastMessage: String?
    @State private var showLoginAlert = false
    @State private var selectedProduct: Product?
    @State private var selectedCategoryLanding: CategoryLanding?
    private let cartService: CartServicing = CartService()
    private let gridColumns = [
        GridItem(.adaptive(minimum: 150, maximum: 220), spacing: 14)
    ]

    init(refreshToken: Int = 0) {
        self.refreshToken = refreshToken
    }

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                Group {
                    if viewModel.isLoading && viewModel.products.isEmpty {
                        ProgressView("Ürünler yükleniyor...")
                    } else if let errorMessage = viewModel.errorMessage, viewModel.products.isEmpty {
                        ContentUnavailableView(
                            "Ürünler yüklenemedi",
                            systemImage: "exclamationmark.triangle",
                            description: Text(errorMessage)
                        )
                    } else if viewModel.filteredProducts.isEmpty {
                        ContentUnavailableView(
                            viewModel.products.isEmpty ? "Ürün yok" : "Eşleşen ürün yok",
                            systemImage: "shippingbox",
                            description: Text(
                                viewModel.products.isEmpty
                                    ? "Henüz listelenecek ürün bulunamadı."
                                    : "Arama, kategori veya stok filtresini değiştirmeyi dene."
                            )
                        )
                    } else {
                        productGrid
                    }
                }

                if let toastMessage {
                    toastView(message: toastMessage)
                        .padding(.horizontal, LuxeTheme.horizontalPadding)
                        .padding(.bottom, 18)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
            .navigationTitle("LUXECART")
            .navigationBarTitleDisplayMode(.inline)
            .searchable(text: $viewModel.searchText, prompt: "Lüks ürün ara")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task {
                            await viewModel.loadProducts()
                        }
                        
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
            .alert("Giriş gerekli", isPresented: $showLoginAlert) {
                Button("Tamam", role: .cancel) {}
            } message: {
                Text("Sepete ürün eklemek için giriş yapmalısın.")
            }
            .alert("Sepete eklenemedi", isPresented: Binding(
                get: { errorMessage != nil },
                set: { if !$0 { errorMessage = nil } }
            )) {
                Button("Tamam", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "")
            }
            .onChange(of: refreshToken) { _, _ in
                Task {
                    await viewModel.loadProducts()
                }
            }
            .task {
                await viewModel.loadProducts()
            }
            .navigationDestination(item: $selectedProduct) { product in
                ProductDetailView(
                    product: product,
                    relatedProducts: relatedProducts(for: product)
                )
            }
            .navigationDestination(item: $selectedCategoryLanding) { landing in
                CategoryLandingView(
                    landing: landing,
                    relatedProducts: relatedProducts(for:)
                )
            }
        }
    }

    private var productGrid: some View {
        ScrollView {
            if let errorMessage = viewModel.errorMessage {
                Text(errorMessage)
                    .font(.footnote)
                    .foregroundStyle(.red)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal)
                    .padding(.top, 8)
            }

            heroSection
            categoryFilter
            filterControls

            LazyVGrid(columns: gridColumns, spacing: 18) {
                ForEach(viewModel.filteredProducts) { product in
                    ZStack(alignment: .topTrailing) {
                        ProductRowView(product: product)
                            .contentShape(
                                RoundedRectangle(cornerRadius: LuxeTheme.cardRadius, style: .continuous)
                            )
                            .onTapGesture {
                                selectedProduct = product
                            }
                            .frame(minHeight: 300, alignment: .top)

                        if sessionManager.isAuthenticated && product.stock > 0 {
                            quickAddButton(for: product)
                                .zIndex(2)
                        }
                    }
                    .frame(minHeight: 300, alignment: .top)
                    .contentShape(
                        RoundedRectangle(cornerRadius: LuxeTheme.cardRadius, style: .continuous)
                    )
                    .clipped()
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 28)
        }
        .background(LuxeTheme.background)
        .refreshable {
            await viewModel.loadProducts()
        }
    }

    private func quickAddButton(for product: Product) -> some View {
        Button {
            Task {
                await addToCart(product)
            }
        } label: {
            if addingProductId == product.id {
                ProgressView()
                    .frame(width: 34, height: 34)
            } else {
                Image(systemName: "cart.badge.plus")
                    .font(.subheadline)
                    .foregroundStyle(.white)
                    .frame(width: 34, height: 34)
                    .background(LuxeTheme.charcoal)
                    .clipShape(Circle())
            }
        }
        .buttonStyle(.plain)
        .contentShape(Circle())
        .disabled(addingProductId != nil)
        .padding(10)
    }

    private func relatedProducts(for product: Product) -> [Product] {
        viewModel.products.filter {
            $0.category?.slug == product.category?.slug
        }
    }

    @ViewBuilder
    private var heroSection: some View {
        let config = viewModel.storefrontConfig

        VStack(alignment: .leading, spacing: 14) {
            Text(config.heroEyebrow)
                .font(.caption)
                .fontWeight(.bold)
                .tracking(1.6)
                .foregroundStyle(LuxeTheme.secondaryText)

            Button {
                openHeroTarget(config)
            } label: {
                VStack(alignment: .leading, spacing: 12) {
                    Text(config.heroTitle)
                        .font(.system(size: 32, weight: .bold, design: .default))
                        .foregroundStyle(.white)
                        .lineLimit(2)

                    Text(config.heroSubtitle)
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.84))
                        .lineLimit(2)

                    if let targetTitle = heroTargetTitle(for: config) {
                        Label(targetTitle, systemImage: "arrow.right")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundStyle(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(.white.opacity(0.18))
                            .clipShape(Capsule())
                    }
                }
                .frame(maxWidth: .infinity, minHeight: 220, alignment: .bottomLeading)
                .padding(22)
                .background {
                    heroBackground(imageUrl: config.heroImageUrl)
                }
                .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
                .shadow(color: LuxeTheme.charcoal.opacity(0.10), radius: 24, x: 0, y: 14)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, LuxeTheme.horizontalPadding)
        .padding(.top, 14)
        .padding(.bottom, 18)
    }

    private func openHeroTarget(_ config: StorefrontConfig) {
        guard let slug = config.heroTargetCategorySlug,
              let category = viewModel.categories.first(where: { $0.slug == slug }) else {
            return
        }

        selectedCategoryLanding = CategoryLanding(
            category: category,
            products: viewModel.products.filter { $0.category?.slug == slug },
            storefrontConfig: config
        )
    }

    private func heroTargetTitle(for config: StorefrontConfig) -> String? {
        guard let slug = config.heroTargetCategorySlug,
              let category = viewModel.categories.first(where: { $0.slug == slug }) else {
            return nil
        }

        return "\(category.name) koleksiyonunu gör"
    }

    @ViewBuilder
    private func heroBackground(imageUrl: String?) -> some View {
        if let imageUrl,
           let url = URL(string: imageUrl) {
            ZStack {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .empty:
                        LinearGradient(
                            colors: [LuxeTheme.charcoal.opacity(0.92), LuxeTheme.charcoal.opacity(0.68)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
                    case .failure:
                        LinearGradient(
                            colors: [LuxeTheme.charcoal.opacity(0.92), LuxeTheme.charcoal.opacity(0.68)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    @unknown default:
                        LinearGradient(
                            colors: [LuxeTheme.charcoal.opacity(0.92), LuxeTheme.charcoal.opacity(0.68)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    }
                }

                LinearGradient(
                    colors: [
                        LuxeTheme.charcoal.opacity(0.72),
                        LuxeTheme.charcoal.opacity(0.18),
                        LuxeTheme.charcoal.opacity(0.82)
                    ],
                    startPoint: .topTrailing,
                    endPoint: .bottomLeading
                )
            }
        } else {
            LinearGradient(
                colors: [LuxeTheme.charcoal.opacity(0.92), LuxeTheme.charcoal.opacity(0.68)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }

    private var categoryFilter: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                categoryButton(title: "Tümü", slug: nil)

                ForEach(viewModel.categories, id: \.slug) { category in
                    categoryButton(title: category.name, slug: category.slug)
                }
            }
            .padding(.horizontal, LuxeTheme.horizontalPadding)
            .padding(.vertical, 8)
        }
    }
    private var filterControls: some View {
        HStack(spacing: 12) {
            Toggle(isOn: $viewModel.showsOnlyInStock) {
                Label("Stokta", systemImage: "checkmark.circle")
            }
            .toggleStyle(.button)

            Spacer()

            Picker("Sıralama", selection: $viewModel.sortOption) {
                ForEach(ProductSortOption.allCases) { option in
                    Text(option.title).tag(option)
                }
            }
            .pickerStyle(.menu)
        }
        .font(.subheadline)
        .padding(.horizontal, LuxeTheme.horizontalPadding)
        .padding(.bottom, 14)
    }
    private func addToCart(_ product: Product) async {
        guard product.stock > 0 else {
            errorMessage = "Bu ürün şu anda stokta yok."
            return
        }

        guard let accessToken = sessionManager.accessToken else {
            showLoginAlert = true
            return
        }

        addingProductId = product.id
        errorMessage = nil

        do {
            _ = try await cartService.addItem(
                productId: product.id,
                quantity: 1,
                accessToken: accessToken
            )

            NotificationCenter.default.post(name: .cartDidChange, object: nil)
            showToast("\(product.name) sepete eklendi")
        } catch {
            if let apiError = error as? APIError, apiError.isUnauthorized {
                sessionManager.signOut()
            }

            errorMessage = error.localizedDescription
        }

        addingProductId = nil
    }

    private func showToast(_ message: String) {
        withAnimation(.spring(response: 0.28, dampingFraction: 0.9)) {
            toastMessage = message
        }

        Task {
            try? await Task.sleep(nanoseconds: 1_700_000_000)

            await MainActor.run {
                withAnimation(.easeOut(duration: 0.22)) {
                    if toastMessage == message {
                        toastMessage = nil
                    }
                }
            }
        }
    }

    private func toastView(message: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundStyle(LuxeTheme.success)

            Text(message)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundStyle(LuxeTheme.charcoal)
                .lineLimit(2)

            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(.ultraThinMaterial)
        .overlay(
            RoundedRectangle(cornerRadius: LuxeTheme.controlRadius, style: .continuous)
                .stroke(LuxeTheme.success.opacity(0.18), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: LuxeTheme.controlRadius, style: .continuous))
        .shadow(color: LuxeTheme.charcoal.opacity(0.14), radius: 18, x: 0, y: 10)
    }

    private func categoryButton(title: String, slug: String?) -> some View {
        Button {
            viewModel.selectedCategorySlug = slug
        } label: {
            Text(title)
                .font(.subheadline)
                .fontWeight(viewModel.selectedCategorySlug == slug ? .semibold : .regular)
                .foregroundStyle(viewModel.selectedCategorySlug == slug ? .white : LuxeTheme.charcoal)
                .padding(.horizontal, 14)
                .padding(.vertical, 9)
                .background(
                    viewModel.selectedCategorySlug == slug
                        ? LuxeTheme.charcoal
                        : LuxeTheme.surfaceLow
                )
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    ProductListView()
}
