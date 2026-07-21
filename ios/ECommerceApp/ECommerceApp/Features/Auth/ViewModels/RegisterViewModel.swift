import Foundation
import Combine

@MainActor
final class RegisterViewModel: ObservableObject {
    @Published var name = ""
    @Published var email = ""
    @Published var password = ""
    @Published private(set) var isLoading = false
    @Published var errorMessage: String?
    @Published private(set) var didRegister = false

    private let authService: AuthServicing

    init(authService: AuthServicing = AuthService()) {
        self.authService = authService
    }

    var canSubmit: Bool {
        !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !password.isEmpty
            && !isLoading
    }

    func register() async {
        guard !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              !password.isEmpty else {
            errorMessage = "Ad, e-posta ve şifre alanları zorunlu."
            return
        }
        guard password.count >= 6 else {
            errorMessage = "Şifre en az 6 karakter olmalı."
            return
        }
        isLoading = true
        errorMessage = nil

        do {
            _ = try await authService.register(
                name: name,
                email: email,
                password: password
            )
            didRegister = true
        } catch {
            if let apiError = error as? APIError {
                switch apiError {
                case .requestFailed(409):
                    errorMessage = "Bu e-posta adresi zaten kayıtlı."
                default:
                    errorMessage = apiError.localizedDescription
                }
            } else {
                errorMessage = error.localizedDescription
            }
        }

        isLoading = false
    }
}
