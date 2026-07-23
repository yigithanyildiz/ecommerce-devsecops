import SwiftUI

struct CheckoutView: View {
    @Environment(\.dismiss) private var dismiss

    @ObservedObject var cartViewModel: CartViewModel
    @ObservedObject var ordersViewModel: OrdersViewModel

    let onCheckoutSuccess: () -> Void
    @State private var deliveryAddress = DeliveryAddress()
    @State private var paymentMethod: PaymentMethod = .demoCard
    @State private var errorMessage: String?
    @State private var isSubmitting = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                checkoutHeader
                addressCard
                paymentCard
                summaryCard

                if let errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(LuxeTheme.danger)
                        .padding(.horizontal, 4)
                }

                Button {
                    Task {
                        await submit()
                    }
                } label: {
                    if isSubmitting {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                    } else {
                        Text(paymentMethod == .demoCard ? "Ödemeyi Tamamla" : "Siparişi Onayla")
                            .font(.headline)
                            .fontWeight(.semibold)
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                    }
                }
                .background(canSubmit ? LuxeTheme.charcoal : LuxeTheme.surfaceHigh)
                .clipShape(Capsule())
                .disabled(!canSubmit)
            }
            .padding(.horizontal, LuxeTheme.horizontalPadding)
            .padding(.top, 18)
            .padding(.bottom, 34)
        }
        .background(LuxeTheme.background)
        .navigationTitle("Ödeme")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var checkoutHeader: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("SECURE CHECKOUT")
                .font(.caption)
                .fontWeight(.bold)
                .tracking(1.5)
                .foregroundStyle(LuxeTheme.secondaryText)

            Text("Ödemeyi Tamamla")
                .font(.system(size: 32, weight: .bold))
                .foregroundStyle(LuxeTheme.charcoal)

            Text("Teslimat bilgilerini kontrol et, ödeme yöntemini seç ve siparişini güvenle oluştur.")
                .font(.subheadline)
                .foregroundStyle(LuxeTheme.secondaryText)
                .lineSpacing(3)
        }
    }

    private var addressCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionTitle(icon: "location", title: "Teslimat Bilgileri")

            luxeTextField("Ad Soyad", text: $deliveryAddress.fullName)
                .textContentType(.name)

            luxeTextField("Telefon", text: $deliveryAddress.phone)
                .keyboardType(.phonePad)
                .textContentType(.telephoneNumber)

            luxeTextField("Şehir", text: $deliveryAddress.city)

            TextField("Adres", text: $deliveryAddress.addressLine, axis: .vertical)
                .lineLimit(3...5)
                .padding(14)
                .background(LuxeTheme.surfaceLow)
                .clipShape(RoundedRectangle(cornerRadius: LuxeTheme.controlRadius, style: .continuous))
        }
        .padding(18)
        .luxeCard()
    }

    private var paymentCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionTitle(icon: "creditcard", title: "Ödeme Yöntemi")

            ForEach(PaymentMethod.allCases) { method in
                Button {
                    paymentMethod = method
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: method == .demoCard ? "creditcard" : "shippingbox")
                            .foregroundStyle(LuxeTheme.charcoal)
                            .frame(width: 28, height: 28)

                        VStack(alignment: .leading, spacing: 3) {
                            Text(method.title)
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundStyle(LuxeTheme.charcoal)

                            Text(method.description)
                                .font(.caption)
                                .foregroundStyle(LuxeTheme.secondaryText)
                        }

                        Spacer()

                        Image(systemName: paymentMethod == method ? "largecircle.fill.circle" : "circle")
                            .foregroundStyle(paymentMethod == method ? LuxeTheme.charcoal : LuxeTheme.secondaryText)
                    }
                    .padding(14)
                    .background(paymentMethod == method ? LuxeTheme.surface : LuxeTheme.surfaceLow)
                    .overlay(
                        RoundedRectangle(cornerRadius: LuxeTheme.controlRadius)
                            .stroke(paymentMethod == method ? LuxeTheme.charcoal : .clear, lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: LuxeTheme.controlRadius, style: .continuous))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(18)
        .luxeCard()
    }

    private var summaryCard: some View {
        VStack(alignment: .leading, spacing: 15) {
            sectionTitle(icon: "doc.text", title: "Ödeme Özeti")
            summaryRow("Ara Toplam", cartViewModel.totalPrice.usdCurrencyText)
            summaryRow("Kargo", cartViewModel.shippingPrice.usdCurrencyText)
            Divider()
            HStack {
                Text("Genel Toplam")
                    .font(.headline)
                    .foregroundStyle(LuxeTheme.charcoal)
                Spacer()
                Text(cartViewModel.grandTotal.usdCurrencyText)
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundStyle(LuxeTheme.charcoal)
            }
        }
        .padding(18)
        .luxeCard()
    }

    private var canSubmit: Bool {
        deliveryAddress.isValid
            && !cartViewModel.items.isEmpty
            && !isSubmitting
    }

    private func sectionTitle(icon: String, title: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .foregroundStyle(LuxeTheme.charcoal)
            Text(title)
                .font(.headline)
                .foregroundStyle(LuxeTheme.charcoal)
        }
    }

    private func luxeTextField(_ placeholder: String, text: Binding<String>) -> some View {
        TextField(placeholder, text: text)
            .padding(14)
            .background(LuxeTheme.surfaceLow)
            .clipShape(RoundedRectangle(cornerRadius: LuxeTheme.controlRadius, style: .continuous))
    }

    private func summaryRow(_ title: String, _ value: String) -> some View {
        HStack {
            Text(title)
                .foregroundStyle(LuxeTheme.secondaryText)
            Spacer()
            Text(value)
                .fontWeight(.medium)
                .foregroundStyle(LuxeTheme.charcoal)
        }
        .font(.subheadline)
    }

    private func submit() async {
        guard canSubmit else {
            errorMessage = "Teslimat bilgilerini eksiksiz doldurmalısın."
            return
        }

        isSubmitting = true
        defer { isSubmitting = false }

        errorMessage = nil
        try? await Task.sleep(nanoseconds: 700_000_000)
        await ordersViewModel.checkout(
            request: CheckoutRequest(
                recipientName: deliveryAddress.fullName.trimmingCharacters(in: .whitespacesAndNewlines),
                phone: deliveryAddress.phone.trimmingCharacters(in: .whitespacesAndNewlines),
                shippingCity: deliveryAddress.city.trimmingCharacters(in: .whitespacesAndNewlines),
                shippingAddressLine: deliveryAddress.addressLine.trimmingCharacters(in: .whitespacesAndNewlines),
                paymentMethod: paymentMethod.apiValue
            )
        )

        if ordersViewModel.lastCreatedOrder != nil {
            cartViewModel.clearItems()
            await cartViewModel.loadCart()
            onCheckoutSuccess()
            dismiss()
        } else {
            errorMessage = ordersViewModel.errorMessage ?? "Sipariş oluşturulamadı."
        }
    }
}
