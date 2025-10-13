import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/service_info.dart';
import '../services/area_service.dart';
import '../widgets/service_connection_dialog.dart';
import '../../../core/services/oauth_service.dart';
import '../../../core/services/service_connection_service.dart';
import '../../auth/data/auth_repository.dart';

class ServiceSelectorScreen extends StatefulWidget {
  final String nodeType; // 'trigger' or 'action'

  const ServiceSelectorScreen({super.key, required this.nodeType});

  @override
  State<ServiceSelectorScreen> createState() => _ServiceSelectorScreenState();
}

class _ServiceSelectorScreenState extends State<ServiceSelectorScreen> {
  final AreaService _areaService = AreaService();
  final ServiceConnectionService _connectionService = ServiceConnectionService();
  final OAuthService _oauthService = OAuthService();
  List<ServiceInfo> _services = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadServices();
  }

  Future<void> _loadServices() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final services = await _areaService.getAvailableServices();
      setState(() {
        _services = services;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: Text(
          widget.nodeType == 'trigger' ? 'Choose a Trigger' : 'Choose an Action',
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text(_error!, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadServices,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_services.isEmpty) {
      return const Center(
        child: Text('No services available'),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _services.length,
      itemBuilder: (context, index) {
        final service = _services[index];
        final items = widget.nodeType == 'trigger'
            ? service.actions
            : service.reactions;

        if (items.isEmpty) return const SizedBox.shrink();

        return _buildServiceSection(service, items);
      },
    );
  }

  Widget _buildServiceSection(
    ServiceInfo service,
    List<dynamic> items,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
          child: Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: _getServiceColor(service.name).withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  _getServiceIcon(service.name),
                  size: 20,
                  color: _getServiceColor(service.name),
                ),
              ),
              const SizedBox(width: 12),
              Text(
                service.name.toUpperCase(),
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        ...items.map((item) {
          final name = item is ServiceAction ? item.name : (item as ServiceReaction).name;
          final description = item is ServiceAction ? item.description : (item as ServiceReaction).description;

          return _buildItemCard(
            service: service,
            name: name,
            description: description,
            item: item,
          );
        }),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildItemCard({
    required ServiceInfo service,
    required String name,
    required String description,
    required dynamic item,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () async {
          // Vérifier si le service nécessite une connexion OAuth
          if (_requiresOAuthConnection(service.name)) {
            final authRepo = context.read<AuthRepository>();
            final token = await authRepo.getToken();

            if (token == null) {
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Vous devez être connecté')),
                );
              }
              return;
            }

            // Vérifier si l'utilisateur est connecté au service
            final isConnected = await _connectionService.isServiceConnected(
              serviceName: service.name,
              token: token,
            );

            if (!isConnected && mounted) {
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

              if (shouldConnect == true && mounted) {
                // Lancer le flux OAuth pour connecter le service (pas pour se connecter à l'app)
                final result = await _oauthService.connectService(service.name);

                if (result.isSuccess || result.isPending) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          'Connexion à ${provider.displayName} en cours...',
                        ),
                        backgroundColor: Colors.blue,
                      ),
                    );
                  }
                  // Attendre un peu puis continuer
                  await Future.delayed(const Duration(seconds: 2));
                } else if (result.error != null && mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(result.error!),
                      backgroundColor: Colors.red,
                    ),
                  );
                  return;
                }
              } else {
                // L'utilisateur a annulé
                return;
              }
            }
          }

          // Continuer avec la sélection
          if (mounted) {
            Navigator.pop(context, {
              'service': service.name,
              'name': name,
              'description': description,
              'item': item,
            });
          }
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: _getServiceColor(service.name).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  widget.nodeType == 'trigger'
                      ? Icons.flash_on
                      : Icons.check_circle,
                  color: widget.nodeType == 'trigger'
                      ? Colors.blue
                      : Colors.green,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      description,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }

  Color _getServiceColor(String serviceName) {
    switch (serviceName.toLowerCase()) {
      case 'timer':
        return Colors.purple;
      case 'console':
        return Colors.orange;
      case 'discord':
        return const Color(0xFF5865F2);
      case 'github':
        return Colors.black;
      case 'gitlab':
        return const Color(0xFFFC6D26);
      case 'dropbox':
        return const Color(0xFF0061FF);
      case 'google':
        return const Color(0xFF4285F4);
      case 'email':
        return Colors.red;
      case 'slack':
        return const Color(0xFF4A154B);
      default:
        return Colors.blue;
    }
  }

  IconData _getServiceIcon(String serviceName) {
    switch (serviceName.toLowerCase()) {
      case 'timer':
        return Icons.schedule;
      case 'console':
        return Icons.code;
      case 'discord':
        return Icons.discord;
      case 'github':
        return Icons.terminal;
      case 'gitlab':
        return Icons.source;
      case 'dropbox':
        return Icons.cloud;
      case 'google':
        return Icons.g_mobiledata;
      case 'email':
        return Icons.email;
      case 'slack':
        return Icons.chat;
      default:
        return Icons.widgets;
    }
  }

  /// Vérifie si un service nécessite une connexion OAuth
  bool _requiresOAuthConnection(String serviceName) {
    final oauthServices = ['discord', 'github', 'gitlab', 'dropbox', 'google'];
    return oauthServices.contains(serviceName.toLowerCase());
  }

  /// Obtient le provider OAuth correspondant au nom du service
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
      case 'google':
        return OAuthProvider.google;
      default:
        return null;
    }
  }
}
