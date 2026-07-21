import Foundation

struct DeliveryAddress {
    var fullName = ""
    var phone = ""
    var city = ""
    var addressLine = ""

    var isValid: Bool {
        !fullName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !phone.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !city.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !addressLine.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
}
