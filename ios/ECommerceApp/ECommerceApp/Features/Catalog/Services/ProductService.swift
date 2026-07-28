import Foundation

protocol ProductServicing{
    func fetchProducts() async throws -> [Product]
    func fetchStorefrontConfig() async throws -> StorefrontConfig
}

final class ProductService: ProductServicing{
    private let apiClient: APIClient
    
    init(apiClient: APIClient = .shared){
        self.apiClient = apiClient
    }
    func fetchProducts() async throws -> [Product] {
        try await apiClient.get("/products")
    }

    func fetchStorefrontConfig() async throws -> StorefrontConfig {
        try await apiClient.get("/storefront")
    }
}
