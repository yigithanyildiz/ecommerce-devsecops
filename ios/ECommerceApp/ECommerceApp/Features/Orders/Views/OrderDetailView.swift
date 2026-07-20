import SwiftUI

struct OrderDetailView: View {
    let order: Order

    var body: some View {
        List {
            Section {
                HStack {
                    HStack {
                        Text("Tarih")
                        Spacer()
                        Text(order.formattedCreatedDate)
                            .foregroundStyle(.secondary)
                    }
                    Text("Durum")
                    Spacer()
                    OrderStatusBadgeView(status: order.status)
                }

                HStack {
                    Text("Toplam")
                    Spacer()
                    Text(order.totalAmount.usdCurrencyText)
                        .fontWeight(.semibold)
                }
            }

            Section("Ürünler") {
                ForEach(order.items) { item in
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(item.productName)
                                .font(.headline)

                            Text("Adet: \(item.quantity)")
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
