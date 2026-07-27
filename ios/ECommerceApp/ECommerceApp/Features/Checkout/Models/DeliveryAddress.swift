import Foundation
import CoreLocation

struct DeliveryAddress: Codable, Equatable {
    var id = UUID().uuidString
    var title = ""
    var fullName = ""
    var phone = ""
    var city = ""
    var addressLine = ""
    var latitude: Double?
    var longitude: Double?
    var isDefault = false

    var isValid: Bool {
        !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !fullName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !phone.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !city.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !addressLine.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var trimmed: DeliveryAddress {
        DeliveryAddress(
            id: id,
            title: title.trimmingCharacters(in: .whitespacesAndNewlines),
            fullName: fullName.trimmingCharacters(in: .whitespacesAndNewlines),
            phone: phone.trimmingCharacters(in: .whitespacesAndNewlines),
            city: city.trimmingCharacters(in: .whitespacesAndNewlines),
            addressLine: addressLine.trimmingCharacters(in: .whitespacesAndNewlines),
            latitude: latitude,
            longitude: longitude,
            isDefault: isDefault
        )
    }

    var coordinate: CLLocationCoordinate2D? {
        guard let latitude, let longitude else {
            return nil
        }

        return CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
}
