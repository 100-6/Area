import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../auth/presentation/auth_provider.dart';
import '../../../shared/widgets/gradient_background.dart';
import '../../../core/theme/app_theme.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        final user = authProvider.user;

        return Scaffold(
          body: GradientBackground(
            child: SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  children: [
                    const SizedBox(height: 16),
                    _buildProfileHeader(context, authProvider, user.fullName, user.email),
                    const SizedBox(height: 32),
                    _buildProfileInfo(user),
                    const SizedBox(height: 32),
                    _buildAccountActions(context, authProvider),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildProfileHeader(BuildContext context, AuthProvider authProvider, String fullName, String email) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF48C774),
            const Color(0xFF166534),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF48C774).withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
            spreadRadius: 0,
          ),
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
            spreadRadius: 0,
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            top: -20,
            right: -20,
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Positioned(
            bottom: -10,
            left: -30,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Positioned(
            top: 20,
            right: 20,
            child: IconButton(
              icon: const Icon(Icons.logout, color: Colors.white, size: 28),
              onPressed: () => _showLogoutDialog(context, authProvider),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(28.0),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.4),
                      width: 2,
                    ),
                  ),
                  child: CircleAvatar(
                    radius: 50,
                    backgroundColor: Colors.white,
                    child: Text(
                      _getInitials(fullName),
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.darkGreen,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  fullName.isNotEmpty ? fullName : 'Utilisateur',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  email,
                  style: const TextStyle(
                    fontSize: 16,
                    color: Colors.white,
                    fontWeight: FontWeight.w400,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileInfo(user) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.person_outline,
                color: AppTheme.darkGreen,
                size: 24,
              ),
              const SizedBox(width: 12),
              const Text(
                'Informations personnelles',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.darkGrey,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _buildInfoRow('Prénom', user.firstName.isNotEmpty ? user.firstName : 'Non défini'),
          const SizedBox(height: 12),
          _buildInfoRow('Nom', user.lastName.isNotEmpty ? user.lastName : 'Non défini'),
          const SizedBox(height: 12),
          _buildInfoRow('Email', user.email.isNotEmpty ? user.email : 'Non défini'),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color.fromARGB(15, 165, 182, 173),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              color: AppTheme.darkGrey,
              fontSize: 14,
            ),
          ),
          const Spacer(),
          Flexible(
            child: Text(
              value,
              style: const TextStyle(
                color: AppTheme.mediumGrey,
                fontSize: 14,
              ),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAccountActions(BuildContext context, AuthProvider authProvider) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color.fromARGB(24, 165, 182, 173),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          _buildActionCard(
            icon: Icons.edit_outlined,
            title: 'Modifier le profil',
            onTap: () => _showEditProfileDialog(context),
          ),
          _buildActionCard(
            icon: Icons.security_outlined,
            title: 'Sécurité',
            onTap: () => _showSecurityDialog(context),
          ),
          _buildActionCard(
            icon: Icons.privacy_tip_outlined,
            title: 'Confidentialité',
            onTap: () => _showPrivacyDialog(context),
          ),
          _buildActionCard(
            icon: Icons.logout_outlined,
            title: 'Déconnexion',
            onTap: () => _showLogoutDialog(context, authProvider),
            isDestructive: true,
          ),
        ],
      ),
    );
  }

  Widget _buildActionCard({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    bool isDestructive = false,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: ElevatedButton(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.white,
          foregroundColor: isDestructive ? Colors.red : AppTheme.darkGreen,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Icon(
                  icon,
                  color: isDestructive ? Colors.red : AppTheme.darkGreen,
                  size: 24,
                ),
                const SizedBox(width: 16),
                Text(
                  title,
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: isDestructive ? Colors.red : AppTheme.darkGrey,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
            Icon(
              Icons.arrow_forward_ios,
              color: isDestructive ? Colors.red : AppTheme.mediumGrey,
              size: 16,
            ),
          ],
        ),
      ),
    );
  }

  String _getInitials(String fullName) {
    if (fullName.isEmpty) return 'U';
    final parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }

  void _showEditProfileDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Modifier le profil'),
        content: const Text('Fonctionnalité de modification du profil à implémenter.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Fermer'),
          ),
        ],
      ),
    );
  }

  void _showSecurityDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sécurité'),
        content: const Text('Paramètres de sécurité à implémenter.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Fermer'),
          ),
        ],
      ),
    );
  }

  void _showPrivacyDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confidentialité'),
        content: const Text('Paramètres de confidentialité à implémenter.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Fermer'),
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog(BuildContext context, AuthProvider authProvider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Déconnexion'),
        content: const Text('Êtes-vous sûr de vouloir vous déconnecter ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              authProvider.signOut();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('Déconnexion'),
          ),
        ],
      ),
    );
  }
}