import Foundation

enum APIError: Error, LocalizedError {
    case invalidUrl
    case invalidResponse
    case requestFailed(Int)
    case decodingFailed
    case unknown
    case networkUnavailable

    var isUnauthorized: Bool {
        if case .requestFailed(401) = self {
            return true
        }

        return false
    }

    var errorDescription: String? {
        switch self {
        case .invalidUrl:
            return "Geçersiz API adresi."
        case .invalidResponse:
            return "İstek başarısız oldu."
        case .requestFailed(let statusCode):
            switch statusCode {
            case 401:
                return "Oturum süren dolmuş olabilir. Lütfen tekrar giriş yap."
            case 409:
                return "Bu işlem stok sınırını aşıyor."
            case 429:
                return "Çok sık işlem yaptın. Biraz bekleyip tekrar dene."
            default:
                return "İstek başarısız oldu. Kod: \(statusCode)"
            }
        case .decodingFailed:
            return "Sunucu yanıtı okunamadı."
        case .unknown:
            return "Bilinmeyen bir hata oluştu."
        case .networkUnavailable:
            return "Sunucuya ulaşılamadı. Lütfen bağlantını kontrol et."
        }
    }
}
