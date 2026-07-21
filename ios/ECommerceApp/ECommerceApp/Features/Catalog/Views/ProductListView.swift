import SwiftUI

struct ProductListView: View {
    let refreshToken: Int
    @StateObject private var viewModel = ProductListViewModel()
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
                                : "Arama veya kategori filtresini değiştirmeyi dene."
                        )
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

                        categoryFilter

                        LazyVStack(spacing: 0) {
                            ForEach(viewModel.filteredProducts) { product in
                                NavigationLink {
                                    ProductDetailView(product: product)
                                } label: {
                                    ProductRowView(product: product)
                                        .padding(.horizontal)
                                        .padding(.vertical, 8)
                                }
                                .buttonStyle(.plain)

                                Divider()
                                    .padding(.leading, 108)
                            }
                        }
                    }
                    .refreshable {
                        await viewModel.loadProducts()
                    }
                }
            }
            .navigationTitle("Ürünler")
            .searchable(text: $viewModel.searchText, prompt: "Ürün ara")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task {
                            await viewModel.loadProducts()
                        }
                        
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                    .onChange(of: refreshToken) { _, _ in
                        Task {
                            await viewModel.loadProducts()
                        }
                    }
                }
            }
            .task {
                await viewModel.loadProducts()
            }
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
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
    }

    private func categoryButton(title: String, slug: String?) -> some View {
        Button {
            viewModel.selectedCategorySlug = slug
        } label: {
            Text(title)
                .font(.subheadline)
                .fontWeight(viewModel.selectedCategorySlug == slug ? .semibold : .regular)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(
                    viewModel.selectedCategorySlug == slug
                        ? Color.accentColor.opacity(0.15)
                        : Color(.secondarySystemBackground)
                )
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    ProductListView()
}
