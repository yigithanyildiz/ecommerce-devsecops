import Foundation

import Combine
@MainActor
final class SessionManager: ObservableObject{
    @Published private(set) var accessToken: String?
    @Published private(set) var currentUser: AuthUser?
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

