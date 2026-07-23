import SwiftUI

struct FavoritesView: View {
    @StateObject private var viewModel: FavoritesViewModel
    private let onBrowseProducts: () -> Void
    private let gridColumns = [
        GridItem(.adaptive(minimum: 150, maximum: 220), spacing: 14)
    ]

    init(
        sessionManager: SessionManager,
        onBrowseProducts: @escaping () -> Void = {}
    ) {
        self.onBrowseProducts = onBrowseProducts

        _viewModel = StateObject(
            wrappedValue: FavoritesViewModel(sessionManager: sessionManager)
        )
    }

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && viewModel.products.isEmpty {
                    ProgressView("Favoriler yükleniyor...")
                } else if viewModel.products.isEmpty {
                    ContentUnavailableView {
                        Label("Favori ürün yok", systemImage: "heart")
                    } description: {
                        Text(viewModel.errorMessage ?? "Beğendiğin ürünleri favorilerine ekleyebilirsin.")
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
                                .foregroundStyle(.red)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(.horizontal, LuxeTheme.horizontalPadding)
                                .padding(.top, 12)
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            Text("Your Favorites")
                                .font(.system(size: 32, weight: .bold))
                                .foregroundStyle(LuxeTheme.charcoal)
                            Text("Beğendiğin ürünleri tek bir zarif alanda topladık.")
                                .font(.subheadline)
                                .foregroundStyle(LuxeTheme.secondaryText)
                        }
                        .padding(.horizontal, LuxeTheme.horizontalPadding)
                        .padding(.top, 18)
                        .padding(.bottom, 12)

                        LazyVGrid(columns: gridColumns, spacing: 18) {
                            ForEach(viewModel.products) { product in
                                NavigationLink {
                                    ProductDetailView(product: product)
                                } label: {
                                    ProductRowView(product: product)
                                }
                                .buttonStyle(.plain)
                                .contextMenu {
                                    Button(role: .destructive) {
                                        Task {
                                            await viewModel.toggleFavorite(product: product)
                                        }
                                    } label: {
                                        Label("Favorilerden kaldır", systemImage: "heart.slash")
                                    }
                                }
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.bottom, 28)
                    }
                    .background(LuxeTheme.background)
                    .refreshable {
                        await viewModel.loadFavorites()
                    }
                }
            }
            .navigationTitle("Favoriler")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task {
                            await viewModel.loadFavorites()
                        }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
            .task {
                await viewModel.loadFavorites()
            }
        }
    }
}
