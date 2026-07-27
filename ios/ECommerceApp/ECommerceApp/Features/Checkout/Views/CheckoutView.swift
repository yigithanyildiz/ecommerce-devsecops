import SwiftUI

struct CheckoutView: View {
    @Environment(\.dismiss) private var dismiss

    @ObservedObject var cartViewModel: CartViewModel
    @ObservedObject var ordersViewModel: OrdersViewModel

    let userId: String?
    let accessToken: String?
    let onCheckoutSuccess: () -> Void

    private let addressService = AddressService()

    @State private var deliveryAddress = DeliveryAddress()
    @State private var savedAddresses: [DeliveryAddress] = []
    @State private var shouldSaveAddress = true
    @State private var didLoadSavedAddress = false
    @State private var showAddressSelection = false
    @State private var showAddressEditor = false
    @State private var editableAddress = DeliveryAddress()
    @State private var paymentMethod: PaymentMethod = .demoCard
    @State private var errorMessage: String?
    @State private var isSubmitting = false
    @State private var completedOrder: Order?

    var body: some View {
        Group {
            if let completedOrder {
                successView(order: completedOrder)
            } else {
                checkoutForm
            }
        }
        .background(LuxeTheme.background)
        .navigationTitle(completedOrder == nil ? "Ödeme" : "Sipariş Alındı")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showAddressSelection) {
            CheckoutAddressSelectionView(
                addresses: savedAddresses,
                selectedAddressId: deliveryAddress.id,
                onSelect: selectSavedAddress,
                onAddNew: openNewAddressEditor
            )
        }
        .sheet(isPresented: $showAddressEditor) {
            DeliveryAddressEditorView(
                address: $editableAddress,
                hasSavedAddress: false,
                onSave: saveAddressFromCheckout,
                onClear: {}
            )
        }
        .task {
            await loadSavedAddressIfNeeded()
        }
    }

    private var checkoutForm: some View {
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
    }

    private func successView(order: Order) -> some View {
        VStack(spacing: 22) {
            Spacer(minLength: 40)

            ZStack {
                Circle()
                    .fill(LuxeTheme.success.opacity(0.12))
                    .frame(width: 104, height: 104)

                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 58))
                    .foregroundStyle(LuxeTheme.success)
            }

            VStack(spacing: 8) {
                Text("Siparişin Alındı")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundStyle(LuxeTheme.charcoal)

                Text("Siparişini Siparişler sekmesinden takip edebilirsin.")
                    .font(.subheadline)
                    .foregroundStyle(LuxeTheme.secondaryText)
                    .multilineTextAlignment(.center)
            }

            VStack(spacing: 12) {
                detailRow("Sipariş No", "#\(order.id.prefix(8))")
                detailRow("Toplam", order.totalAmount.usdCurrencyText, isStrong: true)
                detailRow("Durum", order.statusLabel)
            }
            .padding(20)
            .luxeCard()

            Button {
                cartViewModel.clearItems()
                onCheckoutSuccess()
                dismiss()
            } label: {
                Text("Siparişlerime Git")
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(LuxeTheme.charcoal)
                    .clipShape(Capsule())
            }

            Button {
                dismiss()
            } label: {
                Text("Sepete Dön")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(LuxeTheme.charcoal)
            }

            Spacer()
        }
        .padding(.horizontal, LuxeTheme.horizontalPadding)
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
            HStack {
                sectionTitle(icon: "location", title: "Teslimat Bilgileri")

                Spacer()

                if !savedAddresses.isEmpty {
                    Button("Değiştir") {
                        showAddressSelection = true
                    }
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(LuxeTheme.charcoal)
                }
            }

            if !savedAddresses.isEmpty && deliveryAddress.isValid {
                selectedAddressCard
            } else {
                manualAddressFields
            }
        }
        .padding(18)
        .luxeCard()
    }

    private var selectedAddressCard: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: deliveryAddress.isDefault ? "star.fill" : "mappin.circle")
                .foregroundStyle(deliveryAddress.isDefault ? LuxeTheme.success : LuxeTheme.charcoal)
                .frame(width: 38, height: 38)
                .background(LuxeTheme.surfaceLow)
                .clipShape(Circle())

            VStack(alignment: .leading, spacing: 5) {
                HStack(spacing: 8) {
                    Text(deliveryAddress.title)
                        .font(.headline)
                        .foregroundStyle(LuxeTheme.charcoal)

                    if deliveryAddress.isDefault {
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

                Text(deliveryAddress.fullName)
                    .font(.subheadline)
                    .foregroundStyle(LuxeTheme.charcoal)

                Text("\(deliveryAddress.city) · \(deliveryAddress.addressLine)")
                    .font(.caption)
                    .foregroundStyle(LuxeTheme.secondaryText)
                    .lineLimit(2)
            }

            Spacer()
        }
        .padding(14)
        .background(LuxeTheme.surfaceLow)
        .clipShape(RoundedRectangle(cornerRadius: LuxeTheme.controlRadius, style: .continuous))
    }

    private var manualAddressFields: some View {
        VStack(alignment: .leading, spacing: 14) {
            luxeTextField("Adres Başlığı", text: $deliveryAddress.title)

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

            Toggle(isOn: $shouldSaveAddress) {
                Text("Bu adresi kaydet")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(LuxeTheme.charcoal)
            }
            .tint(LuxeTheme.charcoal)
            .padding(.top, 2)
        }
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
                addressId: savedAddresses.contains(where: { $0.id == deliveryAddress.id }) ? deliveryAddress.id : nil,
                recipientName: deliveryAddress.fullName.trimmingCharacters(in: .whitespacesAndNewlines),
                phone: deliveryAddress.phone.trimmingCharacters(in: .whitespacesAndNewlines),
                shippingCity: deliveryAddress.city.trimmingCharacters(in: .whitespacesAndNewlines),
                shippingAddressLine: deliveryAddress.addressLine.trimmingCharacters(in: .whitespacesAndNewlines),
                paymentMethod: paymentMethod.apiValue
            )
        )

        if let order = ordersViewModel.lastCreatedOrder {
            if shouldSaveAddress {
                var addressToSave = deliveryAddress.trimmed
                addressToSave.isDefault = savedAddresses.isEmpty || addressToSave.isDefault

                if let accessToken {
                    if savedAddresses.contains(where: { $0.id == addressToSave.id }) {
                        _ = try? await addressService.updateAddress(
                            addressToSave,
                            accessToken: accessToken
                        )
                    } else {
                        _ = try? await addressService.createAddress(
                            addressToSave,
                            accessToken: accessToken
                        )
                    }
                } else {
                    DeliveryAddressStore.save(addressToSave, userId: userId)
                }
            }

            completedOrder = order
            NotificationCenter.default.post(name: .orderDidChange, object: nil)
            cartViewModel.clearItems()
            await cartViewModel.loadCart()
        } else {
            errorMessage = ordersViewModel.errorMessage ?? "Sipariş oluşturulamadı."
        }
    }

    private func loadSavedAddressIfNeeded() async {
        guard !didLoadSavedAddress else { return }
        didLoadSavedAddress = true

        if let accessToken {
            do {
                savedAddresses = try await addressService.fetchAddresses(
                    accessToken: accessToken
                )
                syncLocalAddressFallback()
            } catch {
                savedAddresses = DeliveryAddressStore.loadAll(userId: userId)
            }
        } else {
            savedAddresses = DeliveryAddressStore.loadAll(userId: userId)
        }

        guard let savedAddress = savedAddresses.first(where: { $0.isDefault }) ?? savedAddresses.first else {
            return
        }

        deliveryAddress = savedAddress
        shouldSaveAddress = true
    }

    private func selectSavedAddress(_ address: DeliveryAddress) {
        deliveryAddress = address
    }

    private func openNewAddressEditor() {
        showAddressSelection = false
        editableAddress = DeliveryAddress(
            title: savedAddresses.isEmpty ? "Ev" : "",
            isDefault: savedAddresses.isEmpty
        )

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
            showAddressEditor = true
        }
    }

    private func saveAddressFromCheckout() {
        Task {
            let addressToSave = editableAddress.trimmed

            if let accessToken {
                do {
                    let savedAddress = try await addressService.createAddress(
                        addressToSave,
                        accessToken: accessToken
                    )
                    savedAddresses = try await addressService.fetchAddresses(
                        accessToken: accessToken
                    )
                    syncLocalAddressFallback()
                    deliveryAddress = savedAddresses.first { $0.id == savedAddress.id } ?? savedAddress
                    shouldSaveAddress = false
                } catch {
                    errorMessage = "Adres kaydedilemedi."
                }
            } else {
                DeliveryAddressStore.save(addressToSave, userId: userId)
                savedAddresses = DeliveryAddressStore.loadAll(userId: userId)
                deliveryAddress = savedAddresses.first { $0.id == addressToSave.id } ?? addressToSave
                shouldSaveAddress = false
            }
        }
    }

    private func syncLocalAddressFallback() {
        DeliveryAddressStore.clear(userId: userId)
        savedAddresses.forEach { address in
            DeliveryAddressStore.save(address, userId: userId)
        }
    }
}
