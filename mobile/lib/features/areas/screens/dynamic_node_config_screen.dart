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

  const DynamicNodeConfigScreen({
    super.key,
    this.nodeId, // Optionnel - utilisé pour éditer un node existant
    required this.nodeType,
    required this.serviceName,
    required this.actionName,
    required this.description,
    this.existingConfig,
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('Configure Parameters'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        actions: [
          TextButton(
            onPressed: _loading ? null : _saveConfig,
            child: const Text(
              'Done',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Loading configuration...'),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                size: 64,
                color: Colors.red,
              ),
              const SizedBox(height: 16),
              Text(
                'Error',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey[600]),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _loadSchema,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (_configSchema == null) {
      return const Center(
        child: Text('No configuration available'),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // En-tête
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.serviceName.toUpperCase(),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      widget.description,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
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
            ),
          ],
        ),
      ),
    );
  }
}
