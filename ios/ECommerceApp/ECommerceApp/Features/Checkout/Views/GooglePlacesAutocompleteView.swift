import SwiftUI
import GooglePlaces

struct GooglePlacesAutocompleteView: UIViewControllerRepresentable {
    @Environment(\.dismiss) private var dismiss

    @Binding var address: DeliveryAddress

    func makeCoordinator() -> Coordinator {
        Coordinator(address: $address, dismiss: dismiss)
    }

    func makeUIViewController(context: Context) -> GMSAutocompleteViewController {
        let viewController = GMSAutocompleteViewController()
        viewController.delegate = context.coordinator
        viewController.placeFields = [
            .name,
            .formattedAddress,
            .coordinate,
            .addressComponents
        ]

        let filter = GMSAutocompleteFilter()
        filter.countries = ["TR"]
        viewController.autocompleteFilter = filter

        return viewController
    }

    func updateUIViewController(_ uiViewController: GMSAutocompleteViewController, context: Context) {}

    final class Coordinator: NSObject, GMSAutocompleteViewControllerDelegate {
        @Binding private var address: DeliveryAddress
        private let dismiss: DismissAction

        init(address: Binding<DeliveryAddress>, dismiss: DismissAction) {
            _address = address
            self.dismiss = dismiss
        }

        func viewController(
            _ viewController: GMSAutocompleteViewController,
            didAutocompleteWith place: GMSPlace
        ) {
            address.addressLine = place.formattedAddress ?? place.name ?? address.addressLine
            address.latitude = place.coordinate.latitude
            address.longitude = place.coordinate.longitude

            if address.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                address.title = "Ev"
            }

            if let city = cityName(from: place.addressComponents) {
                address.city = city
            }

            dismiss()
        }

        func viewController(
            _ viewController: GMSAutocompleteViewController,
            didFailAutocompleteWithError error: Error
        ) {
            dismiss()
        }

        func wasCancelled(_ viewController: GMSAutocompleteViewController) {
            dismiss()
        }

        private func cityName(from components: [GMSAddressComponent]?) -> String? {
            components?.first { component in
                component.types.contains("administrative_area_level_1")
                    || component.types.contains("locality")
            }?.name
        }
    }
}
