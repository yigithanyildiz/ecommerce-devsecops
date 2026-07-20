import Foundation

extension String {
    var currencyValue: Double {
        Double(self) ?? 0
    }

    var usdCurrencyText: String {
        currencyValue.formatted(
            .currency(code: "USD")
        )
    }
}
