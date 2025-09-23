import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:formz/formz.dart';

import '../signup_provider.dart';
import '../../../../core/constants/app_routes.dart';
import '../../../../shared/widgets/custom_text_field.dart';
import '../../../../shared/widgets/loading_overlay.dart';
import '../../../../shared/widgets/gradient_background.dart';
import '../../../../shared/models/email.dart';
import '../../../../shared/models/password.dart';

/// Écran d'inscription
class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return ChangeNotifierProvider(
      create: (context) => SignUpProvider(
        authRepository: context.read(),
      ),
      child: Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.go(AppRoutes.login),
          ),
          backgroundColor: Colors.transparent,
          elevation: 0,
        ),
        body: GradientBackground(
          child: Consumer<SignUpProvider>(
          builder: (context, signUpProvider, child) {
            return LoadingOverlay(
              isLoading: signUpProvider.status == FormzSubmissionStatus.inProgress,
              child: SafeArea(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24.0),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // En-tête
                        _buildHeader(theme),
                        const SizedBox(height: 32),
                        
                        // Formulaire
                        _buildForm(signUpProvider),
                        const SizedBox(height: 24),
                        
                        // Message d'erreur
                        if (signUpProvider.errorMessage != null)
                          _buildErrorMessage(signUpProvider.errorMessage!),
                        
                        // Bouton d'inscription
                        _buildSignUpButton(signUpProvider),
                        const SizedBox(height: 16),
                        
                        // Lien vers connexion
                        _buildSignInLink(),
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
                  Icons.person_add_rounded,
                  size: 40,
                  color: theme.colorScheme.primary,
                );
              },
            ),
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'Inscription',
          style: theme.textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Créez votre compte',
          style: theme.textTheme.bodyLarge?.copyWith(
            color: Colors.grey.shade600,
          ),
        ),
      ],
    );
  }

  Widget _buildForm(SignUpProvider signUpProvider) {
    return Column(
      children: [
        CustomTextField(
          controller: _nameController,
          label: 'Nom complet',
          hint: 'Entrez votre nom complet',
          prefixIcon: Icons.person_outlined,
          onChanged: signUpProvider.nameChanged,
          errorText: signUpProvider.name.isEmpty && _nameController.text.isNotEmpty
              ? 'Le nom est requis'
              : null,
        ),
        const SizedBox(height: 16),
        CustomTextField(
          controller: _emailController,
          label: 'Email',
          hint: 'Entrez votre email',
          keyboardType: TextInputType.emailAddress,
          prefixIcon: Icons.email_outlined,
          onChanged: signUpProvider.emailChanged,
          errorText: signUpProvider.email.isNotValid
              ? signUpProvider.email.error?.message
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
          onChanged: signUpProvider.passwordChanged,
          errorText: signUpProvider.password.isNotValid
              ? signUpProvider.password.error?.message
              : null,
        ),
        const SizedBox(height: 16),
        CustomTextField(
          controller: _confirmPasswordController,
          label: 'Confirmer le mot de passe',
          hint: 'Confirmez votre mot de passe',
          obscureText: _obscureConfirmPassword,
          prefixIcon: Icons.lock_outlined,
          suffixIcon: IconButton(
            icon: Icon(
              _obscureConfirmPassword ? Icons.visibility : Icons.visibility_off,
            ),
            onPressed: () {
              setState(() {
                _obscureConfirmPassword = !_obscureConfirmPassword;
              });
            },
          ),
          onChanged: signUpProvider.confirmPasswordChanged,
          errorText: signUpProvider.confirmPassword.isNotValid
              ? signUpProvider.confirmPassword.error?.message
              : !signUpProvider.passwordsMatch && _confirmPasswordController.text.isNotEmpty
                  ? 'Les mots de passe ne correspondent pas'
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

  Widget _buildSignUpButton(SignUpProvider signUpProvider) {
    return ElevatedButton(
      onPressed: signUpProvider.isValid
          ? () async {
              await signUpProvider.signUpWithCredentials();
              if (signUpProvider.status == FormzSubmissionStatus.success) {
                if (mounted) {
                  context.go(AppRoutes.home);
                }
              }
            }
          : null,
      child: const Text('S\'inscrire'),
    );
  }

  Widget _buildSignInLink() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Text('Déjà un compte ? '),
        TextButton(
          onPressed: () => context.go(AppRoutes.login),
          child: const Text('Se connecter'),
        ),
      ],
    );
  }
}
