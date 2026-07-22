import SwiftUI

struct OrderDetailView: View {
    let order: Order

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                headerCard
                timelineCard
                itemsCard
                totalCard
            }
            .padding(.horizontal, LuxeTheme.horizontalPadding)
            .padding(.top, 18)
            .padding(.bottom, 34)
        }
        .background(LuxeTheme.background)
        .navigationTitle("Sipariş Detayı")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("ORDER")
                        .font(.caption)
                        .fontWeight(.bold)
                        .tracking(1.5)
                        .foregroundStyle(LuxeTheme.secondaryText)

                    Text("#\(order.id.prefix(8))")
                        .font(.system(size: 30, weight: .bold))
                        .foregroundStyle(LuxeTheme.charcoal)
                }

                Spacer()

                OrderStatusBadgeView(status: order.status)
            }

            Divider()

            detailRow("Tarih", order.formattedCreatedDate)
            detailRow("Ürün", "\(order.items.count) adet")
            detailRow("Toplam", order.totalAmount.usdCurrencyText, isStrong: true)
        }
        .padding(20)
        .luxeCard()
    }

    private var timelineCard: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("Sipariş Süreci")
                .font(.headline)
                .foregroundStyle(LuxeTheme.charcoal)

            VStack(spacing: 0) {
                ForEach(Array(OrderLifecycleStep.allCases.enumerated()), id: \.element.id) { index, step in
                    timelineRow(step: step, isLast: index == OrderLifecycleStep.allCases.count - 1)
                }
            }
        }
        .padding(20)
        .luxeCard()
    }

    private var itemsCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Ürünler")
                .font(.headline)
                .foregroundStyle(LuxeTheme.charcoal)

            ForEach(order.items) { item in
                HStack(spacing: 12) {
                    orderItemImage(item)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(item.productName)
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundStyle(LuxeTheme.charcoal)
                            .lineLimit(2)

                        Text("\(item.quantity) x \(item.unitPrice.usdCurrencyText)")
                            .font(.caption)
                            .foregroundStyle(LuxeTheme.secondaryText)
                    }

                    Spacer()

                    Text(item.lineTotal.usdCurrencyText)
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundStyle(LuxeTheme.charcoal)
                }

                if item.id != order.items.last?.id {
                    Divider()
                        .padding(.leading, 58)
                }
            }
        }
        .padding(20)
        .luxeCard()
    }

    private func orderItemImage(_ item: OrderItem) -> some View {
        ZStack {
            LuxeTheme.surfaceLow

            if let imageUrl = item.product?.imageUrl,
               let url = URL(string: imageUrl) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .empty:
                        ProgressView()
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
                    case .failure:
                        Image(systemName: "photo")
                            .foregroundStyle(LuxeTheme.secondaryText)
                    @unknown default:
                        Image(systemName: "photo")
                            .foregroundStyle(LuxeTheme.secondaryText)
                    }
                }
            } else {
                Image(systemName: "photo")
                    .foregroundStyle(LuxeTheme.secondaryText)
            }
        }
        .frame(width: 58, height: 72)
        .clipped()
        .clipShape(RoundedRectangle(cornerRadius: LuxeTheme.controlRadius, style: .continuous))
    }

    private var totalCard: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Genel Toplam")
                    .font(.caption)
                    .fontWeight(.bold)
                    .tracking(1.2)
                    .foregroundStyle(LuxeTheme.secondaryText)

                Text(order.totalAmount.usdCurrencyText)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundStyle(LuxeTheme.charcoal)
            }

            Spacer()

            Image(systemName: "checkmark.shield")
                .font(.title2)
                .foregroundStyle(LuxeTheme.success)
        }
        .padding(20)
        .luxeCard()
    }

    private func detailRow(_ title: String, _ value: String, isStrong: Bool = false) -> some View {
        HStack {
            Text(title)
                .foregroundStyle(LuxeTheme.secondaryText)
            Spacer()
            Text(value)
                .fontWeight(isStrong ? .bold : .medium)
                .foregroundStyle(LuxeTheme.charcoal)
        }
        .font(.subheadline)
    }

    private func timelineRow(step: OrderLifecycleStep, isLast: Bool) -> some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(spacing: 0) {
                Image(systemName: step.isCompleted(for: order.status) ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundStyle(step.isCompleted(for: order.status) ? LuxeTheme.success : LuxeTheme.secondaryText)

                if !isLast {
                    Rectangle()
                        .fill(step.isCompleted(for: order.status) ? LuxeTheme.success.opacity(0.35) : LuxeTheme.surfaceHigh)
                        .frame(width: 1, height: 34)
                }
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(step.title)
                    .font(.subheadline)
                    .fontWeight(step.rawValue == order.status ? .bold : .semibold)
                    .foregroundStyle(LuxeTheme.charcoal)

                Text(step.rawValue == order.status ? "Güncel durum" : step.caption)
                    .font(.caption)
                    .foregroundStyle(LuxeTheme.secondaryText)
            }

            Spacer()
        }
        .padding(.vertical, 2)
    }
}

private enum OrderLifecycleStep: String, CaseIterable, Identifiable {
    case paid = "PAID"
    case preparing = "PREPARING"
    case shipped = "SHIPPED"
    case delivered = "DELIVERED"

    var id: String { rawValue }

    var title: String {
        switch self {
        case .paid:
            return "Ödeme alındı"
        case .preparing:
            return "Hazırlanıyor"
        case .shipped:
            return "Kargoya verildi"
        case .delivered:
            return "Teslim edildi"
        }
    }

    var caption: String {
        switch self {
        case .paid:
            return "Sipariş onaylandı"
        case .preparing:
            return "Ürünler hazırlanır"
        case .shipped:
            return "Teslimat yola çıkar"
        case .delivered:
            return "Alıcıya teslim edilir"
        }
    }

    func isCompleted(for status: String) -> Bool {
        let completedStatuses: [OrderLifecycleStep]

        switch status {
        case "PAID":
            completedStatuses = [.paid]
        case "PREPARING":
            completedStatuses = [.paid, .preparing]
        case "SHIPPED":
            completedStatuses = [.paid, .preparing, .shipped]
        case "DELIVERED":
            completedStatuses = [.paid, .preparing, .shipped, .delivered]
        case "CANCELLED":
            completedStatuses = []
        default:
            completedStatuses = []
        }

        return completedStatuses.contains(self)
    }
}
