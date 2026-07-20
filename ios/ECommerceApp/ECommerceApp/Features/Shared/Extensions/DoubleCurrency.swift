import Foundation

extension Double {
    var usdCurrencyText: String {
        formatted(.currency(code: "USD"))
    }
}
