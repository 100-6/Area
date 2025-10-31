import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/service_info.dart';
import '../widgets/service_connection_dialog.dart';
import '../../../core/services/oauth_service.dart';
import '../../../core/services/service_connection_service.dart';
import '../../../core/constants/service_constants.dart';
import '../../auth/data/auth_repository.dart';

class ServiceActionsScreen extends StatelessWidget {
  final ServiceInfo service;
  final List<dynamic> items;
  final String nodeType;

  const ServiceActionsScreen({
    super.key,
    required this.service,
    required this.items,
    required this.nodeType,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: Column(
        children: [
          _buildHeader(context),
          Expanded(child: _buildItemsList(context)),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    final serviceColor = _getServiceColor(service.name);
    
    return Container(
      padding: EdgeInsets.fromLTRB(20, MediaQuery.of(context).padding.top + 12, 20, 24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            serviceColor,
            serviceColor.withOpacity(0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(40),
          bottomRight: Radius.circular(40),
        ),
        boxShadow: [
          BoxShadow(
            color: serviceColor.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
                  color: Colors.white,
                  padding: EdgeInsets.zero,
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ),
              const Spacer(),
              // Icône du service
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: Colors.white.withOpacity(0.3),
                    width: 2,
                  ),
                ),
                child: _buildServiceIcon(),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            service.name.toUpperCase(),
            style: const TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.w900,
              color: Colors.white,
              height: 1.1,
              letterSpacing: -1,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              '${items.length} ${nodeType == 'trigger' ? 'déclencheur' : 'action'}${items.length > 1 ? 's' : ''}',
              style: const TextStyle(
                fontSize: 14,
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildItemsList(BuildContext context) {
    // Trier les items par ordre alphabétique
    final sortedItems = List.from(items);
    sortedItems.sort((a, b) {
      final nameA = a is ServiceAction ? a.name : (a as ServiceReaction).name;
      final nameB = b is ServiceAction ? b.name : (b as ServiceReaction).name;
      return nameA.toLowerCase().compareTo(nameB.toLowerCase());
    });

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: sortedItems.length,
      itemBuilder: (context, index) {
        final item = sortedItems[index];
        final name = item is ServiceAction ? item.name : (item as ServiceReaction).name;
        final description = item is ServiceAction ? item.description : (item as ServiceReaction).description;

        return _buildItemCard(
          context: context,
          name: name,
          description: description,
          item: item,
          index: index,
        );
      },
    );
  }

  Widget _buildItemCard({
    required BuildContext context,
    required String name,
    required String description,
    required dynamic item,
    required int index,
  }) {
    final serviceColor = _getServiceColor(service.name);
    final connectionService = ServiceConnectionService();
    final oauthService = OAuthService();

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: serviceColor.withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, 6),
            spreadRadius: -2,
          ),
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
        border: Border.all(
          color: serviceColor.withOpacity(0.15),
          width: 1.5,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () async {
            // Vérifier si le service nécessite une connexion OAuth
            if (_requiresOAuthConnection(service.name)) {
              final authRepo = context.read<AuthRepository>();
              final token = await authRepo.getToken();

              if (token == null) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Vous devez être connecté')),
                  );
                }
                return;
              }

              // Vérifier si l'utilisateur est connecté au service
              final isConnected = await connectionService.isServiceConnected(
                serviceName: service.name,
                token: token,
              );

              if (!isConnected && context.mounted) {
                // Afficher le dialogue pour se connecter
                final provider = _getOAuthProvider(service.name);
                if (provider == null) {
                  Navigator.pop(context, {
                    'service': service.name,
                    'name': name,
                    'description': description,
                    'item': item,
                  });
                  return;
                }

                final shouldConnect = await ServiceConnectionDialog.show(
                  context,
                  serviceName: service.name,
                  provider: provider,
                );

                if (shouldConnect == true && context.mounted) {
                  final result = await oauthService.connectService(service.name, userToken: token);

                  if (result.isSuccess || result.isPending) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            'Connexion à ${provider.displayName} en cours...',
                          ),
                          backgroundColor: Colors.blue,
                        ),
                      );
                    }
                    await Future.delayed(const Duration(seconds: 2));
                  } else if (result.error != null && context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(result.error!),
                        backgroundColor: Colors.red,
                      ),
                    );
                    return;
                  }
                } else {
                  return;
                }
              }
            }

            // Continuer avec la sélection
            if (context.mounted) {
              Navigator.pop(context, {
                'service': service.name,
                'name': name,
                'description': description,
                'item': item,
              });
            }
          },
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                // Icône avec gradient du service
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        serviceColor,
                        serviceColor.withOpacity(0.7),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: serviceColor.withOpacity(0.35),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Icon(
                    nodeType == 'trigger'
                        ? Icons.flash_on_rounded
                        : Icons.play_arrow_rounded,
                    color: Colors.white,
                    size: 30,
                  ),
                ),
                const SizedBox(width: 18),
                // Contenu
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Nom avec badge d'index
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: serviceColor.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              '#${index + 1}',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: serviceColor,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              name,
                              style: const TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF1A1A1A),
                                letterSpacing: -0.3,
                              ),
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      // Description
                      Text(
                        description,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                          height: 1.4,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                // Flèche avec style moderne
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: serviceColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    Icons.arrow_forward_rounded,
                    color: serviceColor,
                    size: 20,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Color _getServiceColor(String serviceName) {
    // Utiliser la couleur du backend si disponible, sinon ServiceConstants
    return service.color != null
        ? _parseColor(service.color!)
        : ServiceConstants.getServiceColor(serviceName);
  }

  /// Parse une couleur hex (#RRGGBB) en Color
  Color _parseColor(String hexColor) {
    try {
      final hex = hexColor.replaceAll('#', '');
      if (hex.length == 6) {
        return Color(int.parse('FF$hex', radix: 16));
      }
      return const Color(0xFF2196F3);
    } catch (e) {
      return const Color(0xFF2196F3);
    }
  }

  IconData _getServiceIcon(String serviceName) {
    return ServiceConstants.getServiceIcon(serviceName);
  }

  /// Construit l'icône/logo du service
  Widget _buildServiceIcon() {
    // Essayer d'abord avec l'iconUrl du backend, sinon utiliser les URLs hardcodées
    final iconUrl = service.iconUrl ?? ServiceConstants.getServiceIconUrl(service.name);

    if (iconUrl != null && iconUrl.isNotEmpty) {
      return Padding(
        padding: const EdgeInsets.all(8.0),
        child: Image.network(
          iconUrl,
          width: 28,
          height: 28,
          fit: BoxFit.contain,
          color: Colors.white,
          colorBlendMode: BlendMode.srcIn,
          errorBuilder: (context, error, stackTrace) {
            // Fallback sur icône Material en cas d'erreur
            return Icon(
              _getServiceIcon(service.name),
              size: 24,
              color: Colors.white,
            );
          },
        ),
      );
    }

    // Fallback sur icône Material
    return Icon(
      _getServiceIcon(service.name),
      size: 24,
      color: Colors.white,
    );
  }

  bool _requiresOAuthConnection(String serviceName) {
    final oauthServices = ['discord', 'github', 'gitlab', 'dropbox', 'google', 'gmail'];
    return oauthServices.contains(serviceName.toLowerCase());
  }

  OAuthProvider? _getOAuthProvider(String serviceName) {
    switch (serviceName.toLowerCase()) {
      case 'discord':
        return OAuthProvider.discord;
      case 'github':
        return OAuthProvider.github;
      case 'gitlab':
        return OAuthProvider.gitlab;
      case 'dropbox':
        return OAuthProvider.dropbox;
      case 'gmail':
      case 'google':
        return OAuthProvider.google;
      default:
        return null;
    }
  }
}

