import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var sessionManager: SessionManager
    @State private var showSignOutConfirmation = false
    var body: some View {
        NavigationStack {
            Form {
                if let user = sessionManager.currentUser {
                    Section {
                        HStack(spacing: 14) {
                            ZStack {
                                Circle()
                                    .fill(Color.accentColor.opacity(0.15))
                                    .frame(width: 56, height: 56)

                                Text(user.initials)
                                    .font(.headline)
                                    .fontWeight(.bold)
                                    .foregroundStyle(Color.accentColor)
                            }

                            VStack(alignment: .leading, spacing: 4) {
                                Text(user.name)
                                    .font(.headline)

                                Text(user.email)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .padding(.vertical, 4)
                    }

                    Section("Hesap Bilgileri") {
                        LabeledContent("Rol", value: user.roleDisplayName)
                        LabeledContent("Kullanıcı ID", value: String(user.id.prefix(8)))
                    }
                }

                Section("Oturum") {
                    Button(role: .destructive) {
                        showSignOutConfirmation = true
                    } label: {
                        Label("Çıkış Yap", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                }
            }
            .navigationTitle("Profil")
            .confirmationDialog("Çıkış yapmak istiyor musun?", isPresented: $showSignOutConfirmation) {
                Button("Çıkış Yap", role: .destructive) {
                    sessionManager.signOut()
                }

                Button("Vazgeç", role: .cancel) {}
            }
        }
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
