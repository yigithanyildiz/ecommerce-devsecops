import SwiftUI

struct OrderStatusBadgeView: View {
    let status: String

    var body: some View {
        Text(statusTitle)
            .font(.caption)
            .fontWeight(.semibold)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .foregroundStyle(statusColor)
            .background(statusColor.opacity(0.12))
            .clipShape(Capsule())
    }

    private var statusTitle: String {
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

    private var statusColor: Color {
        switch status {
        case "PENDING":
            return LuxeTheme.gold
        case "PAID":
            return LuxeTheme.success
        case "PREPARING":
            return LuxeTheme.charcoal
        case "SHIPPED":
            return LuxeTheme.secondaryText
        case "DELIVERED":
            return LuxeTheme.success
        case "CANCELLED":
            return LuxeTheme.danger
        default:
            return .secondary
        }
    }
}
