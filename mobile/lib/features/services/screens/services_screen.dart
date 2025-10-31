import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/services/oauth_service.dart';
import '../../../core/services/service_connection_service.dart';
import '../../../core/models/service_provider.dart';
import '../../../core/constants/service_constants.dart';
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
  List<ServiceProvider> _availableServices = [];
  final Map<String, bool> _loadingServices = {};
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
        _availableServices = [];
      } else {
        // Récupérer la liste des services depuis l'API /api/services/connected
        final servicesData = await _connectionService.getConnectedServices(token: token);

        // Construire la liste des ServiceProvider à partir de la réponse API
        // Filtrer uniquement les services qui nécessitent une connexion OAuth2
        _availableServices = servicesData
            .map((data) => ServiceProvider.fromJson(data))
            .where((service) {
              // Ne garder que les services avec authType 'oauth2'
              return service.authType.toLowerCase() == 'oauth2';
            })
            .toList();
      }
    } catch (e) {
      print('Erreur lors du chargement des services: $e');
      _availableServices = [];
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _connectService(ServiceProvider service) async {
    setState(() {
      _loadingServices[service.name] = true;
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

      final result = await _oauthService.connectService(service.name, userToken: token);

      if (result.isSuccess || result.isPending) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Connexion à ${service.displayName} en cours...'),
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
          _loadingServices[service.name] = false;
        });
      }
    }
  }

  Future<void> _disconnectService(ServiceProvider service) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Déconnecter le service'),
        content: Text(
          'Êtes-vous sûr de vouloir déconnecter ${service.displayName} ?',
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
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${service.displayName} déconnecté'),
            backgroundColor: Colors.orange,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }

      // Recharger la liste après déconnexion
      await _loadConnectedServices();
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
                          final service = _availableServices[index];
                          final isLoading = _loadingServices[service.name] ?? false;

                          return Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: _buildServiceCard(
                              service,
                              isLoading,
                            ),
                          );
                        },
                        childCount: _availableServices.length,
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
    ServiceProvider service,
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
          color: service.isConnected
              ? Color(service.color).withValues(alpha: 0.3)
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
                    Color(service.color),
                    Color(service.color).withValues(alpha: 0.8),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Color(service.color).withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Center(
                child: _buildServiceIcon(service),
              ),
            ),
            const SizedBox(width: 16),

            // Nom et statut
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _getDisplayName(service),
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
                  onPressed: service.isConnected
                      ? () => _disconnectService(service)
                      : () => _connectService(service),
                  style: ElevatedButton.styleFrom(
                    backgroundColor:
                        service.isConnected ? Colors.red[400] : Color(service.color),
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
                    service.isConnected ? 'Déconnecter' : 'Connecter',
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

  Widget _buildServiceIcon(ServiceProvider service) {
    // Utiliser prioritairement les URLs hardcodées (meilleures qualité/compatibilité)
    final iconUrl = ServiceConstants.getServiceIconUrl(service.name) ?? service.iconUrl;

    if (iconUrl != null && iconUrl.isNotEmpty) {
      return Padding(
        padding: const EdgeInsets.all(10.0),
        child: Image.network(
          iconUrl,
          width: 24,
          height: 24,
          fit: BoxFit.contain,
          color: Colors.white,
          colorBlendMode: BlendMode.srcIn,
          errorBuilder: (context, error, stackTrace) {
            // Fallback sur l'icône Material en cas d'erreur
            final icon = ServiceConstants.getServiceIcon(service.name);
            return Icon(icon, size: 20, color: Colors.white);
          },
        ),
      );
    }

    // Sinon utiliser l'icône Material du fichier de constantes
    final icon = ServiceConstants.getServiceIcon(service.name);
    return Icon(icon, size: 20, color: Colors.white);
  }

  /// Obtient le nom d'affichage du service (avec personnalisations)
  String _getDisplayName(ServiceProvider service) {
    // Raccourcir "Microsoft Outlook" en "Outlook"
    if (service.displayName.toLowerCase().contains('microsoft outlook')) {
      return 'Outlook';
    }
    return service.displayName;
  }
}
