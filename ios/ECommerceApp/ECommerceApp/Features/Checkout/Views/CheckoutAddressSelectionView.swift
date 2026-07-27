import SwiftUI

struct CheckoutAddressSelectionView: View {
    @Environment(\.dismiss) private var dismiss

    let addresses: [DeliveryAddress]
    let selectedAddressId: String
    let onSelect: (DeliveryAddress) -> Void
    let onAddNew: () -> Void

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("DELIVERY")
                            .font(.caption)
                            .fontWeight(.bold)
                            .tracking(1.5)
                            .foregroundStyle(LuxeTheme.secondaryText)

                        Text("Teslimat Adresi")
                            .font(.system(size: 30, weight: .bold))
                            .foregroundStyle(LuxeTheme.charcoal)
                    }

                    VStack(spacing: 12) {
                        ForEach(addresses, id: \.id) { address in
                            Button {
                                onSelect(address)
                                dismiss()
                            } label: {
                                addressCard(address)
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    Button {
                        onAddNew()
                        dismiss()
                    } label: {
                        Label("Yeni Adres Ekle", systemImage: "plus")
                            .font(.headline)
                            .fontWeight(.semibold)
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(LuxeTheme.charcoal)
                            .clipShape(Capsule())
                    }
                }
                .padding(.horizontal, LuxeTheme.horizontalPadding)
                .padding(.top, 24)
                .padding(.bottom, 34)
            }
            .background(LuxeTheme.background)
            .navigationTitle("Adres Seç")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Kapat") {
                        dismiss()
                    }
                }
            }
        }
    }

    private func addressCard(_ address: DeliveryAddress) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: selectedAddressId == address.id ? "largecircle.fill.circle" : "circle")
                .foregroundStyle(selectedAddressId == address.id ? LuxeTheme.charcoal : LuxeTheme.secondaryText)
                .frame(width: 30, height: 30)

            VStack(alignment: .leading, spacing: 5) {
                HStack(spacing: 8) {
                    Text(address.title)
                        .font(.headline)
                        .foregroundStyle(LuxeTheme.charcoal)

                    if address.isDefault {
                        Text("Varsayılan")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundStyle(LuxeTheme.success)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(LuxeTheme.success.opacity(0.12))
                            .clipShape(Capsule())
                    }
                }

                Text(address.fullName)
                    .font(.subheadline)
                    .foregroundStyle(LuxeTheme.charcoal)

                Text("\(address.city) · \(address.addressLine)")
                    .font(.caption)
                    .foregroundStyle(LuxeTheme.secondaryText)
                    .lineLimit(2)
            }

            Spacer()
        }
        .padding(16)
        .luxeCard()
    }
}
