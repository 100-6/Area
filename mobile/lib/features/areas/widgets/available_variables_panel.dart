import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Panneau affichant les variables disponibles depuis les nodes précédentes
/// Permet à l'utilisateur de voir et copier les variables comme {{message.content}}
class AvailableVariablesPanel extends StatelessWidget {
  final Map<String, dynamic>? outputSchema;
  final String sourceNodeName;

  const AvailableVariablesPanel({
    super.key,
    required this.outputSchema,
    required this.sourceNodeName,
  });

  @override
  Widget build(BuildContext context) {
    debugPrint('🎯 AvailableVariablesPanel - outputSchema: $outputSchema');

    if (outputSchema == null || outputSchema!.isEmpty) {
      debugPrint('⚠️ No outputSchema provided');
      return const SizedBox.shrink();
    }

    final variables = _extractVariables(outputSchema!);
    debugPrint('📋 Extracted ${variables.length} variables: ${variables.map((v) => v.path).toList()}');

    if (variables.isEmpty) {
      debugPrint('⚠️ No variables extracted from schema');
      return const SizedBox.shrink();
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF2196F3).withOpacity(0.05),
            const Color(0xFF1976D2).withOpacity(0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: const Color(0xFF2196F3).withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(
          dividerColor: Colors.transparent,
          splashColor: const Color(0xFF2196F3).withOpacity(0.1),
        ),
        child: ExpansionTile(
          initiallyExpanded: false,
          tilePadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
          childrenPadding: const EdgeInsets.fromLTRB(18, 0, 18, 16),
          leading: Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: const Color(0xFF2196F3).withOpacity(0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              Icons.code_rounded,
              color: Color(0xFF2196F3),
              size: 20,
            ),
          ),
          title: Row(
            children: [
              const Text(
                'Variables disponibles',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1A1A1A),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF2196F3).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${variables.length}',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2196F3),
                  ),
                ),
              ),
            ],
          ),
          subtitle: Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              'Depuis: $sourceNodeName',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
          ),
          children: [
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.grey[200]!),
              ),
              child: Column(
                children: [
                  // Info header
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF2196F3).withOpacity(0.05),
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(10),
                        topRight: Radius.circular(10),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.info_outline_rounded,
                          color: const Color(0xFF2196F3),
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Utilisez ces variables dans vos champs texte',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey[700],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Variables list
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: variables.length,
                    separatorBuilder: (context, index) => Divider(
                      height: 1,
                      color: Colors.grey[200],
                    ),
                    itemBuilder: (context, index) {
                      final variable = variables[index];
                      return _buildVariableItem(context, variable);
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVariableItem(BuildContext context, VariableInfo variable) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          _copyToClipboard(context, variable.path);
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          child: Row(
            children: [
              // Variable icon based on type
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: _getTypeColor(variable.type).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  _getTypeIcon(variable.type),
                  size: 16,
                  color: _getTypeColor(variable.type),
                ),
              ),
              const SizedBox(width: 12),
              // Variable info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Variable path with copy syntax
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: Colors.grey[300]!,
                          width: 1,
                        ),
                      ),
                      child: Text(
                        '{{${variable.path}}}',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          fontFamily: 'monospace',
                          color: Color(0xFF2196F3),
                        ),
                      ),
                    ),
                    if (variable.description != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        variable.description!,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                    const SizedBox(height: 2),
                    // Type badge
                    Text(
                      _getTypeLabel(variable.type),
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey[500],
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ),
              ),
              // Copy button
              IconButton(
                icon: const Icon(Icons.copy_rounded, size: 18),
                color: const Color(0xFF2196F3),
                onPressed: () {
                  _copyToClipboard(context, variable.path);
                },
                tooltip: 'Copier {{${variable.path}}}',
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _copyToClipboard(BuildContext context, String path) {
    final textToCopy = '{{$path}}';
    Clipboard.setData(ClipboardData(text: textToCopy));

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Copié: $textToCopy',
                style: const TextStyle(fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF4CAF50),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  IconData _getTypeIcon(String type) {
    switch (type.toLowerCase()) {
      case 'string':
        return Icons.text_fields;
      case 'number':
      case 'integer':
        return Icons.numbers;
      case 'boolean':
        return Icons.toggle_on;
      case 'object':
        return Icons.data_object;
      case 'array':
        return Icons.list;
      case 'date-time':
        return Icons.access_time;
      default:
        return Icons.code;
    }
  }

  Color _getTypeColor(String type) {
    switch (type.toLowerCase()) {
      case 'string':
        return const Color(0xFF4CAF50);
      case 'number':
      case 'integer':
        return const Color(0xFFFF9800);
      case 'boolean':
        return const Color(0xFF9C27B0);
      case 'object':
        return const Color(0xFF2196F3);
      case 'array':
        return const Color(0xFFE91E63);
      case 'date-time':
        return const Color(0xFF00BCD4);
      default:
        return const Color(0xFF607D8B);
    }
  }

  String _getTypeLabel(String type) {
    switch (type.toLowerCase()) {
      case 'date-time':
        return 'Date/Heure';
      default:
        return type;
    }
  }

  List<VariableInfo> _extractVariables(Map<String, dynamic> schema, [String prefix = '']) {
    final List<VariableInfo> variables = [];

    if (schema['properties'] != null && schema['properties'] is Map) {
      final properties = schema['properties'] as Map<String, dynamic>;

      properties.forEach((key, value) {
        final currentPath = prefix.isEmpty ? key : '$prefix.$key';
        final type = value['type'] ?? 'string';
        final format = value['format'];
        final description = value['description'];

        if (type == 'object' && value['properties'] != null) {
          // Récursion pour les objets imbriqués
          variables.addAll(_extractVariables(value, currentPath));
        } else {
          // Ajouter la variable
          variables.add(VariableInfo(
            path: currentPath,
            type: format ?? type,
            description: description,
          ));
        }
      });
    }

    return variables;
  }
}

class VariableInfo {
  final String path;
  final String type;
  final String? description;

  VariableInfo({
    required this.path,
    required this.type,
    this.description,
  });
}
