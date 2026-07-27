import SwiftUI
import GoogleMaps

struct GoogleMapPreviewView: UIViewRepresentable {
    let coordinate: CLLocationCoordinate2D

    func makeUIView(context: Context) -> GMSMapView {
        let options = GMSMapViewOptions()
        options.camera = GMSCameraPosition.camera(
            withLatitude: coordinate.latitude,
            longitude: coordinate.longitude,
            zoom: 15
        )

        let mapView = GMSMapView(options: options)
        mapView.isUserInteractionEnabled = false
        mapView.settings.compassButton = false
        mapView.settings.myLocationButton = false

        return mapView
    }

    func updateUIView(_ mapView: GMSMapView, context: Context) {
        mapView.clear()
        mapView.camera = GMSCameraPosition.camera(
            withLatitude: coordinate.latitude,
            longitude: coordinate.longitude,
            zoom: 15
        )

        let marker = GMSMarker(position: coordinate)
        marker.map = mapView
    }
}
