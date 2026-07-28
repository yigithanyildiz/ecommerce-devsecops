import SwiftUI

struct CategoryLandingView: View {
    let landing: CategoryLanding
    let relatedProducts: (Product) -> [Product]

    @State private var selectedProduct: Product?
    @State private var showsOnlyInStock = false
    @State private var sortOption: ProductSortOption = .newest

    private let gridColumns = [
        GridItem(.adaptive(minimum: 150, maximum: 220), spacing: 14)
    ]

    private var visibleProducts: [Product] {
        let filtered = landing.products.filter { product in
            !showsOnlyInStock || product.stock > 0
        }

        switch sortOption {
        case .newest:
            return filtered
        case .priceLowToHigh:
            return filtered.sorted {
                $0.price.currencyValue < $1.price.currencyValue
            }
        case .priceHighToLow:
            return filtered.sorted {
                $0.price.currencyValue > $1.price.currencyValue
            }
        case .stockHighToLow:
            return filtered.sorted {
                $0.stock > $1.stock
            }
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                header
                controls

                if visibleProducts.isEmpty {
                    ContentUnavailableView(
                        landing.products.isEmpty ? "Ürün yok" : "Eşleşen ürün yok",
                        systemImage: "shippingbox",
                        description: Text(
                            landing.products.isEmpty
                                ? "Bu kategori için henüz listelenecek ürün bulunamadı."
                                : "Stok filtresini değiştirmeyi dene."
                        )
                    )
                    .padding(.top, 40)
                } else {
                    LazyVGrid(columns: gridColumns, spacing: 18) {
                        ForEach(visibleProducts) { product in
                            ProductRowView(product: product)
                                .contentShape(
                                    RoundedRectangle(cornerRadius: LuxeTheme.cardRadius, style: .continuous)
                                )
                                .onTapGesture {
                                    selectedProduct = product
                                }
                                .frame(minHeight: 300, alignment: .top)
                        }
                    }
                }
            }
            .padding(.horizontal, LuxeTheme.horizontalPadding)
            .padding(.top, 18)
            .padding(.bottom, 34)
        }
        .background(LuxeTheme.background)
        .navigationTitle(landing.category.name)
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(item: $selectedProduct) { product in
            ProductDetailView(
                product: product,
                relatedProducts: relatedProducts(product)
            )
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(landing.storefrontConfig.heroEyebrow)
                .font(.caption)
                .fontWeight(.bold)
                .tracking(1.6)
                .foregroundStyle(LuxeTheme.secondaryText)

            VStack(alignment: .leading, spacing: 10) {
                Text(landing.category.name)
                    .font(.system(size: 34, weight: .bold))
                    .foregroundStyle(.white)

                Text(landing.storefrontConfig.heroSubtitle)
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.84))
                    .lineLimit(3)

                Text("\(visibleProducts.count) ürün")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(.white.opacity(0.18))
                    .clipShape(Capsule())
            }
            .frame(maxWidth: .infinity, minHeight: 210, alignment: .bottomLeading)
            .padding(22)
            .background {
                heroBackground(imageUrl: landing.storefrontConfig.heroImageUrl)
            }
            .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
            .shadow(color: LuxeTheme.charcoal.opacity(0.10), radius: 24, x: 0, y: 14)
        }
    }

    private var controls: some View {
        HStack(spacing: 12) {
            Toggle(isOn: $showsOnlyInStock) {
                Label("Stokta", systemImage: "checkmark.circle")
            }
            .toggleStyle(.button)

            Spacer()

            Picker("Sıralama", selection: $sortOption) {
                ForEach(ProductSortOption.allCases) { option in
                    Text(option.title).tag(option)
                }
            }
            .pickerStyle(.menu)
        }
        .font(.subheadline)
    }

    @ViewBuilder
    private func heroBackground(imageUrl: String?) -> some View {
        if let imageUrl,
           let url = URL(string: imageUrl) {
            ZStack {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .empty:
                        fallbackBackground
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
                    case .failure:
                        fallbackBackground
                    @unknown default:
                        fallbackBackground
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
            fallbackBackground
        }
    }

    private var fallbackBackground: some View {
        LinearGradient(
            colors: [LuxeTheme.charcoal.opacity(0.92), LuxeTheme.charcoal.opacity(0.68)],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

}
