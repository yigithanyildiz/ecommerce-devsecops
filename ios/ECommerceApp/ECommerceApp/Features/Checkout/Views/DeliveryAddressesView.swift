import SwiftUI

struct DeliveryAddressesView: View {
    @Environment(\.dismiss) private var dismiss

    let userId: String?
    let accessToken: String?
    let onChange: () -> Void

    private let addressService = AddressService()

    @State private var addresses: [DeliveryAddress] = []
    @State private var editableAddress = DeliveryAddress()
    @State private var showEditor = false
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("ADDRESS BOOK")
                            .font(.caption)
                            .fontWeight(.bold)
                            .tracking(1.5)
                            .foregroundStyle(LuxeTheme.secondaryText)

                        Text("Adreslerim")
                            .font(.system(size: 30, weight: .bold))
                            .foregroundStyle(LuxeTheme.charcoal)
                    }

                    if isLoading && addresses.isEmpty {
                        ProgressView("Adresler yükleniyor...")
                            .frame(maxWidth: .infinity)
                            .padding(28)
                            .luxeCard()
                    } else if addresses.isEmpty {
                        emptyState
                    } else {
                        VStack(spacing: 12) {
                            ForEach(addresses, id: \.id) { address in
                                addressCard(address)
                            }
                        }
                    }

                    if let errorMessage {
                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(LuxeTheme.danger)
                            .padding(.horizontal, 4)
                    }

                    Button {
                        editableAddress = DeliveryAddress(
                            title: addresses.isEmpty ? "Ev" : "",
                            isDefault: addresses.isEmpty
                        )
                        showEditor = true
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
            .navigationTitle("Adresler")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Kapat") {
                        dismiss()
                    }
                }
            }
            .sheet(isPresented: $showEditor) {
                DeliveryAddressEditorView(
                    address: $editableAddress,
                    hasSavedAddress: addresses.contains(where: { $0.id == editableAddress.id }),
                    onSave: saveEditableAddress,
                    onClear: deleteEditableAddress
                )
            }
            .task {
                await loadAddresses()
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "mappin.and.ellipse")
                .font(.system(size: 36, weight: .semibold))
                .foregroundStyle(LuxeTheme.charcoal)

            Text("Kayıtlı adres yok")
                .font(.headline)
                .foregroundStyle(LuxeTheme.charcoal)
        }
        .frame(maxWidth: .infinity)
        .padding(28)
        .luxeCard()
    }

    private func addressCard(_ address: DeliveryAddress) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: address.isDefault ? "star.fill" : "mappin.circle")
                    .foregroundStyle(address.isDefault ? LuxeTheme.success : LuxeTheme.charcoal)
                    .frame(width: 34, height: 34)
                    .background(LuxeTheme.surfaceLow)
                    .clipShape(Circle())

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

            HStack(spacing: 10) {
                Button("Düzenle") {
                    editableAddress = address
                    showEditor = true
                }
                .buttonStyle(.bordered)
                .tint(LuxeTheme.charcoal)

                if !address.isDefault {
                    Button("Varsayılan Yap") {
                        Task {
                            await setDefaultAddress(address)
                        }
                    }
                    .buttonStyle(.bordered)
                    .tint(LuxeTheme.charcoal)
                }
            }
        }
        .padding(16)
        .luxeCard()
    }

    private func loadAddresses() async {
        isLoading = true
        defer { isLoading = false }

        guard let accessToken else {
            addresses = DeliveryAddressStore.loadAll(userId: userId)
            return
        }

        do {
            addresses = try await addressService.fetchAddresses(accessToken: accessToken)
            syncLocalFallback()
            errorMessage = nil
        } catch {
            addresses = DeliveryAddressStore.loadAll(userId: userId)
            errorMessage = "Adresler sunucudan alınamadı."
        }
    }

    private func saveEditableAddress() {
        Task {
            guard let accessToken else {
                DeliveryAddressStore.save(editableAddress, userId: userId)
                addresses = DeliveryAddressStore.loadAll(userId: userId)
                onChange()
                return
            }

            do {
                if addresses.contains(where: { $0.id == editableAddress.id }) {
                    _ = try await addressService.updateAddress(
                        editableAddress,
                        accessToken: accessToken
                    )
                } else {
                    _ = try await addressService.createAddress(
                        editableAddress,
                        accessToken: accessToken
                    )
                }

                await loadAddresses()
                onChange()
            } catch {
                errorMessage = "Adres kaydedilemedi."
            }
        }
    }

    private func deleteEditableAddress() {
        Task {
            guard let accessToken else {
                DeliveryAddressStore.delete(editableAddress, userId: userId)
                editableAddress = DeliveryAddress()
                addresses = DeliveryAddressStore.loadAll(userId: userId)
                onChange()
                return
            }

            do {
                try await addressService.deleteAddress(
                    id: editableAddress.id,
                    accessToken: accessToken
                )
                editableAddress = DeliveryAddress()
                await loadAddresses()
                onChange()
            } catch {
                errorMessage = "Adres silinemedi."
            }
        }
    }

    private func setDefaultAddress(_ address: DeliveryAddress) async {
        guard let accessToken else {
            DeliveryAddressStore.setDefault(address, userId: userId)
            addresses = DeliveryAddressStore.loadAll(userId: userId)
            onChange()
            return
        }

        do {
            _ = try await addressService.setDefaultAddress(
                id: address.id,
                accessToken: accessToken
            )
            await loadAddresses()
            onChange()
        } catch {
            errorMessage = "Varsayılan adres güncellenemedi."
        }
    }

    private func syncLocalFallback() {
        DeliveryAddressStore.clear(userId: userId)
        addresses.forEach { address in
            DeliveryAddressStore.save(address, userId: userId)
        }
    }
}
