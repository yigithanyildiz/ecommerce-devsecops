import Foundation

protocol FavoriteServicing {
    func fetchFavorites(accessToken: String) async throws -> [Product]
    func addFavorite(productId: String, accessToken: String) async throws
    func removeFavorite(productId: String, accessToken: String) async throws
}

final class FavoriteService: FavoriteServicing {
    private let apiClient: APIClient

    init(apiClient: APIClient = .shared) {
        self.apiClient = apiClient
    }

    func fetchFavorites(accessToken: String) async throws -> [Product] {
        try await apiClient.authenticatedGet(
            "favorites",
            accessToken: accessToken
        )
    }

    func addFavorite(productId: String, accessToken: String) async throws {
        let _: FavoriteResponse = try await apiClient.authenticatedPost(
            "favorites/\(productId)",
            body: EmptyFavoriteRequest(),
            accessToken: accessToken
        )
    }

    func removeFavorite(productId: String, accessToken: String) async throws {
        let _: RemoveFavoriteResponse = try await apiClient.authenticatedDelete(
            "favorites/\(productId)",
            accessToken: accessToken
        )
    }
}

private struct EmptyFavoriteRequest: Encodable {}

private struct FavoriteResponse: Decodable {
    let id: String
}

private struct RemoveFavoriteResponse: Decodable {
    let message: String
}
