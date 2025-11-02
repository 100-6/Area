import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/workflow_node.dart';
import '../models/service_info.dart';
import '../services/area_service.dart';
import '../services/module_config_service.dart';
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
  final ModuleConfigService _moduleConfigService = ModuleConfigService();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();

  bool _isLoading = false;
  bool _isDescriptionExpanded = false;
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

      final triggerNode = nodes.firstWhere(
        (n) => n.nodeType == 'trigger',
        orElse: () => nodes.first,
      );

      // Charger l'outputSchema du trigger
      Map<String, dynamic>? outputSchema;
      if (triggerNode.nodeType == 'trigger') {
        if (!triggerNode.id.startsWith('temp_')) {
          // Trigger existant - charger via nodeId
          debugPrint('🔍 Loading outputSchema for existing trigger node: ${triggerNode.id}');
          outputSchema = await _moduleConfigService.getNodeOutputSchema(
            nodeId: triggerNode.id,
            token: token,
          );
          debugPrint('📦 Received outputSchema: $outputSchema');
        } else if (triggerNode.serviceId != null && triggerNode.actionId != null) {
          // Nouveau trigger - charger via moduleName et triggerName
          debugPrint('🔍 Loading outputSchema for new trigger: ${triggerNode.serviceId}.${triggerNode.actionId}');
          outputSchema = await _moduleConfigService.getOutputSchemaByName(
            moduleName: triggerNode.serviceId!,
            actionOrTriggerName: triggerNode.actionId!,
            type: 'trigger',
            token: token,
          );
          debugPrint('📦 Received outputSchema: $outputSchema');
        } else {
          debugPrint('⚠️ Cannot load outputSchema - missing serviceId or actionId');
        }
      } else {
        debugPrint('⚠️ Node is not a trigger - nodeType: ${triggerNode.nodeType}');
      }

      setState(() {
        _nameController.text = area.name;
        _descriptionController.text = area.description ?? '';
        _isDescriptionExpanded = area.description != null && area.description!.isNotEmpty;
        _triggerNode = triggerNode;
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

    // Éviter les doubles soumissions
    if (_isLoading) {
      debugPrint('⚠️ Save already in progress, ignoring duplicate call');
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

        // ÉTAPE 1 : Créer TOUS les nodes d'abord (comme le frontend)
        debugPrint('💾 Step 1: Creating ALL nodes first...');

        // Map pour stocker les IDs : tempId → realId
        final Map<String, String> nodeIdMap = {};

        // Créer le trigger node si présent
        String? triggerNodeId;
        if (_triggerNode != null) {
          debugPrint('💾 Creating trigger node: ${_triggerNode!.serviceId}/${_triggerNode!.actionId}');
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
          nodeIdMap[_triggerNode!.id] = createdTrigger.id;
          debugPrint('✅ Trigger node created: ${createdTrigger.id}');
        }

        // Créer TOUS les action nodes
        final List<String> actionNodeIds = [];
        for (int i = 0; i < _actionNodes.length; i++) {
          final actionNode = _actionNodes[i];
          debugPrint('💾 Creating action ${i + 1}/${_actionNodes.length}: ${actionNode.serviceId}/${actionNode.reactionId}');

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

          actionNodeIds.add(createdAction.id);
          nodeIdMap[actionNode.id] = createdAction.id;
          debugPrint('✅ Action node created: ${createdAction.id}');
        }

        debugPrint('✅ All ${1 + _actionNodes.length} nodes created successfully');

        // ÉTAPE 2 : Créer TOUTES les connexions APRÈS (comme le frontend)
        debugPrint('🔗 Step 2: Creating ALL connections...');

        // Créer la liste des connexions en chaîne
        String? previousNodeId = triggerNodeId;
        int connectionIndex = 0;

        for (final actionNodeId in actionNodeIds) {
          if (previousNodeId != null) {
            connectionIndex++;
            debugPrint('🔗 Connection ${connectionIndex}: $previousNodeId → $actionNodeId');
            await _areaService.createWorkflowConnection(
              areaId: areaId,
              sourceNodeId: previousNodeId,
              targetNodeId: actionNodeId,
              token: token,
            );
          }
          previousNodeId = actionNodeId;
        }

        debugPrint('✅ All $connectionIndex connections created successfully');
      } else {
        // Mettre à jour l'AREA existante
        areaId = widget.areaId!;

        // Mettre à jour le nom et la description
        await _areaService.updateArea(
          areaId: areaId,
          name: _nameController.text,
          description: _descriptionController.text,
          token: token,
        );

        // Créer les nouveaux nodes (ceux avec des IDs temporaires)
        debugPrint('💾 Checking for new nodes to create in existing Area...');

        // Identifier les nouveaux action nodes (ceux qui commencent par 'temp_')
        final newActionNodes = _actionNodes.where((node) => node.id.startsWith('temp_')).toList();

        if (newActionNodes.isNotEmpty) {
          debugPrint('💾 Found ${newActionNodes.length} new action(s) to create');

          // Récupérer les nodes existants pour trouver le dernier
          final existingNodes = await _areaService.getWorkflowNodes(
            areaId: areaId,
            token: token,
          );

          // Trouver le dernier node de la chaîne
          String? lastNodeId;
          if (existingNodes.isNotEmpty) {
            // Le dernier node est celui qui n'est pas une source dans les connexions
            final allNodes = existingNodes;
            lastNodeId = allNodes.last.id;
          }

          // Créer chaque nouveau node et le connecter
          for (int i = 0; i < newActionNodes.length; i++) {
            final newNode = newActionNodes[i];
            debugPrint('💾 Creating new action ${i + 1}/${newActionNodes.length}: ${newNode.serviceId}/${newNode.reactionId}');

            final createdAction = await _areaService.createWorkflowNode(
              areaId: areaId,
              nodeType: 'action',
              serviceId: newNode.serviceId,
              reactionId: newNode.reactionId,
              config: newNode.config,
              positionX: newNode.positionX,
              positionY: newNode.positionY,
              label: newNode.label,
              token: token,
            );

            debugPrint('✅ New action node created: ${createdAction.id}');

            // Créer la connexion avec le node précédent
            if (lastNodeId != null) {
              debugPrint('🔗 Connecting $lastNodeId → ${createdAction.id}');
              await _areaService.createWorkflowConnection(
                areaId: areaId,
                sourceNodeId: lastNodeId,
                targetNodeId: createdAction.id,
                token: token,
              );
              debugPrint('✅ Connection created');
            }

            // Le node créé devient le dernier pour la prochaine itération
            lastNodeId = createdAction.id;
          }

          debugPrint('✅ All new nodes and connections created successfully');
        } else {
          debugPrint('ℹ️ No new nodes to create');
        }
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
            // Convertir la config mobile vers le format backend
            final backendConfig = SchemaConverter.convertMobileConfigToBackend(
              config,
              _triggerNode!.serviceId ?? '',
            );
            debugPrint('Saving trigger config to backend: $backendConfig');
            await _areaService.updateWorkflowNode(
              nodeId: _triggerNode!.id,
              config: backendConfig,
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

        if (config != null && mounted) {
          // Charger l'outputSchema du nouveau trigger
          final authRepo = context.read<AuthRepository>();
          final token = await authRepo.getToken();
          Map<String, dynamic>? outputSchema;

          if (token != null) {
            outputSchema = await _moduleConfigService.getOutputSchemaByName(
              moduleName: result['service'],
              actionOrTriggerName: result['name'],
              type: 'trigger',
              token: token,
            );
            debugPrint('📦 Loaded outputSchema for new trigger: $outputSchema');
          }

          if (mounted) {
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
  }

  Future<void> _editAction(WorkflowNode node) async {
    // Trouver la node précédente dans le workflow (linéaire)
    final nodeIndex = _actionNodes.indexOf(node);
    WorkflowNode? previousNode;

    if (nodeIndex == 0) {
      // Première action → node précédente = trigger
      previousNode = _triggerNode;
    } else if (nodeIndex > 0) {
      // Action suivante → node précédente = action précédente dans la liste
      previousNode = _actionNodes[nodeIndex - 1];
    }

    Map<String, dynamic>? previousOutputSchema;
    String? previousNodeName;

    if (previousNode != null) {
      // Charger l'outputSchema de la node précédente
      final authRepo = context.read<AuthRepository>();
      final token = await authRepo.getToken();

      if (token != null) {
        if (!previousNode.id.startsWith('temp_')) {
          // Node existante - charger via API
          previousOutputSchema = await _moduleConfigService.getNodeOutputSchema(
            nodeId: previousNode.id,
            token: token,
          );
        } else if (previousNode.serviceId != null &&
                   (previousNode.actionId != null || previousNode.reactionId != null)) {
          // Nouvelle node - charger via nom
          final actionName = previousNode.nodeType == 'trigger'
              ? previousNode.actionId
              : previousNode.reactionId;

          previousOutputSchema = await _moduleConfigService.getOutputSchemaByName(
            moduleName: previousNode.serviceId!,
            actionOrTriggerName: actionName!,
            type: previousNode.nodeType,
            token: token,
          );
        }

        previousNodeName = previousNode.nodeType == 'trigger'
            ? _getTriggerDisplayText()
            : _getActionDisplayText(previousNode);
      }
    }

    debugPrint('✏️ Editing action at index $nodeIndex - previous node: $previousNodeName');
    debugPrint('✏️ Previous outputSchema: $previousOutputSchema');

    if (!mounted) return;

    // Modifier une action existante
    final config = await NodeConfigHelper.openConfigScreen(
      context: context,
      nodeId: node.id, // Passer le nodeId pour charger via l'API
      nodeType: 'action',
      serviceName: node.serviceId ?? '',
      actionName: node.reactionId ?? '',
      description: _getActionDisplayText(node),
      existingConfig: node.config,
      previousNodeOutputSchema: previousOutputSchema,
      previousNodeName: previousNodeName,
    );

    if (config != null && mounted) {
      try {
        // Sauvegarder la configuration sur le backend via PATCH
        final authRepo = context.read<AuthRepository>();
        final token = await authRepo.getToken();

        if (token != null && mounted) {
          // Convertir la config mobile vers le format backend
          final backendConfig = SchemaConverter.convertMobileConfigToBackend(
            config,
            node.serviceId ?? '',
          );
          debugPrint('Saving action config to backend: $backendConfig');
          await _areaService.updateWorkflowNode(
            nodeId: node.id,
            config: backendConfig,
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
      // Déterminer la node précédente (dernière action ou trigger si aucune action)
      WorkflowNode? previousNode;
      if (_actionNodes.isNotEmpty) {
        previousNode = _actionNodes.last;
      } else {
        previousNode = _triggerNode;
      }

      // Charger l'outputSchema de la node précédente
      Map<String, dynamic>? previousOutputSchema;
      String? previousNodeName;

      if (previousNode != null) {
        final authRepo = context.read<AuthRepository>();
        final token = await authRepo.getToken();

        if (token != null) {
          if (!previousNode.id.startsWith('temp_')) {
            // Node existante
            previousOutputSchema = await _moduleConfigService.getNodeOutputSchema(
              nodeId: previousNode.id,
              token: token,
            );
          } else if (previousNode.serviceId != null &&
                     (previousNode.actionId != null || previousNode.reactionId != null)) {
            // Nouvelle node
            final actionName = previousNode.nodeType == 'trigger'
                ? previousNode.actionId
                : previousNode.reactionId;

            previousOutputSchema = await _moduleConfigService.getOutputSchemaByName(
              moduleName: previousNode.serviceId!,
              actionOrTriggerName: actionName!,
              type: previousNode.nodeType,
              token: token,
            );
          }

          previousNodeName = previousNode.nodeType == 'trigger'
              ? _getTriggerDisplayText()
              : _getActionDisplayText(previousNode);
        }
      }

      debugPrint('➕ Adding new action after: $previousNodeName');
      debugPrint('➕ Previous outputSchema: $previousOutputSchema');

      if (!mounted) return;

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
        previousNodeOutputSchema: previousOutputSchema,
        previousNodeName: previousNodeName,
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
          title: !_isLoading
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
                          onPressed: _isLoading ? null : _saveArea,
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
                            'Enregistrer',
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
        body: _isLoading
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const CircularProgressIndicator(
                    strokeWidth: 3,
                    valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF4CAF50)),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Chargement...',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey[600],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildNameSection(),
                  const SizedBox(height: 20),
                  _buildDescriptionSection(),
                  const SizedBox(height: 32),
                  _buildWorkflowSection(),
                  const SizedBox(height: 80),
                ],
              ),
            ),
      ),
    );
  }

  Widget _buildNameSection() {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Colors.white, Color(0xFFFAFAFA)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF4CAF50).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.title,
                    color: Color(0xFF4CAF50),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                const Text(
                  'Nom de l\'Area',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1A1A1A),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _nameController,
              style: const TextStyle(fontSize: 16),
              decoration: InputDecoration(
                hintText: 'ex: Envoyer une notification chaque matin',
                hintStyle: TextStyle(color: Colors.grey[400]),
                filled: true,
                fillColor: const Color(0xFFF8F9FA),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey[200]!),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFF4CAF50), width: 2),
                ),
                contentPadding: const EdgeInsets.all(16),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDescriptionSection() {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Colors.white, Color(0xFFFAFAFA)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          initiallyExpanded: _isDescriptionExpanded,
          onExpansionChanged: (expanded) {
            setState(() {
              _isDescriptionExpanded = expanded;
            });
          },
          tilePadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          childrenPadding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
          leading: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFF4CAF50).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              Icons.description,
              color: Color(0xFF4CAF50),
              size: 20,
            ),
          ),
          title: Row(
            children: [
              const Text(
                'Description',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1A1A1A),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '(optionnel)',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[500],
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ),
          children: [
            TextField(
              controller: _descriptionController,
              maxLines: 3,
              style: const TextStyle(fontSize: 16),
              decoration: InputDecoration(
                hintText: 'Ajoutez une description pour cette Area...',
                hintStyle: TextStyle(color: Colors.grey[400]),
                filled: true,
                fillColor: const Color(0xFFF8F9FA),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey[200]!),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFF4CAF50), width: 2),
                ),
                contentPadding: const EdgeInsets.all(16),
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
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF4CAF50), Color(0xFF388E3C)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.account_tree,
                color: Colors.white,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'Workflow',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1A1A1A),
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),

        // IF (Trigger)
        _buildTriggerCard(),

        // Connector
        _buildConnector(),

        // THEN (Actions)
        ..._actionNodes.asMap().entries.map((entry) {
          final index = entry.key;
          final node = entry.value;
          return Column(
            children: [
              _buildActionCard(node, index),
              if (index < _actionNodes.length - 1) _buildConnector(),
            ],
          );
        }),

        // Add Action Button
        if (_actionNodes.isNotEmpty) _buildConnector(),
        _buildAddActionButton(),
      ],
    );
  }

  Widget _buildTriggerCard() {
    final hasTrigger = _triggerNode != null;
    
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: hasTrigger 
            ? [const Color(0xFF4CAF50), const Color(0xFF388E3C)]
            : [Colors.grey[100]!, Colors.grey[200]!],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: hasTrigger 
              ? const Color(0xFF4CAF50).withOpacity(0.3)
              : Colors.black.withOpacity(0.05),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _editTrigger(),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.9),
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Icon(
                    Icons.flash_on_rounded,
                    color: hasTrigger ? const Color(0xFF4CAF50) : Colors.grey[400],
                    size: 32,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.25),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          'SI',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: hasTrigger ? Colors.white : Colors.grey[700],
                            letterSpacing: 1.2,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _getTriggerDisplayText(),
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          color: hasTrigger ? Colors.white : Colors.grey[700],
                        ),
                      ),
                      if (_triggerNode != null && _triggerNode!.config.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(
                            _formatTriggerConfig(_triggerNode!),
                            style: TextStyle(
                              fontSize: 13,
                              color: hasTrigger 
                                ? Colors.white.withOpacity(0.9)
                                : Colors.grey[600],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                Icon(
                  Icons.chevron_right_rounded,
                  color: hasTrigger ? Colors.white : Colors.grey[400],
                  size: 28,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _getTriggerDisplayText() {
    if (_triggerNode == null) return 'Choisir un déclencheur';

    final serviceName = _triggerNode!.serviceId ?? '';
    final triggerName = _triggerNode!.actionId ?? '';

    // Formatage du nom du trigger
    if (serviceName == 'timer') {
      if (triggerName == 'every_x_minutes') {
        return 'Timer : Toutes les X minutes';
      } else if (triggerName == 'daily_at_time') {
        return 'Timer : Tous les jours à heure fixe';
      } else if (triggerName == 'every_weekday') {
        return 'Timer : Chaque jour de la semaine';
      }
    }

    if (serviceName == 'discord') {
      if (triggerName == 'on_message_created') {
        return 'Discord : Nouveau message';
      } else if (triggerName == 'on_member_join') {
        return 'Discord : Nouveau membre';
      } else if (triggerName == 'on_reaction_added') {
        return 'Discord : Réaction ajoutée';
      }
    }

    return _triggerNode!.label ?? 'Déclencheur';
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
          return 'Toutes les $interval minute${interval == 1 ? '' : 's'}';
        }
      } else if (triggerName == 'daily_at_time') {
        final time = config['time'];
        final timezone = config['timezone'] ?? 'Europe/Paris';
        if (time != null) {
          return 'À $time ($timezone)';
        }
      } else if (triggerName == 'every_weekday') {
        final time = config['time'];
        if (time != null) {
          return 'Jours de la semaine à $time';
        }
      }
    }

    // Discord triggers
    if (serviceName == 'discord') {
      if (triggerName == 'on_message_created') {
        final channelId = config['channelId'];
        final keyword = config['keyword'];
        if (channelId != null) {
          return 'Salon : $channelId${keyword != null && keyword.isNotEmpty ? ' - Mot-clé : "$keyword"' : ''}';
        }
      } else if (triggerName == 'on_member_join') {
        final guildId = config['guildId'];
        return 'Serveur : $guildId';
      } else if (triggerName == 'on_reaction_added') {
        final channelId = config['channelId'];
        final emoji = config['emoji'];
        if (channelId != null) {
          return 'Salon : $channelId${emoji != null && emoji.isNotEmpty ? ' - Emoji : $emoji' : ''}';
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
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Column(
            children: [
              Container(
                width: 3,
                height: 20,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.grey[300]!,
                      const Color(0xFF4CAF50).withOpacity(0.4),
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: const Color(0xFF4CAF50).withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.arrow_downward,
                  size: 14,
                  color: Color(0xFF4CAF50),
                ),
              ),
              Container(
                width: 3,
                height: 20,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      const Color(0xFF4CAF50).withOpacity(0.4),
                      Colors.grey[300]!,
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionCard(WorkflowNode node, int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF4CAF50), Color(0xFF388E3C)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF4CAF50).withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _editAction(node),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.9),
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.check_circle_rounded,
                    color: Color(0xFF4CAF50),
                    size: 32,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.25),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          'ALORS ${index + 1}',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            letterSpacing: 1.2,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _getActionDisplayText(node),
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      if (node.config.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(
                            _formatActionConfig(node),
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.white.withOpacity(0.9),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.close_rounded, color: Colors.white, size: 20),
                    padding: EdgeInsets.zero,
                    onPressed: () async {
                      // Si c'est une Area existante et que le node a un ID réel (pas temporaire)
                      if (widget.areaId != null && !node.id.startsWith('temp_')) {
                        try {
                          final authRepo = context.read<AuthRepository>();
                          final token = await authRepo.getToken();

                          if (token != null) {
                            debugPrint('🗑️ Deleting node from backend: ${node.id}');
                            await _areaService.deleteWorkflowNode(
                              nodeId: node.id,
                              token: token,
                            );
                            debugPrint('✅ Node deleted successfully from backend');
                          }
                        } catch (e) {
                          debugPrint('❌ Error deleting node from backend: $e');
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Erreur lors de la suppression: ${e.toString()}'),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                          return; // Ne pas supprimer localement si l'API a échoué
                        }
                      } else {
                        debugPrint('🗑️ Removing temporary node locally: ${node.id}');
                      }

                      // Supprimer le node de la liste locale
                      if (mounted) {
                        setState(() {
                          _actionNodes.remove(node);
                        });
                      }
                    },
                  ),
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
        return 'Console : Logger un message';
      }
    }

    // Discord actions
    if (serviceName == 'discord') {
      if (actionName == 'send_message') {
        return 'Discord : Envoyer un message';
      } else if (actionName == 'add_role') {
        return 'Discord : Ajouter un rôle';
      } else if (actionName == 'kick_member') {
        return 'Discord : Expulser un membre';
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
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFF4CAF50).withOpacity(0.3),
          width: 2,
        ),
        gradient: LinearGradient(
          colors: [
            const Color(0xFF4CAF50).withOpacity(0.05),
            const Color(0xFF4CAF50).withOpacity(0.1),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: _selectAction,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF4CAF50).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.add_rounded,
                    color: Color(0xFF4CAF50),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                const Text(
                  'Ajouter une action',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF4CAF50),
                  ),
                ),
              ],
            ),
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
