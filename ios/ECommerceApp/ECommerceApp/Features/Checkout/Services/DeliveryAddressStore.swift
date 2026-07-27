import Foundation

enum DeliveryAddressStore {
    private static let keyPrefix = "savedDeliveryAddress"
    private static let listKeyPrefix = "savedDeliveryAddresses"

    static func load(userId: String?) -> DeliveryAddress? {
        loadAll(userId: userId).first { $0.isDefault } ?? loadAll(userId: userId).first
    }

    static func loadAll(userId: String?) -> [DeliveryAddress] {
        if let data = UserDefaults.standard.data(forKey: listKey(userId: userId)),
           let addresses = try? JSONDecoder().decode([DeliveryAddress].self, from: data) {
            return addresses
        }

        guard let data = UserDefaults.standard.data(forKey: key(userId: userId)),
              var legacyAddress = try? JSONDecoder().decode(DeliveryAddress.self, from: data) else {
            return []
        }

        if legacyAddress.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            legacyAddress.title = "Ev"
        }

        legacyAddress.isDefault = true
        saveAll([legacyAddress], userId: userId)
        UserDefaults.standard.removeObject(forKey: key(userId: userId))

        return [legacyAddress]
    }

    static func save(_ address: DeliveryAddress, userId: String?) {
        var addresses = loadAll(userId: userId)
        var savedAddress = address.trimmed

        if addresses.isEmpty {
            savedAddress.isDefault = true
        }

        if savedAddress.isDefault {
            addresses = addresses.map { existingAddress in
                var updatedAddress = existingAddress
                updatedAddress.isDefault = false
                return updatedAddress
            }
        }

        if let index = addresses.firstIndex(where: { $0.id == savedAddress.id }) {
            addresses[index] = savedAddress
        } else {
            addresses.append(savedAddress)
        }

        if !addresses.contains(where: { $0.isDefault }) {
            addresses[0].isDefault = true
        }

        saveAll(addresses, userId: userId)
    }

    static func delete(_ address: DeliveryAddress, userId: String?) {
        var addresses = loadAll(userId: userId).filter { $0.id != address.id }

        if !addresses.isEmpty && !addresses.contains(where: { $0.isDefault }) {
            addresses[0].isDefault = true
        }

        saveAll(addresses, userId: userId)
    }

    static func setDefault(_ address: DeliveryAddress, userId: String?) {
        let addresses = loadAll(userId: userId).map { existingAddress in
            var updatedAddress = existingAddress
            updatedAddress.isDefault = existingAddress.id == address.id
            return updatedAddress
        }

        saveAll(addresses, userId: userId)
    }

    static func clear(userId: String?) {
        UserDefaults.standard.removeObject(forKey: key(userId: userId))
        UserDefaults.standard.removeObject(forKey: listKey(userId: userId))
    }

    private static func saveAll(_ addresses: [DeliveryAddress], userId: String?) {
        guard let data = try? JSONEncoder().encode(addresses) else {
            return
        }

        UserDefaults.standard.set(data, forKey: listKey(userId: userId))
    }

    private static func key(userId: String?) -> String {
        guard let userId, !userId.isEmpty else {
            return "\(keyPrefix).guest"
        }

        return "\(keyPrefix).\(userId)"
    }

    private static func listKey(userId: String?) -> String {
        guard let userId, !userId.isEmpty else {
            return "\(listKeyPrefix).guest"
        }

        return "\(listKeyPrefix).\(userId)"
    }
}
