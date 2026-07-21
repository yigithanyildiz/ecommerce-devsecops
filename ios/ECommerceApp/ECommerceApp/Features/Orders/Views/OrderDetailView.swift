import SwiftUI

struct OrderDetailView: View {
    let order: Order

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Sipariş")
                        .font(.headline)

                    Text("#\(order.id.prefix(8))")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                HStack {
                    Text("Tarih")

                    Spacer()

                    Text(order.formattedCreatedDate)
                        .foregroundStyle(.secondary)
                }

                HStack {
                    Text("Durum")

                    Spacer()

                    OrderStatusBadgeView(status: order.status)
                }

                HStack {
                    Text("Toplam")

                    Spacer()

                    Text(order.totalAmount.usdCurrencyText)
                        .fontWeight(.bold)
                }
            }

            Section("Ürünler") {
                ForEach(order.items) { item in
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(item.productName)
                                .font(.headline)

                            Text("\(item.quantity) x \(item.unitPrice.usdCurrencyText)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }

                        Spacer()

                        Text(item.lineTotal.usdCurrencyText)
                            .fontWeight(.semibold)
                    }
                    .padding(.vertical, 4)
                }
            }
        }
        .navigationTitle("Sipariş Detayı")
        .navigationBarTitleDisplayMode(.inline)
    }
}
