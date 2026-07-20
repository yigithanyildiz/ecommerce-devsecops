import Foundation

struct Cart: Decodable {
    let id: String
    let userId: String
    let items: [CartItem]
}

struct CartItem: Identifiable, Decodable {
    let id: String
    let productId: String
    let quantity: Int
    let product: Product
}
