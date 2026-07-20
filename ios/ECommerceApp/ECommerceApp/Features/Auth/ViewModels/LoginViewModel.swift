import Foundation
import Combine

@MainActor
final class LoginViewModel: ObservableObject {
    @Published var email = ""
    @Published var password = ""
    @Published private(set) var isLoading = false
    @Published var errorMessage: String?

    private let authService: AuthServicing
    private let sessionManager: SessionManager

    init(
        authService: AuthServicing = AuthService(),
        sessionManager: SessionManager
    ) {
        self.authService = authService
        self.sessionManager = sessionManager
    }

    var canSubmit: Bool {
        !email.isEmpty && !password.isEmpty && !isLoading
    }

    func login() async {
        isLoading = true
        errorMessage = nil

        do {
            let response = try await authService.login(
                email: email,
                password: password
            )
            sessionManager.saveSession(
                accessToken: response.accessToken,
                user: response.user
            )
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}
