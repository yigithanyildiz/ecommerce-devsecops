
import Foundation
import Combine

@MainActor
final class FavoritesViewModel: ObservableObject {
    @Published private(set) var products: [Product] = []
    @Published private(set) var isLoading = false
    @Published var errorMessage: String?

    private let favoriteService: FavoriteServicing
    private let sessionManager: SessionManager

    init(
        favoriteService: FavoriteServicing = FavoriteService(),
        sessionManager: SessionManager
    ) {
        self.favoriteService = favoriteService
        self.sessionManager = sessionManager
    }

    var favoriteProductIds: Set<String> {
        Set(products.map(\.id))
    }

    func loadFavorites() async {
        guard let accessToken = sessionManager.accessToken else {
            products = []
            errorMessage = "Favorileri görüntülemek için giriş yapmalısın."
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            products = try await favoriteService.fetchFavorites(accessToken: accessToken)
        } catch {
            handle(error)
        }

        isLoading = false
    }

    func toggleFavorite(product: Product) async {
        guard let accessToken = sessionManager.accessToken else {
            errorMessage = "Favorilere eklemek için giriş yapmalısın."
            return
        }

        errorMessage = nil

        do {
            if favoriteProductIds.contains(product.id) {
                try await favoriteService.removeFavorite(
                    productId: product.id,
                    accessToken: accessToken
                )
                products.removeAll { $0.id == product.id }
            } else {
                try await favoriteService.addFavorite(
                    productId: product.id,
                    accessToken: accessToken
                )
                products.insert(product, at: 0)
            }
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
}
