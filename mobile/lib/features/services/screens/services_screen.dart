import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/services/oauth_service.dart';
import '../../../core/services/service_connection_service.dart';
import '../../auth/data/auth_repository.dart';

/// Écran de gestion des connexions aux services
class ServicesScreen extends StatefulWidget {
  const ServicesScreen({super.key});

  @override
  State<ServicesScreen> createState() => _ServicesScreenState();
}

class _ServicesScreenState extends State<ServicesScreen> {
  final OAuthService _oauthService = OAuthService();
  final ServiceConnectionService _connectionService = ServiceConnectionService();
  final Map<OAuthProvider, bool> _connectedServices = {};
  final Map<OAuthProvider, bool> _loadingServices = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadConnectedServices();
  }

  Future<void> _loadConnectedServices() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final authRepo = context.read<AuthRepository>();
      final token = await authRepo.getToken();

      if (token == null) {
        // Pas de token, tous déconnectés
        for (var provider in OAuthService.availableProviders) {
          _connectedServices[provider] = false;
        }
      } else {
        // Vérifier chaque service
        for (var provider in OAuthService.availableProviders) {
          final serviceName = provider.name; // discord, github, etc.
          final isConnected = await _connectionService.isServiceConnected(
            serviceName: serviceName,
            token: token,
          );
          _connectedServices[provider] = isConnected;
        }
      }
    } catch (e) {
      print('Erreur lors du chargement des services: $e');
      // En cas d'erreur, tous déconnectés
      for (var provider in OAuthService.availableProviders) {
        _connectedServices[provider] = false;
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _connectService(OAuthProvider provider) async {
    setState(() {
      _loadingServices[provider] = true;
    });

    try {
      final authRepo = context.read<AuthRepository>();
      final token = await authRepo.getToken();

      if (token == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Vous devez être connecté'),
              backgroundColor: Colors.red,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
        return;
      }

      final result = await _oauthService.connectService(provider.name, userToken: token);

      if (result.isSuccess || result.isPending) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Connexion à ${provider.displayName} en cours...'),
              backgroundColor: Colors.blue,
              behavior: SnackBarBehavior.floating,
            ),
          );

          // Attendre un peu puis recharger la liste
          await Future.delayed(const Duration(seconds: 3));
          _loadConnectedServices();
        }
      } else if (result.error != null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result.error!),
              backgroundColor: Colors.red,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    } finally {
      if (mounted) {
        setState(() {
          _loadingServices[provider] = false;
        });
      }
    }
  }

  Future<void> _disconnectService(OAuthProvider provider) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Déconnecter le service'),
        content: Text(
          'Êtes-vous sûr de vouloir déconnecter ${provider.displayName} ?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Déconnecter'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      // TODO: Implémenter la déconnexion via API
      setState(() {
        _connectedServices[provider] = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${provider.displayName} déconnecté'),
            backgroundColor: Colors.orange,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: SafeArea(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : CustomScrollView(
                slivers: [
                  // Header
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Services connectés',
                            style: TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Gérez vos connexions aux différents services',
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Liste des services
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final provider = OAuthService.availableProviders[index];
                          final isConnected = _connectedServices[provider] ?? false;
                          final isLoading = _loadingServices[provider] ?? false;

                          return Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: _buildServiceCard(
                              provider,
                              isConnected,
                              isLoading,
                            ),
                          );
                        },
                        childCount: OAuthService.availableProviders.length,
                      ),
                    ),
                  ),

                  const SliverPadding(padding: EdgeInsets.only(bottom: 24)),
                ],
              ),
      ),
    );
  }

  Widget _buildServiceCard(
    OAuthProvider provider,
    bool isConnected,
    bool isLoading,
  ) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.white,
            Colors.grey[50]!,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(
          color: isConnected
              ? Color(provider.color).withValues(alpha: 0.3)
              : Colors.grey.withValues(alpha: 0.2),
          width: 1.5,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            // Icône du service
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Color(provider.color),
                    Color(provider.color).withValues(alpha: 0.8),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Color(provider.color).withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Center(
                child: _getProviderIcon(provider),
              ),
            ),
            const SizedBox(width: 16),

            // Nom et statut
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    provider.displayName,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),

            // Bouton action
            if (isLoading)
              const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            else
              SizedBox(
                width: 110,
                child: ElevatedButton(
                  onPressed: isConnected
                      ? () => _disconnectService(provider)
                      : () => _connectService(provider),
                  style: ElevatedButton.styleFrom(
                    backgroundColor:
                        isConnected ? Colors.red[400] : Color(provider.color),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: Text(
                    isConnected ? 'Déconnecter' : 'Connecter',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _getProviderIcon(OAuthProvider provider) {
    IconData icon;

    switch (provider) {
      case OAuthProvider.google:
        icon = Icons.g_mobiledata;
        break;
      case OAuthProvider.gmail:
        icon = Icons.email_rounded;
        break;
      case OAuthProvider.github:
        icon = Icons.code;
        break;
      case OAuthProvider.gitlab:
        icon = Icons.source;
        break;
      case OAuthProvider.discord:
        icon = Icons.discord;
        break;
      case OAuthProvider.dropbox:
        icon = Icons.cloud;
        break;
    }

    return Icon(icon, size: 28, color: Colors.white);
  }
}
