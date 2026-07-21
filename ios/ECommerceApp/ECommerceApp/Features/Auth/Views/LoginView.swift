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
                Section ("Hesap Bilgileri"){
                    TextField("E-posta", text: $viewModel.email)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()

                    SecureField("Şifre", text: $viewModel.password)
                }

                if let errorMessage = viewModel.errorMessage {
                    Section {
                        Text(errorMessage)
                            .font(.footnote)
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
                                .fontWeight(.semibold)
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .disabled(!viewModel.canSubmit)
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                }
                Section {
                    NavigationLink {
                        RegisterView()
                    } label: {
                        Label("Yeni hesap oluştur", systemImage: "person.badge.plus")
                            .frame(maxWidth: .infinity)
                    }
                }
            }
            .navigationTitle("Giriş")
        }
    }
}
