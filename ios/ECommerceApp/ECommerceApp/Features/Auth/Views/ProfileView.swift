import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var sessionManager: SessionManager

    var body: some View {
        NavigationStack {
            Form {
                if let user = sessionManager.currentUser {
                    Section {
                        Text(user.name)
                            .font(.headline)

                        Text(user.email)
                            .foregroundStyle(.secondary)

                        Text(user.role)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Section {
                    Button(role: .destructive) {
                        sessionManager.signOut()
                    } label: {
                        Text("Çıkış Yap")
                    }
                }
            }
            .navigationTitle("Profil")
        }
    }
}
