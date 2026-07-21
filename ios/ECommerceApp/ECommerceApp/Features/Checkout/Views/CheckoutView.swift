
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
        Form {
            Section("Teslimat Bilgileri") {
                TextField("Ad Soyad", text: $deliveryAddress.fullName)
                    .textContentType(.name)

                TextField("Telefon", text: $deliveryAddress.phone)
                    .keyboardType(.phonePad)
                    .textContentType(.telephoneNumber)

                TextField("Şehir", text: $deliveryAddress.city)

                TextField("Adres", text: $deliveryAddress.addressLine, axis: .vertical)
                    .lineLimit(3...5)
            }

            Section("Ödeme Yöntemi") {
                Picker("Ödeme", selection: $paymentMethod) {
                    ForEach(PaymentMethod.allCases) { method in
                        Text(method.title).tag(method)
                    }
                }
                Text(paymentMethod.description)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section("Ödeme Özeti") {
                LabeledContent("Ara Toplam", value: cartViewModel.totalPrice.usdCurrencyText)
                LabeledContent("Kargo", value: cartViewModel.shippingPrice.usdCurrencyText)
                LabeledContent("Genel Toplam", value: cartViewModel.grandTotal.usdCurrencyText)
                    .fontWeight(.semibold)
            }

            if let errorMessage {
                Section {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(.red)
                }
            }

            Section {
                Button {
                    Task {
                        await submit()
                    }
                } label: {
                    if isSubmitting {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                    } else {
                        Text(paymentMethod == .demoCard ? "Ödemeyi Tamamla" : "Siparişi Onayla")
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                    }
                }
                .disabled(!canSubmit)
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
            }
        }
        .navigationTitle("Ödeme")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var canSubmit: Bool {
        deliveryAddress.isValid
            && !cartViewModel.items.isEmpty
            && !isSubmitting
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
        await ordersViewModel.checkout()

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
