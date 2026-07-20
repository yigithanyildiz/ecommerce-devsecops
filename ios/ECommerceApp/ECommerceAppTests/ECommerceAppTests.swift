import Testing
import Foundation
@testable import ECommerceApp

@MainActor
struct ProductListViewModelTests {
    @Test func loadProductsStoresFetchedProducts() async throws {
        let products = [
            makeProduct(
                id: "1",
                name: "Mechanical Keyboard",
                category: makeCategory(name: "Electronics", slug: "electronics")
            )
        ]

        let viewModel = ProductListViewModel(
            productService: MockProductService(result: .success(products))
        )

        await viewModel.loadProducts()

        #expect(viewModel.products.count == 1)
        #expect(viewModel.products.first?.name == "Mechanical Keyboard")
        #expect(viewModel.errorMessage == nil)
    }

    @Test func searchFiltersByNameDescriptionAndCategory() async throws {
        let products = [
            makeProduct(
                id: "1",
                name: "Mechanical Keyboard",
                description: "Compact keyboard",
                category: makeCategory(name: "Electronics", slug: "electronics")
            ),
            makeProduct(
                id: "2",
                name: "Cotton T-Shirt",
                description: "Basic cotton shirt",
                category: makeCategory(name: "Clothing", slug: "clothing")
            )
        ]

        let viewModel = ProductListViewModel(
            productService: MockProductService(result: .success(products))
        )

        await viewModel.loadProducts()

        viewModel.searchText = "shirt"
        #expect(viewModel.filteredProducts.map(\.id) == ["2"])

        viewModel.searchText = "electronics"
        #expect(viewModel.filteredProducts.map(\.id) == ["1"])
    }

    @Test func categoryFilterNarrowsProducts() async throws {
        let products = [
            makeProduct(
                id: "1",
                name: "Mechanical Keyboard",
                category: makeCategory(name: "Electronics", slug: "electronics")
            ),
            makeProduct(
                id: "2",
                name: "Cotton T-Shirt",
                category: makeCategory(name: "Clothing", slug: "clothing")
            )
        ]

        let viewModel = ProductListViewModel(
            productService: MockProductService(result: .success(products))
        )

        await viewModel.loadProducts()

        viewModel.selectedCategorySlug = "clothing"

        #expect(viewModel.filteredProducts.map(\.id) == ["2"])
    }

    @Test func loadProductsStoresErrorMessageWhenServiceFails() async throws {
        let viewModel = ProductListViewModel(
            productService: MockProductService(result: .failure(APIError.requestFailed(500)))
        )

        await viewModel.loadProducts()

        #expect(viewModel.products.isEmpty)
        #expect(viewModel.errorMessage != nil)
    }
}
@MainActor
struct LoginViewModelTests {
    @Test func canSubmitRequiresEmailPasswordAndNotLoading() {
        let sessionManager = SessionManager()
        let viewModel = LoginViewModel(
            authService: MockAuthService(),
            sessionManager: sessionManager
        )

        #expect(viewModel.canSubmit == false)

        viewModel.email = "test@example.com"
        viewModel.password = "Password123"

        #expect(viewModel.canSubmit == true)
    }

    @Test func successfulLoginSavesSession() async throws {
        let user = AuthUser(
            id: "user-1",
            name: "Test User",
            email: "test@example.com",
            role: "USER"
        )

        let sessionManager = SessionManager()
        sessionManager.signOut()

        let viewModel = LoginViewModel(
            authService: MockAuthService(
                loginResult: .success(
                    LoginResponse(
                        accessToken: "token-123",
                        user: user
                    )
                )
            ),
            sessionManager: sessionManager
        )

        viewModel.email = "test@example.com"
        viewModel.password = "Password123"

        await viewModel.login()

        #expect(sessionManager.accessToken == "token-123")
        #expect(sessionManager.currentUser?.email == "test@example.com")
        #expect(viewModel.errorMessage == nil)
    }

    @Test func failedLoginStoresErrorMessage() async throws {
        let sessionManager = SessionManager()
        sessionManager.signOut()

        let viewModel = LoginViewModel(
            authService: MockAuthService(
                loginResult: .failure(APIError.requestFailed(401))
            ),
            sessionManager: sessionManager
        )

        viewModel.email = "wrong@example.com"
        viewModel.password = "bad-password"

        await viewModel.login()

        #expect(sessionManager.accessToken == nil)
        #expect(viewModel.errorMessage != nil)
    }
}

private struct MockProductService: ProductServicing {
    let result: Result<[Product], Error>

    func fetchProducts() async throws -> [Product] {
        try result.get()
    }
}
private struct MockAuthService: AuthServicing {
    var loginResult: Result<LoginResponse, Error> = .failure(APIError.unknown)
    var registerResult: Result<RegisterResponse, Error> = .failure(APIError.unknown)

    func login(email: String, password: String) async throws -> LoginResponse {
        try loginResult.get()
    }

    func register(name: String, email: String, password: String) async throws -> RegisterResponse {
        try registerResult.get()
    }
}
private func makeProduct(
    id: String,
    name: String,
    description: String? = nil,
    price: String = "10.00",
    stock: Int = 5,
    category: ProductCategory? = nil
) -> Product {
    Product(
        id: id,
        name: name,
        slug: name.lowercased().replacingOccurrences(of: " ", with: "-"),
        description: description,
        price: price,
        stock: stock,
        imageUrl: nil,
        category: category
    )
}

private func makeCategory(name: String, slug: String) -> ProductCategory {
    ProductCategory(
        id: slug,
        name: name,
        slug: slug
    )
}
