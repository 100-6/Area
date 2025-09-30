import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import '../auth_provider.dart';
import '../../../../core/constants/app_routes.dart';
import '../../../../shared/widgets/custom_text_field.dart';
import '../../../../shared/widgets/loading_overlay.dart';
import '../../../../shared/widgets/gradient_background.dart';
import '../../../../shared/transitions/page_transitions.dart';
import '../../../../shared/widgets/oauth_button.dart';
import '../../../../core/theme/app_theme.dart';

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
  bool _obscurePassword = false;
  bool _isLoading = false;
  DateTime? _lastClickTime;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: GradientBackground(
        child: LoadingOverlay(
              isLoading: _isLoading,
              loadingText: 'Connexion en cours...',
              useRobotGif: true,
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
                        SlideInAnimation(
                          delay: const Duration(milliseconds: 100),
                          child: _buildHeader(theme),
                        ),
                        const SizedBox(height: 32),

                        // Formulaire
                        SlideInAnimation(
                          delay: const Duration(milliseconds: 300),
                          child: _buildForm(),
                        ),
                        const SizedBox(height: 4),

                        // Boutons connexion et inscription côte à côte
                        SlideInAnimation(
                          delay: const Duration(milliseconds: 500),
                          child: _buildActionButtons(),
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
                                  content: Text('Connexion avec ${provider.displayName} en cours...'),
                                  duration: const Duration(seconds: 2),
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
                ),
              ),
            ),
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

  Widget _buildHeader(ThemeData theme) {
    return Column(
      children: [
        Image.asset(
          'assets/images/happy-retro-robot.gif',
          width: 250,
          height: 250,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return Icon(
              Icons.android,
              size: 120,
              color: theme.colorScheme.primary,
            );
          },
        ),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: const Color.fromARGB(255, 0, 0, 0).withOpacity(0.1),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Text(
            'Connectez-vous pour continuer',
            style: theme.textTheme.bodyLarge?.copyWith(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: const Color.fromARGB(94, 0, 0, 0),
            ),
            textAlign: TextAlign.center,
          ),
        ),
      ],
    );
  }

  Widget _buildForm() {
    return Column(
      children: [
        CustomTextField(
          controller: _emailController,
          label: 'Email',
          hint: 'Entrez votre email',
          keyboardType: TextInputType.emailAddress,
          prefixIcon: Icons.email_outlined,
          fillColor: const Color.fromARGB(15, 165, 182, 173), // Même gris clair que la boîte des boutons
          filled: true,
        ),
        const SizedBox(height: 16),
        CustomTextField(
          controller: _passwordController,
          label: 'Mot de passe',
          hint: 'Entrez votre mot de passe',
          obscureText: _obscurePassword,
          prefixIcon: Icons.lock_outlined,
          fillColor: const Color.fromARGB(15, 165, 182, 173), // Même gris clair que la boîte des boutons
          filled: true,
          suffixIcon: IconButton(
            icon: Icon(
              _obscurePassword ? Icons.visibility : Icons.visibility_off,
              color: const Color(0xFF48C774), // Vert moyen
            ),
            onPressed: () {
              setState(() {
                _obscurePassword = !_obscurePassword;
              });
            },
          ),
        ),
      ],
    );
  }


  Widget _buildActionButtons() {
    return Column(
      children: [
        const SizedBox(height: 16),
        // Container vert foncé avec les deux boutons
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color.fromARGB(24, 165, 182, 173), // Vert foncé
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              // Bouton Se connecter à gauche
              Expanded(
                child: ElevatedButton(
                  onPressed: _isLoading
                      ? null
                      : () async {
                    // Debouncing - éviter les clics trop rapprochés
                    final now = DateTime.now();
                    if (_lastClickTime != null &&
                        now.difference(_lastClickTime!).inMilliseconds < 300) {
                      return;
                    }
                    _lastClickTime = now;

                    // Éviter les doubles clics
                    if (_isLoading) return;

                    // Validation simple
                    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Veuillez remplir tous les champs'),
                          backgroundColor: Colors.orange,
                        ),
                      );
                      return;
                    }

                    setState(() {
                      _isLoading = true;
                    });

                    try {
                      final authProvider = context.read<AuthProvider>();
                      final success = await authProvider.signIn(
                        email: _emailController.text.trim(),
                        password: _passwordController.text,
                      );

                      if (success && mounted) {
                        // Navigation immédiate vers dashboard
                        context.go(AppRoutes.dashboard);
                      } else if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Identifiants incorrects'),
                            backgroundColor: Colors.red,
                          ),
                        );
                      }
                    } finally {
                      if (mounted) {
                        setState(() {
                          _isLoading = false;
                        });
                      }
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF166534),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
                    textStyle: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  child: const Text('Se connecter'),
                ),
              ),
              const SizedBox(width: 8),
              // Bouton S'inscrire à droite
              Expanded(
                child: ElevatedButton(
                  onPressed: () => context.go(AppRoutes.signUp),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF48C774), // Vert moyen
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
                    textStyle: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  child: const Text('S\'inscrire'),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

}