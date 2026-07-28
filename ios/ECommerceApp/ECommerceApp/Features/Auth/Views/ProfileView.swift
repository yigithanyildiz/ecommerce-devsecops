import SwiftUI

struct ProfileView: View {
    @ObservedObject private var sessionManager: SessionManager
    @StateObject private var dashboardViewModel: ProfileDashboardViewModel
    @State private var showSignOutConfirmation = false
    @State private var showDeliveryAddresses = false
    @State private var savedDeliveryAddresses: [DeliveryAddress] = []
    let onOpenOrders: () -> Void
    let onOpenCart: () -> Void
    let onOpenFavorites: () -> Void
    let onOpenCatalog: () -> Void

    init(
        sessionManager: SessionManager,
        onOpenOrders: @escaping () -> Void = {},
        onOpenCart: @escaping () -> Void = {},
        onOpenFavorites: @escaping () -> Void = {},
        onOpenCatalog: @escaping () -> Void = {}
    ) {
        self.sessionManager = sessionManager
        self.onOpenOrders = onOpenOrders
        self.onOpenCart = onOpenCart
        self.onOpenFavorites = onOpenFavorites
        self.onOpenCatalog = onOpenCatalog

        _dashboardViewModel = StateObject(
            wrappedValue: ProfileDashboardViewModel(sessionManager: sessionManager)
        )
    }
    var body: some View {
        NavigationStack {
            ScrollView {
                if let user = sessionManager.currentUser {
                    VStack(spacing: 22) {
                        VStack(spacing: 14) {
                            ZStack {
                                Circle()
                                    .fill(LuxeTheme.charcoal)
                                    .frame(width: 76, height: 76)

                                Text(user.initials)
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .foregroundStyle(.white)
                            }

                            Text(user.name)
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundStyle(LuxeTheme.charcoal)

                            Text(user.email)
                                .font(.subheadline)
                                .foregroundStyle(LuxeTheme.secondaryText)

                            Text(user.roleDisplayName)
                                .font(.caption)
                                .fontWeight(.semibold)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 7)
                                .foregroundStyle(LuxeTheme.charcoal)
                                .background(LuxeTheme.surfaceLow)
                                .clipShape(Capsule())
                        }
                        .frame(maxWidth: .infinity)
                        .padding(24)
                        .luxeCard()

                        dashboardSection

                        VStack(spacing: 0) {
                            profileRow(icon: "checkmark.shield", title: "Hesap Durumu", value: "Aktif")
                            Divider()
                                .padding(.leading, 42)
                            profileRow(icon: "number", title: "Kullanıcı ID", value: String(user.id.prefix(8)))
                            Divider()
                                .padding(.leading, 42)

                            Button {
                                showDeliveryAddresses = true
                            } label: {
                                profileRow(
                                    icon: "mappin.and.ellipse",
                                    title: "Adreslerim",
                                    value: deliveryAddressSummary,
                                    showsChevron: true
                                )
                            }
                            .buttonStyle(.plain)

                            Divider()
                                .padding(.leading, 42)

                            Button {
                                onOpenOrders()
                            } label: {
                                profileRow(icon: "bag", title: "Siparişler", value: "Takip et", showsChevron: true)
                            }
                            .buttonStyle(.plain)

                            Divider()
                                .padding(.leading, 42)

                            Button {
                                onOpenCart()
                            } label: {
                                profileRow(icon: "cart", title: "Sepetim", value: "Görüntüle", showsChevron: true)
                            }
                            .buttonStyle(.plain)

                            Divider()
                                .padding(.leading, 42)

                            Button {
                                onOpenFavorites()
                            } label: {
                                profileRow(icon: "heart", title: "Favorilerim", value: "Kaydedilenler", showsChevron: true)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.horizontal, 16)
                        .luxeCard()

                        Button(role: .destructive) {
                            showSignOutConfirmation = true
                        } label: {
                            Label("Çıkış Yap", systemImage: "rectangle.portrait.and.arrow.right")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 15)
                        }
                        .foregroundStyle(LuxeTheme.danger)
                        .background(LuxeTheme.surfaceLow)
                        .clipShape(Capsule())
                    }
                    .padding(.horizontal, LuxeTheme.horizontalPadding)
                    .padding(.top, 24)
                }
            }
            .refreshable {
                await dashboardViewModel.loadDashboard()
            }
            .background(LuxeTheme.background)
            .navigationTitle("Profil")
            .navigationBarTitleDisplayMode(.inline)
            .alert("Çıkış yapmak istiyor musun?", isPresented: $showSignOutConfirmation) {
                Button("Çıkış Yap", role: .destructive) {
                    var transaction = Transaction()
                    transaction.animation = nil

                    withTransaction(transaction) {
                        sessionManager.signOut()
                    }
                }

                Button("Vazgeç", role: .cancel) {}
            } message: {
                Text("Oturumun bu cihazdan kapatılacak.")
            }
            .sheet(isPresented: $showDeliveryAddresses) {
                DeliveryAddressesView(
                    userId: sessionManager.currentUser?.id,
                    accessToken: sessionManager.accessToken,
                    onChange: loadSavedDeliveryAddresses
                )
            }
            .task {
                loadSavedDeliveryAddresses()
                await dashboardViewModel.loadDashboard()
            }
            .onChange(of: sessionManager.accessToken) { _, _ in
                loadSavedDeliveryAddresses()
                Task {
                    await dashboardViewModel.loadDashboard()
                }
            }
            .onReceive(NotificationCenter.default.publisher(for: .cartDidChange)) { _ in
                Task {
                    await dashboardViewModel.loadDashboard()
                }
            }
            .onReceive(NotificationCenter.default.publisher(for: .favoriteDidChange)) { _ in
                Task {
                    await dashboardViewModel.loadDashboard()
                }
            }
            .onReceive(NotificationCenter.default.publisher(for: .orderDidChange)) { _ in
                Task {
                    await dashboardViewModel.loadDashboard()
                }
            }
        }
    }

    private var dashboardSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text("Hesap Özeti")
                    .font(.headline)
                    .foregroundStyle(LuxeTheme.charcoal)

                Spacer()

                if dashboardViewModel.isLoading {
                    ProgressView()
                        .scaleEffect(0.82)
                }
            }

            HStack(spacing: 10) {
                Button {
                    onOpenOrders()
                } label: {
                    dashboardMetric(
                        title: "Sipariş",
                        value: "\(dashboardViewModel.orderCount)",
                        icon: "bag"
                    )
                }

                Button {
                    onOpenFavorites()
                } label: {
                    dashboardMetric(
                        title: "Favori",
                        value: "\(dashboardViewModel.favoriteCount)",
                        icon: "heart"
                    )
                }

                Button {
                    onOpenCart()
                } label: {
                    dashboardMetric(
                        title: "Sepet",
                        value: "\(dashboardViewModel.cartItemCount)",
                        icon: "cart"
                    )
                }
            }
            .buttonStyle(.plain)

            if let lastOrder = dashboardViewModel.lastOrder {
                NavigationLink {
                    OrderDetailView(
                        order: lastOrder,
                        sessionManager: sessionManager
                    )
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "shippingbox")
                            .foregroundStyle(LuxeTheme.charcoal)
                            .frame(width: 34, height: 34)
                            .background(LuxeTheme.surfaceLow)
                            .clipShape(Circle())

                        VStack(alignment: .leading, spacing: 3) {
                            Text("Son sipariş #\(lastOrder.id.prefix(8))")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundStyle(LuxeTheme.charcoal)

                            Text("\(lastOrder.statusLabel) · \(lastOrder.totalAmount.usdCurrencyText)")
                                .font(.caption)
                                .foregroundStyle(LuxeTheme.secondaryText)
                        }

                        Spacer()

                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundStyle(LuxeTheme.secondaryText)
                    }
                    .padding(12)
                    .background(LuxeTheme.surfaceLow)
                    .clipShape(RoundedRectangle(cornerRadius: LuxeTheme.controlRadius, style: .continuous))
                }
                .buttonStyle(.plain)
            } else if !dashboardViewModel.isLoading {
                Button {
                    onOpenCatalog()
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "sparkles")
                            .foregroundStyle(LuxeTheme.charcoal)
                            .frame(width: 34, height: 34)
                            .background(LuxeTheme.surfaceLow)
                            .clipShape(Circle())

                        VStack(alignment: .leading, spacing: 3) {
                            Text("Henüz sipariş yok")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundStyle(LuxeTheme.charcoal)

                            Text("İlk alışverişine ürünlerden başla")
                                .font(.caption)
                                .foregroundStyle(LuxeTheme.secondaryText)
                        }

                        Spacer()

                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundStyle(LuxeTheme.secondaryText)
                    }
                    .padding(12)
                    .background(LuxeTheme.surfaceLow)
                    .clipShape(RoundedRectangle(cornerRadius: LuxeTheme.controlRadius, style: .continuous))
                }
                .buttonStyle(.plain)
            }

            if let errorMessage = dashboardViewModel.errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundStyle(LuxeTheme.danger)
            }
        }
        .padding(18)
        .luxeCard()
    }

    private var deliveryAddressSummary: String {
        guard !savedDeliveryAddresses.isEmpty else {
            return "Ekle"
        }

        if let defaultAddress = savedDeliveryAddresses.first(where: { $0.isDefault }) {
            return defaultAddress.title
        }

        return "\(savedDeliveryAddresses.count) kayıtlı"
    }

    private func dashboardMetric(title: String, value: String, icon: String) -> some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .foregroundStyle(LuxeTheme.charcoal)

            if dashboardViewModel.isLoading {
                ProgressView()
                    .frame(height: 28)
            } else {
                Text(value)
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundStyle(LuxeTheme.charcoal)
                    .frame(height: 28)
            }

            Text(title)
                .font(.caption)
                .foregroundStyle(LuxeTheme.secondaryText)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(LuxeTheme.surfaceLow)
        .clipShape(RoundedRectangle(cornerRadius: LuxeTheme.controlRadius, style: .continuous))
    }

    private func profileRow(
        icon: String,
        title: String,
        value: String,
        showsChevron: Bool = false
    ) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .foregroundStyle(LuxeTheme.charcoal)
                .frame(width: 28, height: 28)

            Text(title)
                .foregroundStyle(LuxeTheme.charcoal)

            Spacer()

            Text(value)
                .foregroundStyle(LuxeTheme.secondaryText)

            if showsChevron {
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(LuxeTheme.secondaryText)
            }
        }
        .font(.subheadline)
        .padding(.vertical, 16)
    }

    private func loadSavedDeliveryAddresses() {
        savedDeliveryAddresses = DeliveryAddressStore.loadAll(userId: sessionManager.currentUser?.id)
    }
}

private extension AuthUser {
    var initials: String {
        let parts = name
            .split(separator: " ")
            .prefix(2)

        let initials = parts.compactMap { $0.first }

        if initials.isEmpty {
            return String(email.prefix(1)).uppercased()
        }

        return initials.map(String.init).joined().uppercased()
    }

    var roleDisplayName: String {
        switch role {
        case "ADMIN":
            return "Admin"
        case "USER":
            return "Müşteri"
        default:
            return role
        }
    }
}
