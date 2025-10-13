import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/config_schema.dart';
import '../services/service_resource_provider.dart';
import '../../auth/data/auth_repository.dart';

/// Widget pour générer dynamiquement un formulaire à partir d'un schéma
class DynamicConfigForm extends StatefulWidget {
  final ConfigSchema schema;
  final String serviceName;
  final Map<String, dynamic>? initialConfig;
  final void Function(Map<String, dynamic> config) onConfigChanged;

  const DynamicConfigForm({
    super.key,
    required this.schema,
    required this.serviceName,
    this.initialConfig,
    required this.onConfigChanged,
  });

  @override
  State<DynamicConfigForm> createState() => _DynamicConfigFormState();
}

class _DynamicConfigFormState extends State<DynamicConfigForm> {
  final Map<String, dynamic> _config = {};
  final Map<String, TextEditingController> _controllers = {};
  final Map<String, List<ResourceItem>> _resourceCache = {};
  final Map<String, bool> _loadingStates = {};

  @override
  void initState() {
    super.initState();

    // Initialiser la config avec les valeurs par défaut et existantes
    for (var field in widget.schema.fields) {
      if (widget.initialConfig != null && widget.initialConfig!.containsKey(field.key)) {
        _config[field.key] = widget.initialConfig![field.key];
      } else if (field.defaultValue != null) {
        _config[field.key] = field.defaultValue;
      }

      // Créer les controllers pour les champs texte
      if (_isTextInputField(field.type)) {
        final value = _config[field.key];
        _controllers[field.key] = TextEditingController(
          text: value?.toString() ?? '',
        );
      }
    }

    // Charger les ressources pour les champs qui en ont besoin
    _loadInitialResources();
  }

  @override
  void dispose() {
    for (var controller in _controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  bool _isTextInputField(String type) {
    return [
      ConfigFieldType.text,
      ConfigFieldType.textarea,
      ConfigFieldType.number,
      ConfigFieldType.time,
      ConfigFieldType.email,
      ConfigFieldType.url,
    ].contains(type);
  }

  Future<void> _loadInitialResources() async {
    final authRepo = context.read<AuthRepository>();
    final token = await authRepo.getToken();
    if (token == null) return;

    for (var field in widget.schema.fields) {
      if (ConfigFieldType.requiresResource(field.type)) {
        final resourceType = ConfigFieldType.getResourceType(field.type);
        if (resourceType != null && field.dependsOn == null) {
          await _loadResources(field, token);
        }
      }
    }
  }

  Future<void> _loadResources(ConfigField field, String token, [Map<String, dynamic>? params]) async {
    final resourceType = ConfigFieldType.getResourceType(field.type);
    if (resourceType == null) return;

    setState(() => _loadingStates[field.key] = true);

    try {
      final resources = await ServiceResourceProvider.fetchResources(
        resourceType: resourceType,
        token: token,
        params: params,
      );

      setState(() {
        _resourceCache[field.key] = resources;
        _loadingStates[field.key] = false;
      });
    } catch (e) {
      debugPrint('Error loading resources for ${field.key}: $e');
      setState(() => _loadingStates[field.key] = false);
    }
  }

  void _onFieldChanged(ConfigField field, dynamic value) {
    setState(() {
      _config[field.key] = value;
    });

    // Notifier le parent
    widget.onConfigChanged(_config);

    // Si ce champ est une dépendance d'autres champs, charger leurs ressources
    _loadDependentResources(field.key);
  }

  Future<void> _loadDependentResources(String fieldKey) async {
    final authRepo = context.read<AuthRepository>();
    final token = await authRepo.getToken();
    if (token == null) return;

    for (var field in widget.schema.fields) {
      if (field.dependsOn == fieldKey) {
        final params = {field.dependsOn!: _config[fieldKey]};
        await _loadResources(field, token, params);

        // Réinitialiser la valeur du champ dépendant
        setState(() {
          _config[field.key] = null;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: widget.schema.fields.map((field) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: _buildField(field),
        );
      }).toList(),
    );
  }

  Widget _buildField(ConfigField field) {
    // Vérifier si le champ dépend d'un autre
    if (field.dependsOn != null) {
      final dependencyValue = _config[field.dependsOn];
      if (dependencyValue == null) {
        return _buildDisabledField(field, 'Sélectionnez d\'abord ${field.dependsOn}');
      }
    }

    switch (field.type) {
      case ConfigFieldType.text:
      case ConfigFieldType.email:
      case ConfigFieldType.url:
        return _buildTextField(field);

      case ConfigFieldType.textarea:
        return _buildTextAreaField(field);

      case ConfigFieldType.number:
        return _buildNumberField(field);

      case ConfigFieldType.time:
        return _buildTimeField(field);

      case ConfigFieldType.boolean:
        return _buildBooleanField(field);

      case ConfigFieldType.dropdown:
        return _buildDropdownField(field);

      case ConfigFieldType.discordGuild:
      case ConfigFieldType.discordChannel:
      case ConfigFieldType.discordRole:
        return _buildResourceDropdown(field);

      default:
        return _buildTextField(field);
    }
  }

  Widget _buildDisabledField(ConfigField field, String message) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              field.label,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey[300]!),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: Colors.grey[600], size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      message,
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 14,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(ConfigField field) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              field.label,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _controllers[field.key],
              decoration: InputDecoration(
                hintText: field.hint,
                border: const OutlineInputBorder(),
              ),
              keyboardType: field.type == ConfigFieldType.email
                  ? TextInputType.emailAddress
                  : field.type == ConfigFieldType.url
                      ? TextInputType.url
                      : TextInputType.text,
              onChanged: (value) => _onFieldChanged(field, value),
              validator: field.required
                  ? (value) => value == null || value.isEmpty ? 'This field is required' : null
                  : null,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextAreaField(ConfigField field) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              field.label,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _controllers[field.key],
              maxLines: 4,
              maxLength: field.maxLength,
              decoration: InputDecoration(
                hintText: field.hint,
                border: const OutlineInputBorder(),
              ),
              onChanged: (value) => _onFieldChanged(field, value),
              validator: field.required
                  ? (value) => value == null || value.isEmpty ? 'This field is required' : null
                  : null,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNumberField(ConfigField field) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              field.label,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _controllers[field.key],
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                hintText: field.hint,
                border: const OutlineInputBorder(),
                suffixText: field.min != null && field.max != null
                    ? '(${field.min}-${field.max})'
                    : null,
              ),
              onChanged: (value) {
                final number = int.tryParse(value);
                _onFieldChanged(field, number);
              },
              validator: (value) {
                if (field.required && (value == null || value.isEmpty)) {
                  return 'This field is required';
                }
                if (value != null && value.isNotEmpty) {
                  final number = int.tryParse(value);
                  if (number == null) return 'Please enter a valid number';
                  if (field.min != null && number < field.min!) {
                    return 'Must be at least ${field.min}';
                  }
                  if (field.max != null && number > field.max!) {
                    return 'Must be at most ${field.max}';
                  }
                }
                return null;
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeField(ConfigField field) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              field.label,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _controllers[field.key],
              decoration: InputDecoration(
                hintText: field.hint ?? 'HH:mm (e.g., 09:00)',
                border: const OutlineInputBorder(),
              ),
              onChanged: (value) => _onFieldChanged(field, value),
              validator: (value) {
                if (field.required && (value == null || value.isEmpty)) {
                  return 'This field is required';
                }
                if (value != null && value.isNotEmpty) {
                  final timeRegex = RegExp(r'^([0-1][0-9]|2[0-3]):([0-5][0-9])$');
                  if (!timeRegex.hasMatch(value)) {
                    return 'Invalid format. Use HH:mm (e.g., 09:00)';
                  }
                }
                return null;
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBooleanField(ConfigField field) {
    final value = _config[field.key] as bool? ?? field.defaultValue as bool? ?? false;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    field.label,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (field.hint != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      field.hint!,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ],
              ),
            ),
            Switch(
              value: value,
              onChanged: (newValue) {
                setState(() {
                  _config[field.key] = newValue;
                });
                _onFieldChanged(field, newValue);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDropdownField(ConfigField field) {
    if (field.options == null || field.options!.isEmpty) {
      return _buildDisabledField(field, 'No options available');
    }

    final currentValue = _config[field.key] as String? ?? field.defaultValue as String?;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              field.label,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: currentValue,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
              ),
              hint: Text(field.hint ?? 'Select an option'),
              items: field.options!.map((option) {
                return DropdownMenuItem(
                  value: option,
                  child: Text(option),
                );
              }).toList(),
              onChanged: (value) {
                if (value != null) {
                  _onFieldChanged(field, value);
                }
              },
              validator: field.required
                  ? (value) => value == null ? 'This field is required' : null
                  : null,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResourceDropdown(ConfigField field) {
    final isLoading = _loadingStates[field.key] ?? false;
    final resources = _resourceCache[field.key] ?? [];
    final currentValue = _config[field.key] as String?;

    if (isLoading) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                field.label,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              const Center(child: CircularProgressIndicator()),
            ],
          ),
        ),
      );
    }

    if (resources.isEmpty) {
      return _buildDisabledField(
        field,
        'No ${field.label.toLowerCase()} available',
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              field.label,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: currentValue,
              decoration: InputDecoration(
                border: const OutlineInputBorder(),
                hintText: field.hint ?? 'Select ${field.label.toLowerCase()}',
              ),
              items: resources.map((resource) {
                return DropdownMenuItem(
                  value: resource.id,
                  child: Text(resource.name),
                );
              }).toList(),
              onChanged: (value) {
                if (value != null) {
                  _onFieldChanged(field, value);
                }
              },
              validator: field.required
                  ? (value) => value == null ? 'This field is required' : null
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}
