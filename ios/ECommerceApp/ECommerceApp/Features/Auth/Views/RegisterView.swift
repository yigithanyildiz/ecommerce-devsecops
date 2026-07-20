import SwiftUI

struct RegisterView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = RegisterViewModel()
    @State private var showSuccessAlert = false
    var body: some View {
        Form {
            Section {
                TextField("Ad Soyad", text: $viewModel.name)

                TextField("E-posta", text: $viewModel.email)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()

                SecureField("Şifre", text: $viewModel.password)
            }

            if let errorMessage = viewModel.errorMessage {
                Section {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                }
            }

            Section {
                Button {
                    Task {
                        await viewModel.register()
                    }
                } label: {
                    if viewModel.isLoading {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                    } else {
                        Text("Kayıt Ol")
                            .frame(maxWidth: .infinity)
                    }
                }
                .disabled(!viewModel.canSubmit)
            }
        }
        .navigationTitle("Kayıt Ol")
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
}
