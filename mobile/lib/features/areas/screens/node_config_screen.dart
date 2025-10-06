import 'package:flutter/material.dart';

/// Écran de configuration des paramètres d'un trigger ou d'une action
class NodeConfigScreen extends StatefulWidget {
  final String nodeType; // 'trigger' ou 'action'
  final String serviceName;
  final String actionName;
  final String description;

  const NodeConfigScreen({
    super.key,
    required this.nodeType,
    required this.serviceName,
    required this.actionName,
    required this.description,
  });

  @override
  State<NodeConfigScreen> createState() => _NodeConfigScreenState();
}

class _NodeConfigScreenState extends State<NodeConfigScreen> {
  final Map<String, dynamic> _config = {};
  final _formKey = GlobalKey<FormState>();

  // Controllers pour les différents types de paramètres
  final Map<String, TextEditingController> _controllers = {};

  @override
  void dispose() {
    for (var controller in _controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  void _saveConfig() {
    if (_formKey.currentState!.validate()) {
      // Récupérer toutes les valeurs des controllers
      for (var entry in _controllers.entries) {
        _config[entry.key] = entry.value.text;
      }

      // Convertir les types si nécessaire
      _convertTypes();

      Navigator.pop(context, _config);
    }
  }

  void _convertTypes() {
    // Convertir 'interval' en number pour every_x_minutes
    if (widget.actionName == 'every_x_minutes' && _config['interval'] != null) {
      _config['interval'] = int.tryParse(_config['interval']) ?? 0;
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

              // Champs de configuration selon le service/action
              ..._buildConfigFields(),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _buildConfigFields() {
    // Timer - every_x_minutes
    if (widget.serviceName == 'timer' && widget.actionName == 'every_x_minutes') {
      return [
        _buildNumberField(
          key: 'interval',
          label: 'Interval (minutes)',
          hint: 'Enter interval in minutes (1-1440)',
          min: 1,
          max: 1440,
        ),
      ];
    }

    // Timer - daily_at_time
    if (widget.serviceName == 'timer' && widget.actionName == 'daily_at_time') {
      return [
        _buildTimeField(
          key: 'time',
          label: 'Time',
          hint: 'HH:mm (e.g., 09:00)',
        ),
      ];
    }

    // Timer - every_weekday
    if (widget.serviceName == 'timer' && widget.actionName == 'every_weekday') {
      return [
        _buildTimeField(
          key: 'time',
          label: 'Time',
          hint: 'HH:mm (e.g., 09:00)',
        ),
      ];
    }

    // Console - log
    if (widget.serviceName == 'console' && widget.actionName == 'log') {
      return [
        _buildTextField(
          key: 'message',
          label: 'Message',
          hint: 'Enter the message to log',
          required: true,
        ),
        const SizedBox(height: 16),
        _buildDropdownField(
          key: 'level',
          label: 'Log Level',
          items: ['info', 'warn', 'error', 'success'],
          defaultValue: 'info',
        ),
      ];
    }

    // Par défaut, retourner un message
    return [
      Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            'No configuration needed for this ${widget.nodeType}.',
            style: TextStyle(color: Colors.grey[600]),
          ),
        ),
      ),
    ];
  }

  Widget _buildTextField({
    required String key,
    required String label,
    required String hint,
    bool required = false,
  }) {
    _controllers[key] = TextEditingController();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _controllers[key],
              decoration: InputDecoration(
                hintText: hint,
                border: const OutlineInputBorder(),
              ),
              validator: required
                  ? (value) {
                      if (value == null || value.isEmpty) {
                        return 'This field is required';
                      }
                      return null;
                    }
                  : null,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNumberField({
    required String key,
    required String label,
    required String hint,
    int? min,
    int? max,
  }) {
    _controllers[key] = TextEditingController();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _controllers[key],
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                hintText: hint,
                border: const OutlineInputBorder(),
                suffixText: min != null && max != null ? '($min-$max)' : null,
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'This field is required';
                }
                final number = int.tryParse(value);
                if (number == null) {
                  return 'Please enter a valid number';
                }
                if (min != null && number < min) {
                  return 'Must be at least $min';
                }
                if (max != null && number > max) {
                  return 'Must be at most $max';
                }
                return null;
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeField({
    required String key,
    required String label,
    required String hint,
  }) {
    _controllers[key] = TextEditingController();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _controllers[key],
              decoration: InputDecoration(
                hintText: hint,
                border: const OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'This field is required';
                }
                // Valider le format HH:mm
                final timeRegex = RegExp(r'^([0-1][0-9]|2[0-3]):([0-5][0-9])$');
                if (!timeRegex.hasMatch(value)) {
                  return 'Invalid format. Use HH:mm (e.g., 09:00)';
                }
                return null;
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDropdownField({
    required String key,
    required String label,
    required List<String> items,
    String? defaultValue,
  }) {
    String selectedValue = defaultValue ?? items.first;
    _config[key] = selectedValue; // Set initial value in config

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: selectedValue,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
              ),
              items: items.map((item) {
                return DropdownMenuItem(
                  value: item,
                  child: Text(item),
                );
              }).toList(),
              onChanged: (value) {
                if (value != null) {
                  _config[key] = value;
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}
