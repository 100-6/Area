import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:formz/formz.dart';

import '../login_provider.dart';
import '../auth_provider.dart';
import '../../../../core/constants/app_routes.dart';
import '../../../../shared/widgets/custom_text_field.dart';
import '../../../../shared/widgets/loading_overlay.dart';
import '../../../../shared/widgets/gradient_background.dart';
import '../../../../shared/models/email.dart';
import '../../../../shared/models/password.dart';

/// Écran de connexion
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final authProvider = context.read<AuthProvider>();
    
    return ChangeNotifierProvider(
      create: (context) => LoginProvider(
        authRepository: context.read(),
      ),
        child: Scaffold(
        body: GradientBackground(
          child: Consumer<LoginProvider>(
          builder: (context, loginProvider, child) {
            return LoadingOverlay(
              isLoading: loginProvider.status == FormzSubmissionStatus.inProgress,
              child: SafeArea(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24.0),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const SizedBox(height: 32),
                        // En-tête
                        _buildHeader(theme),
                        const SizedBox(height: 48),
                        
                        // Formulaire
                        _buildForm(loginProvider),
                        const SizedBox(height: 24),
                        
                        // Message d'erreur
                        if (loginProvider.errorMessage != null)
                          _buildErrorMessage(loginProvider.errorMessage!),
                        
                        // Bouton de connexion
                        _buildSignInButton(loginProvider),
                        const SizedBox(height: 16),
                        
                        // Lien vers inscription
                        _buildSignUpLink(),
                        const SizedBox(height: 32),
                        
                        // Comptes de démonstration
                        _buildDemoAccounts(authProvider),
                        
                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(ThemeData theme) {
    return Column(
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: theme.colorScheme.primary.withOpacity(0.2),
                blurRadius: 15,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: Image.asset(
              'assets/images/logo.png',
              width: 80,
              height: 80,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Icon(
                  Icons.lock_person_rounded,
                  size: 40,
                  color: theme.colorScheme.primary,
                );
              },
            ),
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'Connexion',
          style: theme.textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Connectez-vous à votre compte',
          style: theme.textTheme.bodyLarge?.copyWith(
            color: Colors.grey.shade600,
          ),
        ),
      ],
    );
  }

  Widget _buildForm(LoginProvider loginProvider) {
    return Column(
      children: [
        CustomTextField(
          controller: _emailController,
          label: 'Email',
          hint: 'Entrez votre email',
          keyboardType: TextInputType.emailAddress,
          prefixIcon: Icons.email_outlined,
          onChanged: loginProvider.emailChanged,
          errorText: loginProvider.email.isNotValid
              ? loginProvider.email.error?.message
              : null,
        ),
        const SizedBox(height: 16),
        CustomTextField(
          controller: _passwordController,
          label: 'Mot de passe',
          hint: 'Entrez votre mot de passe',
          obscureText: _obscurePassword,
          prefixIcon: Icons.lock_outlined,
          suffixIcon: IconButton(
            icon: Icon(
              _obscurePassword ? Icons.visibility : Icons.visibility_off,
            ),
            onPressed: () {
              setState(() {
                _obscurePassword = !_obscurePassword;
              });
            },
          ),
          onChanged: loginProvider.passwordChanged,
          errorText: loginProvider.password.isNotValid
              ? loginProvider.password.error?.message
              : null,
        ),
      ],
    );
  }

  Widget _buildErrorMessage(String message) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline, color: Colors.red.shade600, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: Colors.red.shade600),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSignInButton(LoginProvider loginProvider) {
    return ElevatedButton(
      onPressed: loginProvider.isValid
          ? () async {
              await loginProvider.signInWithCredentials();
              if (loginProvider.status == FormzSubmissionStatus.success) {
                if (mounted) {
                  context.go(AppRoutes.home);
                }
              }
            }
          : null,
      child: const Text('Se connecter'),
    );
  }

  Widget _buildSignUpLink() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Text('Pas encore de compte ? '),
        TextButton(
          onPressed: () => context.go(AppRoutes.signUp),
          child: const Text('S\'inscrire'),
        ),
      ],
    );
  }

  Widget _buildDemoAccounts(AuthProvider authProvider) {
    final mockCredentials = authProvider.getMockCredentials();
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.info_outline, color: Colors.blue.shade600, size: 20),
                const SizedBox(width: 8),
                const Text(
                  'Comptes de démonstration',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ...mockCredentials.entries.map((entry) {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${entry.key} / ${entry.value}',
                        style: const TextStyle(
                          fontFamily: 'monospace',
                          fontSize: 12,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.copy, size: 16),
                      onPressed: () {
                        _emailController.text = entry.key;
                        _passwordController.text = entry.value;
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Identifiants copiés'),
                            duration: Duration(seconds: 2),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              );
            }).toList(),
          ],
        ),
      ),
    );
  }
}
