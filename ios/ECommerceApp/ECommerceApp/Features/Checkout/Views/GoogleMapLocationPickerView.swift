import SwiftUI
import GoogleMaps

struct GoogleMapLocationPickerView: View {
    @Environment(\.dismiss) private var dismiss

    @Binding var address: DeliveryAddress

    private let initialCoordinate: CLLocationCoordinate2D
    @State private var selectedCoordinate: CLLocationCoordinate2D

    init(address: Binding<DeliveryAddress>, initialCoordinate: CLLocationCoordinate2D?) {
        _address = address
        let coordinate = initialCoordinate
            ?? address.wrappedValue.coordinate
            ?? CLLocationCoordinate2D(latitude: 41.0082, longitude: 28.9784)

        self.initialCoordinate = coordinate
        _selectedCoordinate = State(
            initialValue: coordinate
        )
    }

    var body: some View {
        NavigationStack {
            ZStack {
                GoogleMapPickerRepresentable(selectedCoordinate: $selectedCoordinate)
                    .ignoresSafeArea(edges: .bottom)

                centerPin
                    .allowsHitTesting(false)
            }
            .navigationTitle("Konum")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Vazgeç") {
                        dismiss()
                    }
                }
            }
            .safeAreaInset(edge: .bottom) {
                bottomBar
            }
            .onAppear {
                selectedCoordinate = initialCoordinate
            }
        }
    }

    private var centerPin: some View {
        VStack(spacing: 0) {
            Image(systemName: "mappin.circle.fill")
                .font(.system(size: 42, weight: .semibold))
                .foregroundStyle(LuxeTheme.danger)
                .shadow(color: .black.opacity(0.2), radius: 10, y: 4)

            Circle()
                .fill(LuxeTheme.charcoal.opacity(0.18))
                .frame(width: 14, height: 6)
                .blur(radius: 1)
        }
        .offset(y: -18)
    }

    private var bottomBar: some View {
        VStack(spacing: 12) {
            HStack(spacing: 10) {
                Image(systemName: "location.fill")
                    .foregroundStyle(LuxeTheme.charcoal)

                Text(locationSummary)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(LuxeTheme.charcoal)

                Spacer()
            }

            Button {
                address.latitude = selectedCoordinate.latitude
                address.longitude = selectedCoordinate.longitude
                dismiss()
            } label: {
                Text("Bu Konumu Kullan")
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(LuxeTheme.charcoal)
                    .clipShape(Capsule())
            }
        }
        .padding(18)
        .background(.ultraThinMaterial)
    }

    private var locationSummary: String {
        String(
            format: "%.5f, %.5f",
            selectedCoordinate.latitude,
            selectedCoordinate.longitude
        )
    }
}

private struct GoogleMapPickerRepresentable: UIViewRepresentable {
    @Binding var selectedCoordinate: CLLocationCoordinate2D

    func makeCoordinator() -> Coordinator {
        Coordinator(selectedCoordinate: $selectedCoordinate)
    }

    func makeUIView(context: Context) -> GMSMapView {
        let options = GMSMapViewOptions()
        options.camera = GMSCameraPosition.camera(
            withLatitude: selectedCoordinate.latitude,
            longitude: selectedCoordinate.longitude,
            zoom: 15
        )

        let mapView = GMSMapView(options: options)
        mapView.delegate = context.coordinator
        mapView.settings.compassButton = true
        mapView.settings.myLocationButton = false

        return mapView
    }

    func updateUIView(_ mapView: GMSMapView, context: Context) {
        let currentCenter = mapView.camera.target
        let latitudeDelta = abs(currentCenter.latitude - selectedCoordinate.latitude)
        let longitudeDelta = abs(currentCenter.longitude - selectedCoordinate.longitude)

        guard latitudeDelta > 0.0001 || longitudeDelta > 0.0001 else {
            return
        }

        mapView.animate(
            to: GMSCameraPosition.camera(
                withLatitude: selectedCoordinate.latitude,
                longitude: selectedCoordinate.longitude,
                zoom: mapView.camera.zoom
            )
        )
    }

    final class Coordinator: NSObject, GMSMapViewDelegate {
        @Binding private var selectedCoordinate: CLLocationCoordinate2D

        init(selectedCoordinate: Binding<CLLocationCoordinate2D>) {
            _selectedCoordinate = selectedCoordinate
        }

        func mapView(_ mapView: GMSMapView, idleAt position: GMSCameraPosition) {
            selectedCoordinate = position.target
        }
    }
}
