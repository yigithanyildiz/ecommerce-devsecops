import SwiftUI
import CoreLocation

struct DeliveryAddressEditorView: View {
    @Environment(\.dismiss) private var dismiss

    @Binding var address: DeliveryAddress
    let hasSavedAddress: Bool
    let onSave: () -> Void
    let onClear: () -> Void

    @State private var showAddressSearch = false
    @State private var showMapPicker = false
    @State private var mapPickerInitialCoordinate: CLLocationCoordinate2D?
    @State private var showMissingGoogleKeyAlert = false

    private var canSave: Bool {
        address.isValid
    }

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

                        Text("Teslimat Bilgilerim")
                            .font(.system(size: 30, weight: .bold))
                            .foregroundStyle(LuxeTheme.charcoal)
                    }

                    addressSearchCard

                    VStack(alignment: .leading, spacing: 14) {
                        luxeTextField("Adres Başlığı", text: $address.title)
                            .textContentType(.none)

                        luxeTextField("Ad Soyad", text: $address.fullName)
                            .textContentType(.name)

                        luxeTextField("Telefon", text: $address.phone)
                            .keyboardType(.phonePad)
                            .textContentType(.telephoneNumber)

                        luxeTextField("Şehir", text: $address.city)

                        TextField("Adres", text: $address.addressLine, axis: .vertical)
                            .lineLimit(3...5)
                            .padding(14)
                            .background(LuxeTheme.surfaceLow)
                            .clipShape(RoundedRectangle(cornerRadius: LuxeTheme.controlRadius, style: .continuous))

                        Toggle(isOn: $address.isDefault) {
                            Text("Varsayılan adres")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundStyle(LuxeTheme.charcoal)
                        }
                        .tint(LuxeTheme.charcoal)
                    }
                    .padding(18)
                    .luxeCard()

                    Button {
                        onSave()
                        dismiss()
                    } label: {
                        Text("Adresi Kaydet")
                            .font(.headline)
                            .fontWeight(.semibold)
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(canSave ? LuxeTheme.charcoal : LuxeTheme.surfaceHigh)
                            .clipShape(Capsule())
                    }
                    .disabled(!canSave)

                    if hasSavedAddress {
                        Button(role: .destructive) {
                            onClear()
                            dismiss()
                        } label: {
                            Text("Kayıtlı Adresi Sil")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundStyle(LuxeTheme.danger)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(LuxeTheme.surfaceLow)
                                .clipShape(Capsule())
                        }
                    }
                }
                .padding(.horizontal, LuxeTheme.horizontalPadding)
                .padding(.top, 24)
                .padding(.bottom, 34)
            }
            .background(LuxeTheme.background)
            .navigationTitle("Teslimat")
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $showAddressSearch) {
                GooglePlacesAutocompleteView(address: $address)
            }
            .fullScreenCover(isPresented: $showMapPicker) {
                GoogleMapLocationPickerView(
                    address: $address,
                    initialCoordinate: mapPickerInitialCoordinate
                )
            }
            .alert("Google Places hazır değil", isPresented: $showMissingGoogleKeyAlert) {
                Button("Tamam", role: .cancel) {}
            } message: {
                Text(GooglePlacesConfigurator.statusMessage)
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Kapat") {
                        dismiss()
                    }
                }
            }
        }
    }

    private var addressSearchCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                Image(systemName: "magnifyingglass")
                    .foregroundStyle(LuxeTheme.charcoal)
                    .frame(width: 38, height: 38)
                    .background(LuxeTheme.surfaceLow)
                    .clipShape(Circle())

                VStack(alignment: .leading, spacing: 4) {
                    Text("Adres Ara")
                        .font(.headline)
                        .foregroundStyle(LuxeTheme.charcoal)

                    Text(address.addressLine.isEmpty ? "Google Places" : address.addressLine)
                        .font(.caption)
                        .foregroundStyle(LuxeTheme.secondaryText)
                        .lineLimit(2)
                }

                Spacer()
            }

            if let coordinate = address.coordinate {
                GoogleMapPreviewView(coordinate: coordinate)
                    .frame(height: 148)
                    .clipShape(RoundedRectangle(cornerRadius: LuxeTheme.controlRadius, style: .continuous))
            }

            Button {
                GooglePlacesConfigurator.configure()

                if GooglePlacesConfigurator.isConfigured {
                    showAddressSearch = true
                } else {
                    showMissingGoogleKeyAlert = true
                }
            } label: {
                Text(address.addressLine.isEmpty ? "Google ile Ara" : "Adresi Değiştir")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(LuxeTheme.charcoal)
                    .clipShape(Capsule())
            }
            .buttonStyle(.plain)

            if address.coordinate != nil {
                Button {
                    GooglePlacesConfigurator.configure()

                    if GooglePlacesConfigurator.isConfigured {
                        mapPickerInitialCoordinate = address.coordinate
                        showMapPicker = true
                    } else {
                        showMissingGoogleKeyAlert = true
                    }
                } label: {
                    Text("Haritada Düzenle")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(LuxeTheme.charcoal)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(LuxeTheme.surfaceLow)
                        .clipShape(Capsule())
                }
                .buttonStyle(.plain)
            }
        }
        .padding(18)
        .luxeCard()
    }

    private func luxeTextField(_ placeholder: String, text: Binding<String>) -> some View {
        TextField(placeholder, text: text)
            .padding(14)
            .background(LuxeTheme.surfaceLow)
            .clipShape(RoundedRectangle(cornerRadius: LuxeTheme.controlRadius, style: .continuous))
    }
}
