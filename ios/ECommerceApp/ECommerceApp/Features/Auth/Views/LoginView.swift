import SwiftUI

struct LoginView: View {
    @StateObject private var viewModel: LoginViewModel

    init(sessionManager: SessionManager) {
        _viewModel = StateObject(
            wrappedValue: LoginViewModel(sessionManager: sessionManager)
        )
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 28) {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("LUXECART")
                            .font(.headline)
                            .fontWeight(.bold)
                            .tracking(3)
                            .foregroundStyle(LuxeTheme.charcoal)

                        Text("Welcome Back")
                            .font(.system(size: 36, weight: .bold))
                            .foregroundStyle(LuxeTheme.charcoal)

                        Text("Seçili ürünlere, favorilerine ve siparişlerine kaldığın yerden devam et.")
                            .font(.subheadline)
                            .foregroundStyle(LuxeTheme.secondaryText)
                            .lineSpacing(3)
                    }
                    .padding(.top, 36)

                    VStack(spacing: 14) {
                        luxeTextField(icon: "envelope", placeholder: "E-posta", text: $viewModel.email)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()

                        luxeSecureField(icon: "lock", placeholder: "Şifre", text: $viewModel.password)
                    }
                    .padding(18)
                    .luxeCard()

                    if let errorMessage = viewModel.errorMessage {
                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(LuxeTheme.danger)
                            .padding(.horizontal, 4)
                    }

                    Button {
                        Task {
                            await viewModel.login()
                        }
                    } label: {
                        if viewModel.isLoading {
                            ProgressView()
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 16)
                        } else {
                            Text("Giriş Yap")
                                .font(.headline)
                                .fontWeight(.semibold)
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 16)
                        }
                    }
                    .background(viewModel.canSubmit ? LuxeTheme.charcoal : LuxeTheme.surfaceHigh)
                    .clipShape(Capsule())
                    .disabled(!viewModel.canSubmit)

                    NavigationLink {
                        RegisterView()
                    } label: {
                        HStack {
                            Text("Yeni hesap oluştur")
                            Image(systemName: "arrow.right")
                        }
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundStyle(LuxeTheme.charcoal)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 15)
                        .background(LuxeTheme.surfaceLow)
                        .clipShape(Capsule())
                    }
                }
                .padding(.horizontal, LuxeTheme.horizontalPadding)
                .padding(.bottom, 34)
            }
            .background(LuxeTheme.background)
            .navigationTitle("Giriş")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private func luxeTextField(icon: String, placeholder: String, text: Binding<String>) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(LuxeTheme.secondaryText)
            TextField(placeholder, text: text)
        }
        .padding(14)
        .background(LuxeTheme.surfaceLow)
        .clipShape(RoundedRectangle(cornerRadius: LuxeTheme.controlRadius, style: .continuous))
    }

    private func luxeSecureField(icon: String, placeholder: String, text: Binding<String>) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(LuxeTheme.secondaryText)
            SecureField(placeholder, text: text)
        }
        .padding(14)
        .background(LuxeTheme.surfaceLow)
        .clipShape(RoundedRectangle(cornerRadius: LuxeTheme.controlRadius, style: .continuous))
    }
}
