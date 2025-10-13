import 'package:flutter/material.dart';
import '../models/config_schema.dart';
import '../widgets/dynamic_config_form.dart';

/// Version modulaire de NodeConfigScreen qui utilise les schémas de configuration
class NodeConfigScreenV2 extends StatefulWidget {
  final String nodeType; // 'trigger' ou 'action'
  final String serviceName;
  final String actionName;
  final String description;
  final ConfigSchema configSchema;
  final Map<String, dynamic>? existingConfig;

  const NodeConfigScreenV2({
    super.key,
    required this.nodeType,
    required this.serviceName,
    required this.actionName,
    required this.description,
    required this.configSchema,
    this.existingConfig,
  });

  @override
  State<NodeConfigScreenV2> createState() => _NodeConfigScreenV2State();
}

class _NodeConfigScreenV2State extends State<NodeConfigScreenV2> {
  final Map<String, dynamic> _config = {};
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    if (widget.existingConfig != null) {
      _config.addAll(widget.existingConfig!);
    }
  }

  void _saveConfig() {
    if (_formKey.currentState!.validate()) {
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
            onPressed: _saveConfig,
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
      body: SingleChildScrollView(
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
                schema: widget.configSchema,
                serviceName: widget.serviceName,
                initialConfig: widget.existingConfig,
                onConfigChanged: (config) {
                  setState(() {
                    _config.clear();
                    _config.addAll(config);
                  });
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
