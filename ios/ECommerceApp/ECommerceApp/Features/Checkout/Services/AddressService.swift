import Foundation

protocol AddressServicing {
    func fetchAddresses(accessToken: String) async throws -> [DeliveryAddress]
    func createAddress(_ address: DeliveryAddress, accessToken: String) async throws -> DeliveryAddress
    func updateAddress(_ address: DeliveryAddress, accessToken: String) async throws -> DeliveryAddress
    func deleteAddress(id: String, accessToken: String) async throws
    func setDefaultAddress(id: String, accessToken: String) async throws -> DeliveryAddress
}

final class AddressService: AddressServicing {
    private let apiClient: APIClient

    init(apiClient: APIClient = .shared) {
        self.apiClient = apiClient
    }

    func fetchAddresses(accessToken: String) async throws -> [DeliveryAddress] {
        let response: [AddressResponse] = try await apiClient.authenticatedGet(
            "addresses",
            accessToken: accessToken
        )

        return response.map(\.deliveryAddress)
    }

    func createAddress(_ address: DeliveryAddress, accessToken: String) async throws -> DeliveryAddress {
        let response: AddressResponse = try await apiClient.authenticatedPost(
            "addresses",
            body: AddressRequest(address: address),
            accessToken: accessToken
        )

        return response.deliveryAddress
    }

    func updateAddress(_ address: DeliveryAddress, accessToken: String) async throws -> DeliveryAddress {
        let response: AddressResponse = try await apiClient.authenticatedPatch(
            "addresses/\(address.id)",
            body: AddressRequest(address: address),
            accessToken: accessToken
        )

        return response.deliveryAddress
    }

    func deleteAddress(id: String, accessToken: String) async throws {
        let _: RemoveAddressResponse = try await apiClient.authenticatedDelete(
            "addresses/\(id)",
            accessToken: accessToken
        )
    }

    func setDefaultAddress(id: String, accessToken: String) async throws -> DeliveryAddress {
        let response: AddressResponse = try await apiClient.authenticatedPatch(
            "addresses/\(id)/default",
            body: EmptyAddressRequest(),
            accessToken: accessToken
        )

        return response.deliveryAddress
    }
}

private struct AddressRequest: Encodable {
    let title: String
    let recipientName: String
    let phone: String
    let city: String
    let addressLine: String
    let latitude: Double?
    let longitude: Double?
    let isDefault: Bool

    init(address: DeliveryAddress) {
        let trimmedAddress = address.trimmed
        title = trimmedAddress.title
        recipientName = trimmedAddress.fullName
        phone = trimmedAddress.phone
        city = trimmedAddress.city
        addressLine = trimmedAddress.addressLine
        latitude = trimmedAddress.latitude
        longitude = trimmedAddress.longitude
        isDefault = trimmedAddress.isDefault
    }
}

private struct AddressResponse: Decodable {
    let id: String
    let title: String
    let recipientName: String
    let phone: String
    let city: String
    let addressLine: String
    let latitude: FlexibleDouble?
    let longitude: FlexibleDouble?
    let isDefault: Bool

    var deliveryAddress: DeliveryAddress {
        DeliveryAddress(
            id: id,
            title: title,
            fullName: recipientName,
            phone: phone,
            city: city,
            addressLine: addressLine,
            latitude: latitude?.value,
            longitude: longitude?.value,
            isDefault: isDefault
        )
    }
}

private struct EmptyAddressRequest: Encodable {}

private struct RemoveAddressResponse: Decodable {
    let message: String
}

private struct FlexibleDouble: Decodable {
    let value: Double

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()

        if let doubleValue = try? container.decode(Double.self) {
            value = doubleValue
            return
        }

        let stringValue = try container.decode(String.self)
        value = Double(stringValue) ?? 0
    }
}
