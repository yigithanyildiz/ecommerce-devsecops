import Foundation

enum PaymentMethod: String, CaseIterable, Identifiable {
    case demoCard
    case cashOnDelivery

    var id: String { rawValue }

    var title: String {
        switch self {
        case .demoCard:
            return "Demo Kart"
        case .cashOnDelivery:
            return "Kapıda Ödeme"
        }
    }

    var description: String {
        switch self {
        case .demoCard:
            return "Test amaçlı ödeme simülasyonu."
        case .cashOnDelivery:
            return "Teslimat sırasında ödeme."
        }
    }

    var apiValue: String {
        switch self {
        case .demoCard:
            return "DEMO_CARD"
        case .cashOnDelivery:
            return "CASH_ON_DELIVERY"
        }
    }
}
