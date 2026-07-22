import SwiftUI

struct ProductRowView: View {
    let product: Product
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            productImage

            VStack(alignment: .leading, spacing: 7) {
                if let category = product.category {
                    Text(category.name.uppercased())
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .tracking(1.1)
                        .foregroundStyle(LuxeTheme.secondaryText)
                        .lineLimit(1)
                }

                Text(product.name)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(LuxeTheme.charcoal)
                    .lineLimit(2)
                    .frame(minHeight: 36, alignment: .topLeading)

                HStack {
                    Text(product.price.usdCurrencyText)
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundStyle(LuxeTheme.charcoal)

                    Spacer()

                    Label(product.stock > 0 ? "Stokta" : "Yok", systemImage: product.stock > 0 ? "checkmark.circle.fill" : "xmark.circle.fill")
                        .font(.caption2)
                        .labelStyle(.iconOnly)
                        .foregroundStyle(product.stock > 0 ? LuxeTheme.success : LuxeTheme.danger)
                }
            }
            .padding(.horizontal, 12)
            .padding(.bottom, 14)
        }
        .luxeCard()
    }
    
    private var productImage: some View {
        GeometryReader { proxy in
            ZStack(alignment: .topTrailing) {
                LuxeTheme.surfaceLow

                if let imageUrl = product.imageUrl,
                   let url = URL(string: imageUrl) {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .empty:
                            ProgressView()
                                .frame(width: proxy.size.width, height: proxy.size.height)

                        case .success(let image):
                            image
                                .resizable()
                                .scaledToFill()
                                .frame(width: proxy.size.width, height: proxy.size.height)
                                .clipped()

                        case .failure:
                            Image(systemName: "photo")
                                .font(.title2)
                                .foregroundStyle(.secondary)
                                .frame(width: proxy.size.width, height: proxy.size.height)

                        @unknown default:
                            Image(systemName: "photo")
                                .foregroundStyle(.secondary)
                                .frame(width: proxy.size.width, height: proxy.size.height)
                        }
                    }
                } else {
                    Image(systemName: "photo")
                        .foregroundStyle(.secondary)
                        .frame(width: proxy.size.width, height: proxy.size.height)
                }

                Image(systemName: "heart")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(LuxeTheme.charcoal)
                    .frame(width: 30, height: 30)
                    .background(.white.opacity(0.86))
                    .clipShape(Circle())
                    .padding(10)
            }
        }
        .aspectRatio(0.8, contentMode: .fit)
        .frame(maxWidth: .infinity)
        .clipped()
        .clipShape(RoundedRectangle(cornerRadius: LuxeTheme.cardRadius, style: .continuous))
    }
}
