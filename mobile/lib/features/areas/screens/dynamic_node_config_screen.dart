import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/module_config_service.dart';
import '../widgets/dynamic_config_form.dart';
import '../models/config_schema.dart';
import '../../auth/data/auth_repository.dart';

/// Écran de configuration dynamique basé sur l'API /api/modules
class DynamicNodeConfigScreen extends StatefulWidget {
  final String? nodeId; // UUID du node existant (pour édition)
  final String nodeType; // 'trigger' ou 'action'
  final String serviceName;
  final String actionName;
  final String description;
  final Map<String, dynamic>? existingConfig;
  final Map<String, dynamic>? previousNodeOutputSchema; // Schéma de sortie de la node précédente
  final String? previousNodeName; // Nom de la node précédente pour l'affichage

  const DynamicNodeConfigScreen({
    super.key,
    this.nodeId, // Optionnel - utilisé pour éditer un node existant
    required this.nodeType,
    required this.serviceName,
    required this.actionName,
    required this.description,
    this.existingConfig,
    this.previousNodeOutputSchema,
    this.previousNodeName,
  });

  @override
  State<DynamicNodeConfigScreen> createState() => _DynamicNodeConfigScreenState();
}

class _DynamicNodeConfigScreenState extends State<DynamicNodeConfigScreen> {
  final ModuleConfigService _moduleConfigService = ModuleConfigService();
  final _formKey = GlobalKey<FormState>();

  ConfigSchema? _configSchema;
  Map<String, dynamic> _config = {};
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _config = Map.from(widget.existingConfig ?? {});
    _loadSchema();
  }

  Future<void> _loadSchema() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final authRepo = context.read<AuthRepository>();
      final token = await authRepo.getToken();

      if (token == null) {
        setState(() {
          _error = 'Vous devez être connecté';
          _loading = false;
        });
        return;
      }

      Map<String, dynamic> schemaJson;

      // Si on a un nodeId valide (pas temp_*), charger via l'API /api/modules/{nodeId}
      if (widget.nodeId != null &&
          widget.nodeId!.isNotEmpty &&
          !widget.nodeId!.startsWith('temp_')) {
        print('Loading schema by nodeId: ${widget.nodeId}');
        schemaJson = await _moduleConfigService.convertToMobileSchemaByNodeId(
          nodeId: widget.nodeId!,
          token: token,
        );
      } else {
        // Sinon, charger via module name + action name
        // Validation des paramètres
        if (widget.serviceName.isEmpty) {
          setState(() {
            _error = 'Service name is empty. Please select a service first.';
            _loading = false;
          });
          return;
        }

        if (widget.actionName.isEmpty) {
          setState(() {
            _error = 'Action name is empty. Please select an action first.';
            _loading = false;
          });
          return;
        }

        print('Loading schema for: ${widget.serviceName} / ${widget.actionName} (${widget.nodeType})');
        schemaJson = await _moduleConfigService.convertToMobileSchema(
          moduleName: widget.serviceName,
          actionOrTriggerName: widget.actionName,
          type: widget.nodeType,
          token: token,
        );
      }

      setState(() {
        _configSchema = ConfigSchema.fromJson(schemaJson);
        _loading = false;
      });
    } catch (e, stackTrace) {
      print('Error loading schema: $e');
      print('Stack trace: $stackTrace');
      setState(() {
        _error = 'Failed to load configuration:\n\nNodeId: ${widget.nodeId}\nService: ${widget.serviceName}\nAction: ${widget.actionName}\nType: ${widget.nodeType}\n\nError: $e';
        _loading = false;
      });
    }
  }

  void _onConfigChanged(Map<String, dynamic> newConfig) {
    setState(() {
      _config = newConfig;
    });
    print('Config updated: $_config');
  }

  void _saveConfig() {
    if (_formKey.currentState!.validate()) {
      print('Saving config: $_config');
      Navigator.pop(context, _config);
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        // Fermer le clavier quand on tape en dehors des champs
        FocusScope.of(context).unfocus();
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF8F9FA),
        appBar: AppBar(
          backgroundColor: Colors.white,
          foregroundColor: Colors.black87,
          elevation: 0,
          automaticallyImplyLeading: false,
          title: !_loading
              ? Row(
                  children: [
                    Expanded(
                      child: Container(
                        height: 48,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF2F2F7),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            onTap: () => Navigator.of(context).pop(),
                            borderRadius: BorderRadius.circular(12),
                            child: const Center(
                              child: Icon(
                                Icons.arrow_back_ios_new_rounded,
                                size: 20,
                                color: Colors.black87,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: Container(
                        height: 48,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF4CAF50), Color(0xFF45a049)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: ElevatedButton.icon(
                          onPressed: _saveConfig,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.transparent,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          icon: const Icon(Icons.check, size: 20),
                          label: const Text(
                            'Valider',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                )
              : null,
        ),
        body: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) {
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
              'Chargement de la configuration...',
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
                onPressed: _loadSchema,
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

    if (_configSchema == null) {
      return Center(
        child: Text(
          'Aucune configuration disponible',
          style: TextStyle(
            fontSize: 16,
            color: Colors.grey[600],
          ),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // En-tête amélioré
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFF4CAF50).withOpacity(0.1),
                    const Color(0xFF388E3C).withOpacity(0.1),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: const Color(0xFF4CAF50).withOpacity(0.3),
                  width: 1,
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF4CAF50), Color(0xFF388E3C)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        widget.nodeType == 'trigger' 
                          ? Icons.flash_on_rounded 
                          : Icons.check_circle_rounded,
                        color: Colors.white,
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.serviceName.toUpperCase(),
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF4CAF50),
                              letterSpacing: 1.2,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            widget.description,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1A1A1A),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Formulaire dynamique
            DynamicConfigForm(
              schema: _configSchema!,
              serviceName: widget.serviceName,
              initialConfig: _config,
              onConfigChanged: _onConfigChanged,
              previousNodeOutputSchema: widget.previousNodeOutputSchema,
              previousNodeName: widget.previousNodeName,
            ),
            const SizedBox(height: 80),
          ],
        ),
      ),
    );
  }
}
