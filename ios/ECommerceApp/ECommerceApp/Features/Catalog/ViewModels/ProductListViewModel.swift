import Foundation
import Combine

@MainActor
final class ProductListViewModel: ObservableObject{
    @Published private(set) var products: [Product] = []
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?
    @Published var searchText = ""
    @Published var selectedCategorySlug: String?
    private let productService: ProductServicing
    init(productService: ProductServicing = ProductService()){
        self.productService = productService
        
    }
    var categories: [ProductCategory] {
        let categories = products.compactMap { $0.category }
        var seenSlugs = Set<String>()

        return categories.filter { category in
            if seenSlugs.contains(category.slug) {
                return false
            }

            seenSlugs.insert(category.slug)
            return true
        }
    }
    var filteredProducts: [Product] {
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines)

        return products.filter { product in
            let matchesSearch = query.isEmpty
                || product.name.localizedCaseInsensitiveContains(query)
                || product.description?.localizedCaseInsensitiveContains(query) == true
                || product.category?.name.localizedCaseInsensitiveContains(query) == true

            let matchesCategory = selectedCategorySlug == nil
                || product.category?.slug == selectedCategorySlug

            return matchesSearch && matchesCategory
        }
    }
    func loadProducts() async {
        isLoading = true
        errorMessage = nil

        do {
            products  = try await productService.fetchProducts()
            
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}
