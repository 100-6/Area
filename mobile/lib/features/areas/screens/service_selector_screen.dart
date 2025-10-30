import 'package:flutter/material.dart';
import '../../../core/constants/service_constants.dart';
import '../models/service_info.dart';
import '../services/area_service.dart';
import 'service_actions_screen.dart';

class ServiceSelectorScreen extends StatefulWidget {
  final String nodeType; // 'trigger' or 'action'

  const ServiceSelectorScreen({super.key, required this.nodeType});

  @override
  State<ServiceSelectorScreen> createState() => _ServiceSelectorScreenState();
}

class _ServiceSelectorScreenState extends State<ServiceSelectorScreen> {
  final AreaService _areaService = AreaService();
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
      
      // Trier les services par ordre alphabétique
      services.sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
      
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
      backgroundColor: const Color(0xFFF8F9FA),
      body: Column(
        children: [
          _buildModernHeader(context),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildModernHeader(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(20, MediaQuery.of(context).padding.top + 12, 20, 24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF48C774), Color(0xFF166534)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(40),
          bottomRight: Radius.circular(40),
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF48C774).withOpacity(0.3),
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
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      widget.nodeType == 'trigger' ? Icons.flash_on_rounded : Icons.check_circle_rounded,
                      color: Colors.white,
                      size: 18,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      widget.nodeType == 'trigger' ? 'DÉCLENCHEUR' : 'ACTION',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        letterSpacing: 1,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            widget.nodeType == 'trigger' ? 'Choisir un\nDéclencheur' : 'Choisir une\nAction',
            style: const TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.w900,
              color: Colors.white,
              height: 1.1,
              letterSpacing: -1,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(
              strokeWidth: 3,
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF4CAF50)),
            ),
            const SizedBox(height: 20),
            Text(
              'Chargement des services...',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.red[50],
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.error_outline_rounded,
                  size: 64,
                  color: Colors.red[400],
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Erreur',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[800],
                ),
              ),
              const SizedBox(height: 12),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 32),
              ElevatedButton.icon(
                onPressed: _loadServices,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text(
                  'Réessayer',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4CAF50),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_services.isEmpty) {
      return Center(
        child: Text(
          'Aucun service disponible',
          style: TextStyle(
            fontSize: 16,
            color: Colors.grey[600],
          ),
        ),
      );
    }

    // Filtrer les services qui ont au moins une action/trigger
    final validServices = _services.where((service) {
      final items = widget.nodeType == 'trigger'
          ? service.actions
          : service.reactions;
      return items.isNotEmpty;
    }).toList();

    return GridView.builder(
      padding: const EdgeInsets.all(20),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 0.85,
      ),
      itemCount: validServices.length,
      itemBuilder: (context, index) {
        final service = validServices[index];
        final items = widget.nodeType == 'trigger'
            ? service.actions
            : service.reactions;

        return _buildServiceCard(service, items);
      },
    );
  }

  Widget _buildServiceCard(ServiceInfo service, List<dynamic> items) {
    // Utiliser la couleur du backend si disponible, sinon fallback
    final serviceColor = service.color != null
        ? _parseColor(service.color!)
        : _getServiceColor(service.name);
    
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: serviceColor.withOpacity(0.15),
            blurRadius: 20,
            offset: const Offset(0, 8),
            spreadRadius: -2,
          ),
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
        border: Border.all(
          color: serviceColor.withOpacity(0.2),
          width: 2,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            _navigateToServiceActions(service, items);
          },
          borderRadius: BorderRadius.circular(24),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Grande icône du service
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        serviceColor,
                        serviceColor.withOpacity(0.7),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: serviceColor.withOpacity(0.4),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: _buildServiceIcon(service),
                ),
                const SizedBox(height: 12),
                // Nom du service
                Text(
                  service.name.toUpperCase(),
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.2,
                    color: serviceColor,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 10),
                // Badge nombre d'items
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: serviceColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: serviceColor.withOpacity(0.3),
                      width: 1.5,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        widget.nodeType == 'trigger' 
                          ? Icons.flash_on_rounded 
                          : Icons.play_arrow_rounded,
                        size: 14,
                        color: serviceColor,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${items.length}',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: serviceColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _navigateToServiceActions(ServiceInfo service, List<dynamic> items) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ServiceActionsScreen(
          service: service,
          items: items,
          nodeType: widget.nodeType,
        ),
      ),
    ).then((result) {
      if (result != null) {
        Navigator.pop(context, result);
      }
    });
  }


  /// Parse une couleur hex (#RRGGBB) en Color
  Color _parseColor(String hexColor) {
    try {
      final hex = hexColor.replaceAll('#', '');
      if (hex.length == 6) {
        return Color(int.parse('FF$hex', radix: 16));
      }
      return const Color(0xFF2196F3); // Bleu par défaut
    } catch (e) {
      return const Color(0xFF2196F3); // Bleu par défaut en cas d'erreur
    }
  }

  Color _getServiceColor(String serviceName) {
    return ServiceConstants.getServiceColor(serviceName);
  }

  IconData _getServiceIcon(String serviceName) {
    return ServiceConstants.getServiceIcon(serviceName);
  }

  /// Construit l'icône/logo du service
  Widget _buildServiceIcon(ServiceInfo service) {
    // Essayer d'abord avec l'iconUrl du backend
    final backendIconUrl = service.iconUrl;

    // Si pas d'iconUrl du backend, utiliser les URLs hardcodées
    final iconUrl = backendIconUrl ?? ServiceConstants.getServiceIconUrl(service.name);

    if (iconUrl != null && iconUrl.isNotEmpty) {
      return Padding(
        padding: const EdgeInsets.all(12.0),
        child: Image.network(
          iconUrl,
          width: 28,
          height: 28,
          fit: BoxFit.contain,
          color: Colors.white,
          colorBlendMode: BlendMode.srcIn,
          errorBuilder: (context, error, stackTrace) {
            // Fallback sur l'icône Material en cas d'erreur
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

}

