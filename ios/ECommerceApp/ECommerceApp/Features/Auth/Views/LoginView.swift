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
            Form {
                Section {
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
                            await viewModel.login()
                        }
                    } label: {
                        if viewModel.isLoading {
                            ProgressView()
                                .frame(maxWidth: .infinity)
                        } else {
                            Text("Giriş Yap")
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .disabled(!viewModel.canSubmit)
                }
                Section {
                    NavigationLink {
                        RegisterView()
                    } label: {
                        Text("Hesap oluştur")
                            .frame(maxWidth: .infinity)
                    }
                }
            }
            .navigationTitle("Giriş")
        }
    }
}
