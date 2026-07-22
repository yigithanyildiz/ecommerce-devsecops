import SwiftUI

struct ProductListView: View {
    let refreshToken: Int
    @StateObject private var viewModel = ProductListViewModel()
    private let gridColumns = [
        GridItem(.adaptive(minimum: 150, maximum: 220), spacing: 14)
    ]

    init(refreshToken: Int = 0) {
        self.refreshToken = refreshToken
    }

    var body: some View {
        NavigationStack {
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
                            : "Arama, kategori veya stok filtresini değiştirmeyi dene."                        )
                    )
                } else {
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
                                NavigationLink {
                                    ProductDetailView(product: product)
                                } label: {
                                    ProductRowView(product: product)
                                }
                                .buttonStyle(.plain)
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
            .onChange(of: refreshToken) { _, _ in
            Task {
                await viewModel.loadProducts()
                }
            }
            .task {
                await viewModel.loadProducts()
            }
        }
    }

    private var heroSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("NEW SEASON")
                .font(.caption)
                .fontWeight(.bold)
                .tracking(1.6)
                .foregroundStyle(LuxeTheme.secondaryText)

            VStack(alignment: .leading, spacing: 12) {
                Text("The Minimalist Collection")
                    .font(.system(size: 32, weight: .bold, design: .default))
                    .foregroundStyle(.white)
                    .lineLimit(2)

                Text("Sessiz lüks, seçili ürünler ve rafine alışveriş deneyimi.")
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.84))
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity, minHeight: 220, alignment: .bottomLeading)
            .padding(22)
            .background {
                LinearGradient(
                    colors: [LuxeTheme.charcoal.opacity(0.92), LuxeTheme.charcoal.opacity(0.68)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            }
            .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
            .shadow(color: LuxeTheme.charcoal.opacity(0.10), radius: 24, x: 0, y: 14)
        }
        .padding(.horizontal, LuxeTheme.horizontalPadding)
        .padding(.top, 14)
        .padding(.bottom, 18)
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
