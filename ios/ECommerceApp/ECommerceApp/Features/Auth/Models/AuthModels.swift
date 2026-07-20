import Foundation

struct LoginRequest: Encodable{
    let email: String
    let password: String
}

struct LoginResponse:Decodable{
    let accessToken: String
    let user: AuthUser
    
}

struct AuthUser: Decodable,Encodable{
    let id: String
    let name: String
    let email: String
    let role: String
}
struct RegisterRequest: Encodable {
    let name: String
    let email: String
    let password: String
}

struct RegisterResponse: Decodable {
    let id: String
    let name: String
    let email: String
    let role: String
    let isActive: Bool
    let createdAt: String
}
