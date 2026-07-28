import Foundation

protocol AuthServicing {
    func login(email: String, password: String) async throws -> LoginResponse
    func register(name: String, email: String, password: String) async throws -> RegisterResponse
    func me(accessToken: String) async throws -> AuthUser
}

final class AuthService: AuthServicing {
    private let apiClient: APIClient

    init(apiClient: APIClient = .shared) {
        self.apiClient = apiClient
    }
    func register(name: String, email: String, password: String) async throws -> RegisterResponse {
        let request = RegisterRequest(name: name, email: email, password: password)
        return try await apiClient.post("auth/register", body: request)
    }

    func login(email: String, password: String) async throws -> LoginResponse {
        let request = LoginRequest(email: email, password: password)
        return try await apiClient.post("auth/login", body: request)
    }

    func me(accessToken: String) async throws -> AuthUser {
        try await apiClient.authenticatedGet(
            "auth/me",
            accessToken: accessToken
        )
    }
}
