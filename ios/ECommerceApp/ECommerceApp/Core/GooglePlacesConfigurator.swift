import Foundation
import GoogleMaps
import GooglePlaces

enum GooglePlacesConfigurator {
    private(set) static var isConfigured = false
    private(set) static var statusMessage = "Henüz denenmedi."

    static func configure() {
        guard !isConfigured else {
            statusMessage = "Google Places hazır."
            return
        }

        guard let apiKey = configuredAPIKey,
              !apiKey.isEmpty else {
            isConfigured = false
            statusMessage = "GOOGLE_PLACES_API_KEY Info.plist ve Scheme Environment içinde boş veya yok."
            return
        }

        guard !apiKey.hasPrefix("$(") else {
            isConfigured = false
            statusMessage = "Info.plist hâlâ build setting placeholder okuyor: \(apiKey)"
            return
        }

        GMSServices.provideAPIKey(apiKey)
        GMSPlacesClient.provideAPIKey(apiKey)
        isConfigured = true
        statusMessage = "Google Places ve Maps hazır."
    }

    private static var configuredAPIKey: String? {
        if let infoPlistKey = Bundle.main.object(forInfoDictionaryKey: "GOOGLE_PLACES_API_KEY") as? String,
           !infoPlistKey.isEmpty {
            return infoPlistKey
        }

        return ProcessInfo.processInfo.environment["GOOGLE_PLACES_API_KEY"]
    }
}
