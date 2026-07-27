import Foundation

struct Order: Identifiable, Decodable {
    let id: String
    let userId: String
    let status: String
    let totalAmount: String
    let recipientName: String?
    let phone: String?
    let shippingCity: String?
    let shippingAddressLine: String?
    let paymentMethod: String?
    let trackingNumber: String?
    let items:[OrderItem]
    let createdAt: String
    let updatedAt: String
}
extension Order {
    var createdDate: Date? {
        ISO8601DateFormatter().date(from: createdAt)
    }

    var formattedCreatedDate: String {
        guard let createdDate else {
            return createdAt
        }

        return createdDate.formatted(
            date: .abbreviated,
            time: .shortened
        )
    }

    var paymentMethodLabel: String {
        switch paymentMethod {
        case "DEMO_CARD":
            return "Demo Kart"
        case "CASH_ON_DELIVERY":
            return "Kapıda Ödeme"
        default:
            return paymentMethod ?? "-"
        }
    }

    var statusLabel: String {
        switch status {
        case "PENDING":
            return "Bekliyor"
        case "PAID":
            return "Ödendi"
        case "PREPARING":
            return "Hazırlanıyor"
        case "SHIPPED":
            return "Kargoda"
        case "DELIVERED":
            return "Teslim Edildi"
        case "CANCELLED":
            return "İptal"
        default:
            return status
        }
    }
}

struct OrderItem: Identifiable, Decodable {
    let id: String
    let orderId: String
    let productName: String
    let unitPrice: String
    let quantity: Int
    let lineTotal: String
    let createdAt: String
    let product: OrderItemProduct?
}

struct OrderItemProduct: Decodable {
    let imageUrl: String?
}
