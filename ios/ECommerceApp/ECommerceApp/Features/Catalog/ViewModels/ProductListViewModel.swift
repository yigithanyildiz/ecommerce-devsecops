import Foundation
import Combine

enum ProductSortOption: String, CaseIterable, Identifiable {
    case newest
    case priceLowToHigh
    case priceHighToLow
    case stockHighToLow

    var id: String { rawValue }

    var title: String {
        switch self {
        case .newest:
            return "Yeni"
        case .priceLowToHigh:
            return "Fiyat Artan"
        case .priceHighToLow:
            return "Fiyat Azalan"
        case .stockHighToLow:
            return "Stok"
        }
    }
}
@MainActor
final class ProductListViewModel: ObservableObject{
    @Published private(set) var products: [Product] = []
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?
    @Published var searchText = ""
    @Published var selectedCategorySlug: String?
    @Published var showsOnlyInStock = false
    @Published var sortOption: ProductSortOption = .newest
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

        let filtered = products.filter { product in
            let matchesSearch = query.isEmpty
                || product.name.localizedCaseInsensitiveContains(query)
                || product.description?.localizedCaseInsensitiveContains(query) == true
                || product.category?.name.localizedCaseInsensitiveContains(query) == true

            let matchesCategory = selectedCategorySlug == nil
                || product.category?.slug == selectedCategorySlug

            let matchesStock = !showsOnlyInStock || product.stock > 0

            return matchesSearch && matchesCategory && matchesStock
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
