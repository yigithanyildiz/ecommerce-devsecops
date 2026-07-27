import Foundation

struct Product: Identifiable, Decodable, Hashable {
    let id: String
    let name: String
    let slug: String
    let description: String?
    let price: String
    let stock: Int
    let imageUrl: String?
    let category: ProductCategory?
    
}

struct ProductCategory: Decodable, Hashable {
    let id: String
    let name: String
    let slug: String
}
