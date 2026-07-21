import SwiftUI

struct FavoritesView: View {
    @StateObject private var viewModel: FavoritesViewModel
    private let onBrowseProducts: () -> Void

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
                    List {
                        if let errorMessage = viewModel.errorMessage {
                            Section {
                                Text(errorMessage)
                                    .font(.footnote)
                                    .foregroundStyle(.red)
                            }
                        }

                        ForEach(viewModel.products) { product in
                            NavigationLink {
                                ProductDetailView(product: product)
                            } label: {
                                ProductRowView(product: product)
                            }
                            .swipeActions {
                                Button(role: .destructive) {
                                    Task {
                                        await viewModel.toggleFavorite(product: product)
                                    }
                                } label: {
                                    Label("Kaldır", systemImage: "heart.slash")
                                }
                            }
                        }
                    }
                    .refreshable {
                        await viewModel.loadFavorites()
                    }
                }
            }
            .navigationTitle("Favoriler")
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
