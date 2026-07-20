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
        !name.isEmpty && !email.isEmpty && !password.isEmpty && !isLoading
    }

    func register() async {
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
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}
