import 'package:flutter/material.dart';

/// Widget réutilisable pour afficher une card de workflow (trigger ou action)
class WorkflowNodeCard extends StatelessWidget {
  final String type; // 'trigger' ou 'action'
  final String? label;
  final VoidCallback? onTap;
  final VoidCallback? onDelete;

  const WorkflowNodeCard({
    super.key,
    required this.type,
    this.label,
    this.onTap,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final isTrigger = type == 'trigger';
    final color = isTrigger ? Colors.blue : Colors.green;
    final icon = isTrigger ? Icons.flash_on : Icons.check_circle;
    final prefix = isTrigger ? 'IF' : 'THEN';
    final defaultLabel = isTrigger ? 'Choose a trigger' : 'Choose an action';

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      prefix,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: color,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      label ?? defaultLabel,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: label == null ? Colors.grey[600] : null,
                      ),
                    ),
                  ],
                ),
              ),
              if (onDelete != null)
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.grey),
                  onPressed: onDelete,
                )
              else if (onTap != null)
                const Icon(Icons.chevron_right, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}
