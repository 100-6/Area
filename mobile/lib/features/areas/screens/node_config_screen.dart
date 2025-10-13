import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/discord_service.dart';
import '../../auth/data/auth_repository.dart';
import '../widgets/discord_bot_invite_dialog.dart';

/// Écran de configuration des paramètres d'un trigger ou d'une action
class NodeConfigScreen extends StatefulWidget {
  final String nodeType; // 'trigger' ou 'action'
  final String serviceName;
  final String actionName;
  final String description;
  final Map<String, dynamic>? existingConfig;

  const NodeConfigScreen({
    super.key,
    required this.nodeType,
    required this.serviceName,
    required this.actionName,
    required this.description,
    this.existingConfig,
  });

  @override
  State<NodeConfigScreen> createState() => _NodeConfigScreenState();
}

class _NodeConfigScreenState extends State<NodeConfigScreen> {
  final Map<String, dynamic> _config = {};
  final _formKey = GlobalKey<FormState>();

  // Controllers pour les différents types de paramètres
  final Map<String, TextEditingController> _controllers = {};

  // Discord state
  final DiscordService _discordService = DiscordService();
  List<DiscordGuild> _discordGuilds = [];
  List<DiscordChannel> _discordChannels = [];
  List<DiscordRole> _discordRoles = [];
  bool _loadingDiscordData = false;
  String? _selectedGuildId;
  bool _hasTriedLoadingGuilds = false;
  String? _loadGuildsError;

  @override
  void initState() {
    super.initState();

    // Pré-remplir la configuration si existante
    if (widget.existingConfig != null) {
      _config.addAll(widget.existingConfig!);
      // Pré-remplir les controllers pour les champs texte
      widget.existingConfig!.forEach((key, value) {
        if (value is String || value is int) {
          _controllers[key] = TextEditingController(text: value.toString());
        }
      });
      // Pré-sélectionner le guildId si présent
      if (_config['guildId'] != null) {
        _selectedGuildId = _config['guildId'].toString();
      }
    }

    // Charger les données Discord si nécessaire
    if (widget.serviceName == 'discord') {
      _loadDiscordGuilds();
      // Si un guildId existe déjà, charger les channels et roles
      if (_selectedGuildId != null) {
        _loadDiscordChannels(_selectedGuildId!);
        _loadDiscordRoles(_selectedGuildId!);
      }
    }
  }

  @override
  void dispose() {
    for (var controller in _controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _loadDiscordGuilds() async {
    setState(() {
      _loadingDiscordData = true;
      _hasTriedLoadingGuilds = true;
      _loadGuildsError = null;
    });

    try {
      final authRepo = context.read<AuthRepository>();
      final token = await authRepo.getToken();

      if (token == null || token.isEmpty) {
        setState(() {
          _loadingDiscordData = false;
          _loadGuildsError = 'Vous devez être connecté pour utiliser Discord';
        });
        return;
      }

      print('Fetching Discord guilds...');
      final guilds = await _discordService.getGuilds(token: token);
      print('Fetched ${guilds.length} guilds');

      // Si aucun serveur, afficher le dialog d'invitation
      if (guilds.isEmpty && mounted) {
        setState(() {
          _loadingDiscordData = false;
        });
        _showBotInviteDialog();
      } else {
        setState(() {
          _discordGuilds = guilds;
          _loadingDiscordData = false;
        });
      }
    } catch (e) {
      print('Error loading guilds: $e');
      setState(() {
        _loadingDiscordData = false;
        _loadGuildsError = 'Impossible de charger les serveurs Discord';
      });
    }
  }

  Future<void> _showBotInviteDialog() async {
    try {
      final authRepo = context.read<AuthRepository>();
      final token = await authRepo.getToken();

      if (token != null) {
        final inviteUrl = await _discordService.getBotInviteUrl(token: token);

        if (inviteUrl != null && mounted) {
          await showDialog(
            context: context,
            barrierDismissible: true,
            builder: (context) => DiscordBotInviteDialog(
              inviteUrl: inviteUrl,
              onBotAdded: () {
                // Recharger les serveurs après l'ajout du bot
                Future.delayed(const Duration(seconds: 2), () {
                  if (mounted) {
                    _loadDiscordGuilds();
                  }
                });
              },
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error getting bot invite URL: $e')),
        );
      }
    }
  }

  Future<void> _loadDiscordChannels(String guildId) async {
    try {
      final authRepo = context.read<AuthRepository>();
      final token = await authRepo.getToken();

      if (token != null) {
        print('Loading channels for guild: $guildId (type: ${guildId.runtimeType})');
        final channels = await _discordService.getChannels(
          guildId: guildId,
          token: token,
        );
        print('Loaded ${channels.length} channels');
        setState(() {
          _discordChannels = channels;
        });
      }
    } catch (e) {
      print('Error loading channels: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading channels: $e')),
        );
      }
    }
  }

  Future<void> _loadDiscordRoles(String guildId) async {
    try {
      final authRepo = context.read<AuthRepository>();
      final token = await authRepo.getToken();

      if (token != null) {
        final roles = await _discordService.getRoles(
          guildId: guildId,
          token: token,
        );
        setState(() {
          _discordRoles = roles;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading roles: $e')),
        );
      }
    }
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

    // Discord - on_message_created
    if (widget.serviceName == 'discord' && widget.actionName == 'on_message_created') {
      return [
        _buildDiscordGuildDropdown(
          key: 'guildId',
          label: 'Discord Server',
          required: true,
        ),
        const SizedBox(height: 16),
        _buildDiscordChannelDropdown(
          key: 'channelId',
          label: 'Channel',
          required: true,
        ),
        const SizedBox(height: 16),
        _buildTextField(
          key: 'keyword',
          label: 'Keyword (optional)',
          hint: 'Only trigger if message contains this keyword',
          required: false,
        ),
        const SizedBox(height: 16),
        _buildTextField(
          key: 'authorId',
          label: 'Author ID (optional)',
          hint: 'Only trigger for messages from this user',
          required: false,
        ),
        const SizedBox(height: 16),
        _buildSwitchField(
          key: 'ignoreBots',
          label: 'Ignore bots',
          description: 'Ignore messages from bots',
          defaultValue: true,
        ),
      ];
    }

    // Discord - on_member_join
    if (widget.serviceName == 'discord' && widget.actionName == 'on_member_join') {
      return [
        _buildDiscordGuildDropdown(
          key: 'guildId',
          label: 'Discord Server',
          required: true,
        ),
      ];
    }

    // Discord - on_reaction_added
    if (widget.serviceName == 'discord' && widget.actionName == 'on_reaction_added') {
      return [
        _buildDiscordGuildDropdown(
          key: 'guildId',
          label: 'Discord Server',
          required: true,
        ),
        const SizedBox(height: 16),
        _buildDiscordChannelDropdown(
          key: 'channelId',
          label: 'Channel',
          required: true,
        ),
        const SizedBox(height: 16),
        _buildTextField(
          key: 'messageId',
          label: 'Message ID (optional)',
          hint: 'Specific message ID to watch',
          required: false,
        ),
        const SizedBox(height: 16),
        _buildTextField(
          key: 'emoji',
          label: 'Emoji (optional)',
          hint: 'Specific emoji to watch (e.g., 👍)',
          required: false,
        ),
      ];
    }

    // Discord - send_message
    if (widget.serviceName == 'discord' && widget.actionName == 'send_message') {
      return [
        _buildDiscordGuildDropdown(
          key: 'guildId',
          label: 'Discord Server',
          required: true,
        ),
        const SizedBox(height: 16),
        _buildDiscordChannelDropdown(
          key: 'channelId',
          label: 'Channel',
          required: true,
        ),
        const SizedBox(height: 16),
        _buildTextAreaField(
          key: 'content',
          label: 'Message Content',
          hint: 'Message to send (supports variables like {{author.username}})',
          required: true,
          maxLength: 2000,
        ),
        const SizedBox(height: 16),
        _buildTextField(
          key: 'replyToMessageId',
          label: 'Reply to Message ID (optional)',
          hint: 'Reply to a specific message',
          required: false,
        ),
      ];
    }

    // Discord - add_role
    if (widget.serviceName == 'discord' && widget.actionName == 'add_role') {
      return [
        _buildDiscordGuildDropdown(
          key: 'guildId',
          label: 'Discord Server',
          required: true,
        ),
        const SizedBox(height: 16),
        _buildTextField(
          key: 'userId',
          label: 'User ID',
          hint: 'Discord user ID (17-19 digits, supports variables like {{author.id}})',
          required: true,
        ),
        const SizedBox(height: 16),
        _buildDiscordRoleDropdown(
          key: 'roleId',
          label: 'Role',
          required: true,
        ),
      ];
    }

    // Discord - kick_member
    if (widget.serviceName == 'discord' && widget.actionName == 'kick_member') {
      return [
        _buildDiscordGuildDropdown(
          key: 'guildId',
          label: 'Discord Server',
          required: true,
        ),
        const SizedBox(height: 16),
        _buildTextField(
          key: 'userId',
          label: 'User ID',
          hint: 'Discord user ID to kick (17-19 digits, supports variables like {{member.id}})',
          required: true,
        ),
        const SizedBox(height: 16),
        _buildTextField(
          key: 'reason',
          label: 'Reason (optional)',
          hint: 'Reason for kicking the member',
          required: false,
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
    // Ne créer le controller que s'il n'existe pas déjà (pré-rempli dans initState)
    if (!_controllers.containsKey(key)) {
      _controllers[key] = TextEditingController();
    }

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
    // Ne créer le controller que s'il n'existe pas déjà (pré-rempli dans initState)
    if (!_controllers.containsKey(key)) {
      _controllers[key] = TextEditingController();
    }

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
    // Ne créer le controller que s'il n'existe pas déjà (pré-rempli dans initState)
    if (!_controllers.containsKey(key)) {
      _controllers[key] = TextEditingController();
    }

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

  Widget _buildTextAreaField({
    required String key,
    required String label,
    required String hint,
    bool required = false,
    int? maxLength,
  }) {
    // Ne créer le controller que s'il n'existe pas déjà (pré-rempli dans initState)
    if (!_controllers.containsKey(key)) {
      _controllers[key] = TextEditingController();
    }

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
              maxLines: 4,
              maxLength: maxLength,
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

  Widget _buildSwitchField({
    required String key,
    required String label,
    required String description,
    bool defaultValue = false,
  }) {
    // Utiliser la valeur existante si disponible, sinon la valeur par défaut
    bool value = _config.containsKey(key) ? (_config[key] as bool? ?? defaultValue) : defaultValue;
    if (!_config.containsKey(key)) {
      _config[key] = value;
    }

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
                    label,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            StatefulBuilder(
              builder: (context, setState) {
                return Switch(
                  value: value,
                  onChanged: (newValue) {
                    setState(() {
                      value = newValue;
                      _config[key] = newValue;
                    });
                  },
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  /// Dropdown pour sélectionner un serveur Discord
  Widget _buildDiscordGuildDropdown({
    required String key,
    required String label,
    required bool required,
  }) {
    if (_loadingDiscordData) {
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
              const Center(child: CircularProgressIndicator()),
            ],
          ),
        ),
      );
    }

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
            if (_discordGuilds.isEmpty)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: _loadGuildsError != null ? Colors.red[50] : Colors.grey[100],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: _loadGuildsError != null ? Colors.red[300]! : Colors.grey[300]!,
                  ),
                ),
                child: Column(
                  children: [
                    Icon(
                      _loadGuildsError != null ? Icons.error_outline : Icons.discord,
                      size: 48,
                      color: _loadGuildsError != null ? Colors.red : const Color(0xFF5865F2),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _loadGuildsError != null
                          ? 'Erreur de chargement'
                          : 'Aucun serveur Discord trouvé',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _loadGuildsError ?? 'Vous devez ajouter le bot à votre serveur Discord',
                      style: TextStyle(
                        color: _loadGuildsError != null ? Colors.red[700] : Colors.grey,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (_loadGuildsError == null)
                          ElevatedButton.icon(
                            onPressed: _showBotInviteDialog,
                            icon: const Icon(Icons.add),
                            label: const Text('Inviter le bot'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF5865F2),
                              foregroundColor: Colors.white,
                            ),
                          ),
                        if (_loadGuildsError == null) const SizedBox(width: 12),
                        IconButton(
                          onPressed: () {
                            setState(() {
                              _hasTriedLoadingGuilds = false;
                              _loadGuildsError = null;
                            });
                            _loadDiscordGuilds();
                          },
                          icon: const Icon(Icons.refresh),
                          tooltip: 'Rafraîchir',
                          style: IconButton.styleFrom(
                            backgroundColor: Colors.grey[200],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              )
            else
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  hintText: 'Select a server',
                ),
                initialValue: _config[key],
                items: _discordGuilds.map((guild) {
                  return DropdownMenuItem(
                    value: guild.id,
                    child: Text(
                      '${guild.name} (${guild.memberCount} members)',
                      overflow: TextOverflow.ellipsis,
                    ),
                  );
                }).toList(),
                validator: required
                    ? (value) {
                        if (value == null || value.isEmpty) {
                          return 'This field is required';
                        }
                        return null;
                      }
                    : null,
                onChanged: (value) {
                  if (value != null) {
                    setState(() {
                      _config[key] = value;
                      _selectedGuildId = value;
                      _discordChannels = [];
                      _discordRoles = [];
                    });
                    _loadDiscordChannels(value);
                    _loadDiscordRoles(value);
                  }
                },
              ),
          ],
        ),
      ),
    );
  }

  /// Dropdown pour sélectionner un channel Discord
  Widget _buildDiscordChannelDropdown({
    required String key,
    required String label,
    required bool required,
  }) {
    // Vérifier si un guildId est configuré
    final configuredGuildId = _config['guildId'] as String?;

    // Si aucun serveur sélectionné, afficher un message
    if (configuredGuildId == null || configuredGuildId.isEmpty) {
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
                        'Sélectionnez d\'abord un serveur',
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

    // Si les channels ne sont pas encore chargés pour ce serveur
    if (_discordChannels.isEmpty || _selectedGuildId != configuredGuildId) {
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
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: const Row(
                  children: [
                    SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Chargement des channels...',
                        style: TextStyle(
                          color: Colors.grey,
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
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: 'Select a channel',
              ),
              initialValue: _config[key],
              items: _discordChannels.map((channel) {
                // Afficher uniquement les channels textuels (type 0, 5, 11, 15)
                final isTextChannel = [0, 5, 11, 15].contains(channel.type);
                final prefix = isTextChannel ? '#' : '🔊';

                return DropdownMenuItem(
                  value: channel.id,
                  child: Text('$prefix ${channel.name}'),
                );
              }).toList(),
              validator: required
                  ? (value) {
                      if (value == null || value.isEmpty) {
                        return 'This field is required';
                      }
                      return null;
                    }
                  : null,
              onChanged: (value) {
                if (value != null) {
                  setState(() {
                    _config[key] = value;
                  });
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  /// Dropdown pour sélectionner un rôle Discord
  Widget _buildDiscordRoleDropdown({
    required String key,
    required String label,
    required bool required,
  }) {
    // Vérifier si un guildId est configuré
    final configuredGuildId = _config['guildId'] as String?;

    // Si aucun serveur sélectionné, afficher un message
    if (configuredGuildId == null || configuredGuildId.isEmpty) {
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
                        'Sélectionnez d\'abord un serveur',
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

    // Si les rôles ne sont pas encore chargés pour ce serveur
    if (_discordRoles.isEmpty || _selectedGuildId != configuredGuildId) {
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
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: const Row(
                  children: [
                    SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Chargement des rôles...',
                        style: TextStyle(
                          color: Colors.grey,
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
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: 'Select a role',
              ),
              initialValue: _config[key],
              items: _discordRoles.map((role) {
                return DropdownMenuItem(
                  value: role.id,
                  child: Text(role.name),
                );
              }).toList(),
              validator: required
                  ? (value) {
                      if (value == null || value.isEmpty) {
                        return 'This field is required';
                      }
                      return null;
                    }
                  : null,
              onChanged: (value) {
                if (value != null) {
                  setState(() {
                    _config[key] = value;
                  });
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}
