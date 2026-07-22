import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var sessionManager: SessionManager
    @State private var showSignOutConfirmation = false
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
                        }
                        .frame(maxWidth: .infinity)
                        .padding(24)
                        .luxeCard()

                        VStack(spacing: 0) {
                            profileRow(icon: "person.text.rectangle", title: "Rol", value: user.roleDisplayName)
                            Divider()
                                .padding(.leading, 42)
                            profileRow(icon: "number", title: "Kullanıcı ID", value: String(user.id.prefix(8)))
                            Divider()
                                .padding(.leading, 42)
                            profileRow(icon: "bag", title: "Siparişler", value: "Takip et")
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
            .background(LuxeTheme.background)
            .navigationTitle("Profil")
            .navigationBarTitleDisplayMode(.inline)
            .confirmationDialog("Çıkış yapmak istiyor musun?", isPresented: $showSignOutConfirmation) {
                Button("Çıkış Yap", role: .destructive) {
                    sessionManager.signOut()
                }

                Button("Vazgeç", role: .cancel) {}
            }
        }
    }

    private func profileRow(icon: String, title: String, value: String) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .foregroundStyle(LuxeTheme.charcoal)
                .frame(width: 28, height: 28)

            Text(title)
                .foregroundStyle(LuxeTheme.charcoal)

            Spacer()

            Text(value)
                .foregroundStyle(LuxeTheme.secondaryText)
        }
        .font(.subheadline)
        .padding(.vertical, 16)
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
