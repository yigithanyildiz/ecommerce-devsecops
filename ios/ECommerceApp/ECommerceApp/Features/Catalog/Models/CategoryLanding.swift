import Foundation

struct CategoryLanding: Identifiable, Hashable {
    let category: ProductCategory
    let products: [Product]
    let storefrontConfig: StorefrontConfig

    var id: String {
        category.slug
    }

    static func == (lhs: CategoryLanding, rhs: CategoryLanding) -> Bool {
        lhs.id == rhs.id
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}
