import Foundation

struct StorefrontConfig: Decodable {
    let id: String
    let heroEyebrow: String
    let heroTitle: String
    let heroSubtitle: String
    let heroImageUrl: String?
    let heroTargetCategorySlug: String?

    static let fallback = StorefrontConfig(
        id: "default",
        heroEyebrow: "NEW SEASON",
        heroTitle: "The Minimalist Collection",
        heroSubtitle: "Sessiz lüks, seçili ürünler ve rafine alışveriş deneyimi.",
        heroImageUrl: nil,
        heroTargetCategorySlug: nil
    )
}
