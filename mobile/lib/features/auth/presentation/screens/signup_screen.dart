import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:formz/formz.dart';

import '../signup_provider.dart';
import '../../../../core/constants/app_routes.dart';
import '../../../../shared/widgets/custom_text_field.dart';
import '../../../../shared/widgets/loading_overlay.dart';
import '../../../../shared/widgets/gradient_background.dart';
import '../../../../shared/transitions/page_transitions.dart';
import '../../../../shared/models/email.dart';
import '../../../../shared/models/password.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/oauth_button.dart';

/// Écran d'inscription
class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = MediaQuery.of(context).size;

    return ChangeNotifierProvider(
      create: (context) => SignUpProvider(
        authRepository: context.read(),
      ),
      child: Scaffold(
        backgroundColor: AppTheme.lightGrey,
        body: GradientBackground(
          child: Consumer<SignUpProvider>(
          builder: (context, signUpProvider, child) {
            return LoadingOverlay(
              isLoading: signUpProvider.status == FormzSubmissionStatus.inProgress,
              loadingText: 'Création de votre compte...',
              child: SafeArea(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: Container(
                    constraints: BoxConstraints(
                      minHeight: size.height - MediaQuery.of(context).padding.top,
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24.0),
                      child: Column(
                        children: [
                          // Bouton retour flottant
                          _buildFloatingBackButton(context),

                          // Contenu principal dans une carte
                          _buildMainCard(signUpProvider, theme, size),

                          const SizedBox(height: 24),
                        ],
                      ),
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

  Widget _buildFloatingBackButton(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 60,
      alignment: Alignment.centerLeft,
      child: Container(
        decoration: BoxDecoration(
          color: AppTheme.white.withValues(alpha: 0.9),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: AppTheme.darkGrey.withValues(alpha: 0.1),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () => context.go(AppRoutes.login),
            child: const Padding(
              padding: EdgeInsets.all(12),
              child: Icon(
                Icons.arrow_back_ios_rounded,
                color: AppTheme.darkGrey,
                size: 24,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMainCard(SignUpProvider signUpProvider, ThemeData theme, Size size) {
    return Container(
      margin: const EdgeInsets.only(top: 20),
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppTheme.white,
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: AppTheme.darkGrey.withValues(alpha: 0.08),
            blurRadius: 30,
            offset: const Offset(0, 10),
          ),
          BoxShadow(
            color: AppTheme.lightGreen.withValues(alpha: 0.1),
            blurRadius: 20,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              SlideInAnimation(
                delay: const Duration(milliseconds: 100),
                child: _buildHeader(theme),
              ),
              const SizedBox(height: 40),

              SlideInAnimation(
                delay: const Duration(milliseconds: 300),
                child: _buildForm(signUpProvider),
              ),
              const SizedBox(height: 24),

              if (signUpProvider.errorMessage != null)
                SlideInAnimation(
                  delay: const Duration(milliseconds: 400),
                  child: _buildErrorMessage(signUpProvider.errorMessage!),
                ),

              SlideInAnimation(
                delay: const Duration(milliseconds: 500),
                child: _buildSignUpButton(signUpProvider),
              ),
              const SizedBox(height: 32),

              // Séparateur "OU"
              SlideInAnimation(
                delay: const Duration(milliseconds: 600),
                child: _buildOrDivider(),
              ),
              const SizedBox(height: 24),

              // Boutons OAuth
              SlideInAnimation(
                delay: const Duration(milliseconds: 700),
                child: CompactOAuthButtons(
                  onProviderSelected: (provider) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Inscription avec ${provider.displayName} en cours...'),
                        duration: const Duration(seconds: 2),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 32),

              SlideInAnimation(
                delay: const Duration(milliseconds: 800),
                child: _buildDivider(),
              ),
              const SizedBox(height: 24),

              SlideInAnimation(
                delay: const Duration(milliseconds: 900),
                child: _buildSignInLink(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(ThemeData theme) {
    return Column(
      children: [
        Image.asset(
          'assets/images/robot_regisster.gif',
          width: 200,
          height: 200,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppTheme.lightGreen.withValues(alpha: 0.2),
                    AppTheme.mediumGreen.withValues(alpha: 0.1),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(30),
              ),
              child: Container(
                margin: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.mediumGreen,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.mediumGreen.withValues(alpha: 0.3),
                      blurRadius: 15,
                      offset: const Offset(0, 5),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.person_add_rounded,
                  size: 40,
                  color: AppTheme.white,
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 24),
        Text(
          'Rejoignez-nous pour commencer votre expérience',
          textAlign: TextAlign.center,
          style: theme.textTheme.bodyLarge?.copyWith(
            color: AppTheme.mediumGrey,
            fontSize: 16,
            height: 1.4,
          ),
        ),
      ],
    );
  }

  Widget _buildForm(SignUpProvider signUpProvider) {
    return Column(
      children: [
        _buildAnimatedTextField(
          controller: _firstNameController,
          label: 'Prénom',
          hint: 'Votre prénom',
          prefixIcon: Icons.person_outlined,
          onChanged: signUpProvider.firstNameChanged,
          errorText: signUpProvider.firstNameTouched && signUpProvider.firstName.isEmpty
              ? 'Le prénom est requis'
              : null,
        ),
        const SizedBox(height: 20),
        _buildAnimatedTextField(
          controller: _lastNameController,
          label: 'Nom',
          hint: 'Votre nom de famille',
          prefixIcon: Icons.person_outlined,
          onChanged: signUpProvider.lastNameChanged,
          errorText: signUpProvider.lastNameTouched && signUpProvider.lastName.isEmpty
              ? 'Le nom est requis'
              : null,
        ),
        const SizedBox(height: 20),
        _buildAnimatedTextField(
          controller: _emailController,
          label: 'Email',
          hint: 'votre@email.com',
          keyboardType: TextInputType.emailAddress,
          prefixIcon: Icons.email_outlined,
          onChanged: signUpProvider.emailChanged,
          errorText: signUpProvider.emailTouched && signUpProvider.email.isNotValid
              ? signUpProvider.email.error?.message
              : null,
        ),
        const SizedBox(height: 20),
        _buildAnimatedTextField(
          controller: _passwordController,
          label: 'Mot de passe',
          hint: '********',
          obscureText: _obscurePassword,
          prefixIcon: Icons.lock_outlined,
          suffixIcon: _buildPasswordToggle(_obscurePassword, () {
            setState(() {
              _obscurePassword = !_obscurePassword;
            });
          }),
          onChanged: signUpProvider.passwordChanged,
          errorText: signUpProvider.passwordTouched && signUpProvider.password.isNotValid
              ? signUpProvider.password.error?.message
              : null,
        ),
        const SizedBox(height: 20),
        _buildAnimatedTextField(
          controller: _confirmPasswordController,
          label: 'Confirmer le mot de passe',
          hint: '********',
          obscureText: _obscureConfirmPassword,
          prefixIcon: Icons.lock_outlined,
          suffixIcon: _buildPasswordToggle(_obscureConfirmPassword, () {
            setState(() {
              _obscureConfirmPassword = !_obscureConfirmPassword;
            });
          }),
          onChanged: signUpProvider.confirmPasswordChanged,
          errorText: signUpProvider.confirmPasswordTouched
              ? (signUpProvider.confirmPassword.isNotValid
                  ? signUpProvider.confirmPassword.error?.message
                  : !signUpProvider.passwordsMatch && _confirmPasswordController.text.isNotEmpty
                      ? 'Les mots de passe ne correspondent pas'
                      : null)
              : null,
        ),
      ],
    );
  }

  Widget _buildAnimatedTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData prefixIcon,
    TextInputType? keyboardType,
    bool obscureText = false,
    Widget? suffixIcon,
    required ValueChanged<String>? onChanged,
    String? errorText,
  }) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppTheme.lightGreen.withValues(alpha: 0.08),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: CustomTextField(
        controller: controller,
        label: label,
        hint: hint,
        keyboardType: keyboardType,
        prefixIcon: prefixIcon,
        suffixIcon: suffixIcon,
        obscureText: obscureText,
        onChanged: onChanged,
        errorText: errorText,
      ),
    );
  }

  Widget _buildPasswordToggle(bool isObscured, VoidCallback onPressed) {
    return Container(
      margin: const EdgeInsets.only(right: 4),
      child: IconButton(
        icon: AnimatedSwitcher(
          duration: const Duration(milliseconds: 200),
          child: Icon(
            isObscured ? Icons.visibility_outlined : Icons.visibility_off_outlined,
            key: ValueKey(isObscured),
            color: AppTheme.mediumGreen,
            size: 22,
          ),
        ),
        onPressed: onPressed,
      ),
    );
  }

  Widget _buildErrorMessage(String message) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.red.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.red.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: Colors.red.shade100,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              Icons.error_outline_rounded,
              color: Colors.red.shade600,
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                color: Colors.red.shade700,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSignUpButton(SignUpProvider signUpProvider) {
    final isValid = signUpProvider.isValid;
    final isLoading = signUpProvider.status == FormzSubmissionStatus.inProgress;

    return Container(
      width: double.infinity,
      height: 56,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: isValid
            ? LinearGradient(
                colors: [
                  AppTheme.mediumGreen,
                  AppTheme.darkGreen,
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              )
            : null,
        color: isValid ? null : AppTheme.mediumGrey.withValues(alpha: 0.3),
        boxShadow: isValid
            ? [
                BoxShadow(
                  color: AppTheme.mediumGreen.withValues(alpha: 0.4),
                  blurRadius: 15,
                  offset: const Offset(0, 5),
                ),
              ]
            : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: isValid && !isLoading
              ? () async {
                  await signUpProvider.signUpWithCredentials();
                  if (signUpProvider.status == FormzSubmissionStatus.success) {
                    if (mounted) {
                      context.go(AppRoutes.dashboard);
                    }
                  }
                }
              : null,
          child: Container(
            alignment: Alignment.center,
            child: isLoading
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(AppTheme.white),
                    ),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.person_add_rounded,
                        color: isValid ? AppTheme.white : AppTheme.mediumGrey,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Créer mon compte',
                        style: TextStyle(
                          color: isValid ? AppTheme.white : AppTheme.mediumGrey,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildDivider() {
    return Row(
      children: [
        Expanded(
          child: Container(
            height: 1,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.transparent,
                  AppTheme.mediumGrey.withValues(alpha: 0.3),
                  Colors.transparent,
                ],
              ),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'ou',
            style: TextStyle(
              color: AppTheme.mediumGrey,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Expanded(
          child: Container(
            height: 1,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.transparent,
                  AppTheme.mediumGrey.withValues(alpha: 0.3),
                  Colors.transparent,
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSignInLink() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.lightGrey.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppTheme.mediumGrey.withValues(alpha: 0.2),
        ),
      ),
      child: Wrap(
        alignment: WrapAlignment.center,
        crossAxisAlignment: WrapCrossAlignment.center,
        spacing: 4,
        children: [
          Text(
            'Déjà un compte ?',
            style: TextStyle(
              color: AppTheme.darkGrey,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          GestureDetector(
            onTap: () => context.go(AppRoutes.login),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'Se connecter',
                style: TextStyle(
                  color: AppTheme.mediumGreen,
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrDivider() {
    return Row(
      children: [
        const Expanded(child: Divider()),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'OU',
            style: TextStyle(
              color: AppTheme.mediumGrey,
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
        ),
        const Expanded(child: Divider()),
      ],
    );
  }
}
