import SwiftUI

enum LuxeTheme {
    static let background = Color(red: 0.992, green: 0.973, blue: 0.973)
    static let surface = Color.white
    static let surfaceLow = Color(red: 0.969, green: 0.953, blue: 0.949)
    static let surfaceHigh = Color(red: 0.922, green: 0.906, blue: 0.902)

    static let charcoal = Color(red: 0.110, green: 0.106, blue: 0.106)
    static let secondaryText = Color(red: 0.267, green: 0.278, blue: 0.282)
    static let gold = Color(red: 0.996, green: 0.839, blue: 0.357)
    static let danger = Color(red: 0.729, green: 0.102, blue: 0.102)
    static let success = Color(red: 0.059, green: 0.318, blue: 0.220)

    static let cardRadius: CGFloat = 16
    static let controlRadius: CGFloat = 14
    static let horizontalPadding: CGFloat = 20
}

struct LuxeCardBackground: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(LuxeTheme.surface)
            .clipShape(
                RoundedRectangle(
                    cornerRadius: LuxeTheme.cardRadius,
                    style: .continuous
                )
            )
            .shadow(
                color: LuxeTheme.charcoal.opacity(0.05),
                radius: 18,
                x: 0,
                y: 8
            )
    }
}

extension View {
    func luxeCard() -> some View {
        modifier(LuxeCardBackground())
    }
}
