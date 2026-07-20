import Foundation

struct AddCartItemRequest: Encodable {
    let productId: String
    let quantity: Int
}

struct UpdateCartItemRequest: Encodable {
    let quantity: Int
}

struct RemoveCartItemResponse: Decodable {
    let message: String
}
