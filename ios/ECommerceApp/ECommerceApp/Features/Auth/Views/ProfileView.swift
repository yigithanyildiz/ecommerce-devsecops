import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var sessionManager: SessionManager
    @State private var showSignOutConfirmation = false
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
