import SwiftUI

struct ProductRowView: View {
    let product: Product
    
    var body: some View {
        HStack(spacing: 12) {
            productImage
            
            VStack(alignment: .leading, spacing: 6) {
                Text(product.name)
                    .font(.headline)
                
                if let description = product.description {
                    Text(description)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }
                
                HStack {
                    Text("$\(product.price)")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    
                    Spacer()
                    
                    Text("Stok: \(product.stock)")
                        .font(.caption)
                        .foregroundStyle(product.stock > 0 ? .green : .red)
                }
            }
        }
        .padding(.vertical, 6)
    }
    
    private var productImage: some View {
        Group {
            if let imageUrl = product.imageUrl,
               let url = URL(string: imageUrl) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .empty:
                        ProgressView()
                        
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
                        
                    case .failure:
                        Image(systemName: "photo")
                            .font(.title2)
                            .foregroundStyle(.secondary)
                        .padding(6)
                        
                    @unknown default:
                        Image(systemName: "photo")
                            .foregroundStyle(.secondary)
                    }
                }
            } else {
                Image(systemName: "photo")
                    .foregroundStyle(.secondary)
            }
        }
        .frame(width: 72, height: 72)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
