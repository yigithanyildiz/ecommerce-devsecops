import SwiftUI

struct RegisterView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = RegisterViewModel()
    @State private var showSuccessAlert = false
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 28) {
                VStack(alignment: .leading, spacing: 10) {
                    Text("LUXECART")
                        .font(.headline)
                        .fontWeight(.bold)
                        .tracking(3)
                        .foregroundStyle(LuxeTheme.charcoal)

                    Text("Create Account")
                        .font(.system(size: 36, weight: .bold))
                        .foregroundStyle(LuxeTheme.charcoal)

                    Text("Premium alışveriş deneyimini kişisel hale getir.")
                        .font(.subheadline)
                        .foregroundStyle(LuxeTheme.secondaryText)
                }
                .padding(.top, 36)

                VStack(spacing: 14) {
                    luxeTextField(icon: "person", placeholder: "Ad Soyad", text: $viewModel.name)

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
                        await viewModel.register()
                    }
                } label: {
                    if viewModel.isLoading {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                    } else {
                        Text("Kayıt Ol")
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
            }
            .padding(.horizontal, LuxeTheme.horizontalPadding)
            .padding(.bottom, 34)
        }
        .background(LuxeTheme.background)
        .navigationTitle("Kayıt Ol")
        .navigationBarTitleDisplayMode(.inline)
        .onChange(of: viewModel.didRegister) { _, didRegister in
            if didRegister {
                showSuccessAlert = true
            }
        }
        .alert("Kayıt başarılı", isPresented: $showSuccessAlert) {
            Button("Tamam") {
                dismiss()
            }
        } message: {
            Text("Şimdi e-posta ve şifrenle giriş yapabilirsin.")
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
