import Foundation

import Combine
@MainActor
final class SessionManager: ObservableObject{
    @Published private(set) var accessToken: String?
    @Published private(set) var currentUser: AuthUser?
    @Published var sessionAlertMessage: String?
    private let accessTokenKey = "accessToken"
    private let currentUserKey = "currentUser"
    init(){
        accessToken = UserDefaults.standard.string(forKey: accessTokenKey)
        if let userDate = UserDefaults.standard.data(forKey: currentUserKey){
            currentUser = try? JSONDecoder().decode(AuthUser.self, from: userDate)
        }
        
    }
    var isAuthenticated: Bool{
        accessToken != nil
    }
    func saveSession(accessToken: String, user: AuthUser) {
            self.accessToken = accessToken
            self.currentUser = user

            UserDefaults.standard.set(accessToken, forKey: accessTokenKey)

            if let userData = try? JSONEncoder().encode(user) {
                UserDefaults.standard.set(userData, forKey: currentUserKey)
            }
        }
    
    func signOut() {
        clearSession()
    }

    func expireSession() {
        clearSession()
        sessionAlertMessage = "Oturum süren doldu. Lütfen tekrar giriş yap."
    }

    private func clearSession() {
        accessToken = nil
        currentUser = nil
        UserDefaults.standard.removeObject(forKey: accessTokenKey)
        UserDefaults.standard.removeObject(forKey: currentUserKey)
    }
    
    func saveAccessToken(_ token: String){
        accessToken = token
        UserDefaults.standard.set(token, forKey: accessTokenKey)
    }
}
