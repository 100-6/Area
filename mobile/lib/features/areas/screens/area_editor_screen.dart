import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/workflow_node.dart';
import '../models/service_info.dart';
import '../services/area_service.dart';
import '../../auth/data/auth_repository.dart';
import '../utils/node_config_helper.dart';
import 'service_selector_screen.dart';

class AreaEditorScreen extends StatefulWidget {
  final String? areaId;

  const AreaEditorScreen({super.key, this.areaId});

  @override
  State<AreaEditorScreen> createState() => _AreaEditorScreenState();
}

class _AreaEditorScreenState extends State<AreaEditorScreen> {
  final AreaService _areaService = AreaService();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();

  bool _isLoading = false;
  WorkflowNode? _triggerNode;
  List<WorkflowNode> _actionNodes = [];

  @override
  void initState() {
    super.initState();
    if (widget.areaId != null) {
      _loadArea();
    }
  }

  Future<void> _loadArea() async {
    setState(() => _isLoading = true);
    try {
      final authRepo = context.read<AuthRepository>();
      final token = await authRepo.getToken();

      if (token == null || token.isEmpty) {
        setState(() => _isLoading = false);
        return;
      }

      final area = await _areaService.getAreaById(widget.areaId!, token);
      final nodes = await _areaService.getWorkflowNodes(
        areaId: widget.areaId!,
        token: token,
      );

      setState(() {
        _nameController.text = area.name;
        _descriptionController.text = area.description ?? '';
        _triggerNode = nodes.firstWhere(
          (n) => n.nodeType == 'trigger',
          orElse: () => nodes.first,
        );
        _actionNodes = nodes.where((n) => n.nodeType != 'trigger').toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading area: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _saveArea() async {
    if (_nameController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a name')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final authRepo = context.read<AuthRepository>();
      final token = await authRepo.getToken();

      if (token == null || token.isEmpty) {
        setState(() => _isLoading = false);
        return;
      }

      String areaId;
      if (widget.areaId == null) {
        // Créer la nouvelle AREA
        final newArea = await _areaService.createArea(
          name: _nameController.text,
          description: _descriptionController.text,
          token: token,
        );
        areaId = newArea.id;

        // Créer le trigger node si présent
        String? triggerNodeId;
        if (_triggerNode != null) {
          final createdTrigger = await _areaService.createWorkflowNode(
            areaId: areaId,
            nodeType: 'trigger',
            serviceId: _triggerNode!.serviceId,
            actionId: _triggerNode!.actionId,
            config: _triggerNode!.config,
            positionX: _triggerNode!.positionX,
            positionY: _triggerNode!.positionY,
            label: _triggerNode!.label,
            token: token,
          );
          triggerNodeId = createdTrigger.id;
        }

        // Créer les nodes d'action et les connexions
        for (var actionNode in _actionNodes) {
          final createdAction = await _areaService.createWorkflowNode(
            areaId: areaId,
            nodeType: 'action',
            serviceId: actionNode.serviceId,
            reactionId: actionNode.reactionId,
            config: actionNode.config,
            positionX: actionNode.positionX,
            positionY: actionNode.positionY,
            label: actionNode.label,
            token: token,
          );

          // Créer la connexion trigger -> action
          if (triggerNodeId != null) {
            await _areaService.createWorkflowConnection(
              areaId: areaId,
              sourceNodeId: triggerNodeId,
              targetNodeId: createdAction.id,
              token: token,
            );
          }
        }
      } else {
        // Mettre à jour l'AREA existante
        await _areaService.updateArea(
          areaId: widget.areaId!,
          name: _nameController.text,
          description: _descriptionController.text,
          token: token,
        );
      }

      if (mounted) {
        Navigator.pop(context);
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _editTrigger() async {
    // Si un trigger existe déjà, permettre de le modifier
    if (_triggerNode != null) {
      // Aller directement à la configuration avec les données existantes
      final config = await NodeConfigHelper.openConfigScreen(
        context: context,
        nodeId: _triggerNode!.id, // Passer le nodeId pour charger via l'API
        nodeType: 'trigger',
        serviceName: _triggerNode!.serviceId ?? '',
        actionName: _triggerNode!.actionId ?? '',
        description: _getTriggerDisplayText(),
        existingConfig: _triggerNode!.config,
      );

      if (config != null && mounted) {
        // Sauvegarder la configuration via l'API
        try {
          final authRepo = context.read<AuthRepository>();
          final token = await authRepo.getToken();

          if (token != null && mounted) {
            debugPrint('Saving trigger config to backend: $config');
            await _areaService.updateWorkflowNode(
              nodeId: _triggerNode!.id,
              config: config,
              token: token,
            );
            debugPrint('Trigger config saved successfully');
          }

          if (mounted) {
            setState(() {
              // Mettre à jour la configuration du trigger existant
              _triggerNode = WorkflowNode(
                id: _triggerNode!.id,
                areaId: _triggerNode!.areaId,
                nodeType: 'trigger',
                serviceId: _triggerNode!.serviceId,
                actionId: _triggerNode!.actionId,
                config: config,
                positionX: _triggerNode!.positionX,
                positionY: _triggerNode!.positionY,
                label: _triggerNode!.label,
                createdAt: _triggerNode!.createdAt,
                updatedAt: DateTime.now(),
              );
            });
          }
        } catch (e) {
          debugPrint('Error updating trigger: $e');
          // Afficher un message d'erreur à l'utilisateur
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Failed to update trigger: $e')),
            );
          }
        }
      }
    } else {
      // Créer un nouveau trigger
      // Étape 1: Sélectionner le service/trigger
      final result = await Navigator.push<Map<String, dynamic>>(
        context,
        MaterialPageRoute(
          builder: (context) => const ServiceSelectorScreen(nodeType: 'trigger'),
        ),
      );

      if (result != null && mounted) {
        // Étape 2: Configurer les paramètres avec le helper
        final item = result['item'];
        final serviceAction = item is ServiceAction ? item : null;

        final config = await NodeConfigHelper.openConfigScreen(
          context: context,
          nodeType: 'trigger',
          serviceName: result['service'],
          actionName: result['name'],
          description: result['description'],
          serviceAction: serviceAction,
        );

        if (config != null) {
          setState(() {
            // Créer le node avec la configuration
            _triggerNode = WorkflowNode(
              id: 'temp_trigger',
              areaId: widget.areaId ?? 'new',
              nodeType: 'trigger',
              serviceId: result['service'],
              actionId: result['name'],
              config: config,
              positionX: 100,
              positionY: 100,
              label: '${result['service']}: ${result['description']}',
              createdAt: DateTime.now(),
              updatedAt: DateTime.now(),
            );
          });
        }
      }
    }
  }

  Future<void> _editAction(WorkflowNode node) async {
    // Modifier une action existante
    final config = await NodeConfigHelper.openConfigScreen(
      context: context,
      nodeId: node.id, // Passer le nodeId pour charger via l'API
      nodeType: 'action',
      serviceName: node.serviceId ?? '',
      actionName: node.reactionId ?? '',
      description: _getActionDisplayText(node),
      existingConfig: node.config,
    );

    if (config != null && mounted) {
      try {
        // Sauvegarder la configuration sur le backend via PATCH
        final authRepo = context.read<AuthRepository>();
        final token = await authRepo.getToken();

        if (token != null && mounted) {
          debugPrint('Saving action config to backend: $config');
          await _areaService.updateWorkflowNode(
            nodeId: node.id,
            config: config,
            token: token,
          );
          debugPrint('Action config saved successfully');
        }

        // Mettre à jour l'état local après la sauvegarde
        if (mounted) {
          setState(() {
            // Trouver l'index de l'action et la mettre à jour
            final index = _actionNodes.indexOf(node);
            if (index != -1) {
              _actionNodes[index] = WorkflowNode(
                id: node.id,
                areaId: node.areaId,
                nodeType: 'action',
                serviceId: node.serviceId,
                reactionId: node.reactionId,
                config: config,
                positionX: node.positionX,
                positionY: node.positionY,
                label: node.label,
                createdAt: node.createdAt,
                updatedAt: DateTime.now(),
              );
            }
          });
        }
      } catch (e) {
        debugPrint('Error updating action: $e');
        // Afficher un message d'erreur à l'utilisateur
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to update action: $e')),
          );
        }
      }
    }
  }

  Future<void> _selectAction() async {
    // Étape 1: Sélectionner le service/action
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (context) => const ServiceSelectorScreen(nodeType: 'action'),
      ),
    );

    if (result != null && mounted) {
      // Étape 2: Configurer les paramètres avec le helper
      final item = result['item'];
      final serviceReaction = item is ServiceReaction ? item : null;

      final config = await NodeConfigHelper.openConfigScreen(
        context: context,
        nodeType: 'action',
        serviceName: result['service'],
        actionName: result['name'],
        description: result['description'],
        serviceReaction: serviceReaction,
      );

      if (config != null) {
        setState(() {
          // Ajouter le node action avec la configuration
          _actionNodes.add(WorkflowNode(
            id: 'temp_action_${_actionNodes.length}',
            areaId: widget.areaId ?? 'new',
            nodeType: 'action',
            serviceId: result['service'],
            reactionId: result['name'],
            config: config,
            positionX: 100,
            positionY: 200 + (_actionNodes.length * 100),
            label: '${result['service']}: ${result['description']}',
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ));
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: Text(widget.areaId == null ? 'Create Applet' : 'Edit Applet'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        actions: [
          if (!_isLoading)
            TextButton(
              onPressed: _saveArea,
              child: const Text(
                'Save',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildNameSection(),
                  const SizedBox(height: 24),
                  _buildDescriptionSection(),
                  const SizedBox(height: 32),
                  _buildWorkflowSection(),
                ],
              ),
            ),
    );
  }

  Widget _buildNameSection() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Applet Name',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(
                hintText: 'e.g., Send notification every morning',
                border: OutlineInputBorder(),
                contentPadding: EdgeInsets.all(12),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDescriptionSection() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Description (optional)',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _descriptionController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'Add a description...',
                border: OutlineInputBorder(),
                contentPadding: EdgeInsets.all(12),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWorkflowSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Workflow',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),

        // IF (Trigger)
        _buildTriggerCard(),

        // Connector
        _buildConnector(),

        // THEN (Actions)
        ..._actionNodes.map((node) => _buildActionCard(node)),

        // Add Action Button
        const SizedBox(height: 8),
        _buildAddActionButton(),
      ],
    );
  }

  Widget _buildTriggerCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () => _editTrigger(),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.blue.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.flash_on, color: Colors.blue, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'IF',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.blue,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _getTriggerDisplayText(),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    if (_triggerNode != null && _triggerNode!.config.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          _formatTriggerConfig(_triggerNode!),
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey[600],
                          ),
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

  String _getTriggerDisplayText() {
    if (_triggerNode == null) return 'Choose a trigger';

    final serviceName = _triggerNode!.serviceId ?? '';
    final triggerName = _triggerNode!.actionId ?? '';

    // Formatage du nom du trigger
    if (serviceName == 'timer') {
      if (triggerName == 'every_x_minutes') {
        return 'Timer: Every X minutes';
      } else if (triggerName == 'daily_at_time') {
        return 'Timer: Daily at specific time';
      } else if (triggerName == 'every_weekday') {
        return 'Timer: Every weekday';
      }
    }

    if (serviceName == 'discord') {
      if (triggerName == 'on_message_created') {
        return 'Discord: On message created';
      } else if (triggerName == 'on_member_join') {
        return 'Discord: On member join';
      } else if (triggerName == 'on_reaction_added') {
        return 'Discord: On reaction added';
      }
    }

    return _triggerNode!.label ?? 'Trigger';
  }

  String _formatTriggerConfig(WorkflowNode node) {
    final config = node.config;
    if (config.isEmpty) return '';

    final serviceName = node.serviceId ?? '';
    final triggerName = node.actionId ?? '';

    // Timer triggers
    if (serviceName == 'timer') {
      if (triggerName == 'every_x_minutes') {
        final interval = config['interval'];
        if (interval != null) {
          return 'Every $interval minute${interval == 1 ? '' : 's'}';
        }
      } else if (triggerName == 'daily_at_time') {
        final time = config['time'];
        final timezone = config['timezone'] ?? 'Europe/Paris';
        if (time != null) {
          return 'At $time ($timezone)';
        }
      } else if (triggerName == 'every_weekday') {
        final time = config['time'];
        if (time != null) {
          return 'Weekdays at $time';
        }
      }
    }

    // Discord triggers
    if (serviceName == 'discord') {
      if (triggerName == 'on_message_created') {
        final channelId = config['channelId'];
        final keyword = config['keyword'];
        if (channelId != null) {
          return 'Channel: $channelId${keyword != null && keyword.isNotEmpty ? ' - Keyword: "$keyword"' : ''}';
        }
      } else if (triggerName == 'on_member_join') {
        final guildId = config['guildId'];
        return 'Server: $guildId';
      } else if (triggerName == 'on_reaction_added') {
        final channelId = config['channelId'];
        final emoji = config['emoji'];
        if (channelId != null) {
          return 'Channel: $channelId${emoji != null && emoji.isNotEmpty ? ' - Emoji: $emoji' : ''}';
        }
      }
    }

    // Configuration générique
    final params = <String>[];
    config.forEach((key, value) {
      params.add('$key: $value');
    });
    return params.join(', ');
  }

  Widget _buildConnector() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          const SizedBox(width: 24),
          Container(
            width: 2,
            height: 40,
            color: Colors.grey[300],
          ),
        ],
      ),
    );
  }

  Widget _buildActionCard(WorkflowNode node) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Card(
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: InkWell(
          onTap: () => _editAction(node),
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: Colors.green.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.check_circle, color: Colors.green, size: 28),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'THEN',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Colors.green,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _getActionDisplayText(node),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (node.config.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            _formatActionConfig(node),
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey[600],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.grey),
                  onPressed: () {
                    setState(() {
                      _actionNodes.remove(node);
                    });
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _getActionDisplayText(WorkflowNode node) {
    final serviceName = node.serviceId ?? '';
    final actionName = node.reactionId ?? '';

    // Console actions
    if (serviceName == 'console') {
      if (actionName == 'log') {
        return 'Console: Log message';
      }
    }

    // Discord actions
    if (serviceName == 'discord') {
      if (actionName == 'send_message') {
        return 'Discord: Send message';
      } else if (actionName == 'add_role') {
        return 'Discord: Add role';
      } else if (actionName == 'kick_member') {
        return 'Discord: Kick member';
      }
    }

    return node.label ?? 'Action';
  }

  String _formatActionConfig(WorkflowNode node) {
    final config = node.config;
    if (config.isEmpty) return '';

    final serviceName = node.serviceId ?? '';
    final actionName = node.reactionId ?? '';

    // Console actions
    if (serviceName == 'console' && actionName == 'log') {
      final message = config['message'];
      final level = config['level'] ?? 'info';
      if (message != null) {
        final truncatedMessage = message.length > 50
            ? '${message.substring(0, 50)}...'
            : message;
        return '[$level] "$truncatedMessage"';
      }
    }

    // Discord actions
    if (serviceName == 'discord') {
      if (actionName == 'send_message') {
        final channelId = config['channelId'];
        final content = config['content'];
        if (channelId != null) {
          final truncatedContent = content != null && content.length > 30
              ? '${content.substring(0, 30)}...'
              : content ?? '';
          return 'Channel: $channelId${truncatedContent.isNotEmpty ? ' - "$truncatedContent"' : ''}';
        }
      } else if (actionName == 'add_role') {
        final roleId = config['roleId'];
        final userId = config['userId'];
        return 'Add role $roleId to user $userId';
      } else if (actionName == 'kick_member') {
        final userId = config['userId'];
        final reason = config['reason'];
        return 'Kick user $userId${reason != null && reason.isNotEmpty ? ': $reason' : ''}';
      }
    }

    // Configuration générique
    final params = <String>[];
    config.forEach((key, value) {
      final valueStr = value.toString();
      final truncated = valueStr.length > 30
          ? '${valueStr.substring(0, 30)}...'
          : valueStr;
      params.add('$key: $truncated');
    });
    return params.join(', ');
  }

  Widget _buildAddActionButton() {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey[300]!),
      ),
      child: InkWell(
        onTap: _selectAction,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.add, color: Colors.grey[600]),
              const SizedBox(width: 8),
              Text(
                'Add action',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }
}
