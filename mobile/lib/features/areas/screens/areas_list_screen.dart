import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/area.dart';
import '../services/area_service.dart';
import '../../auth/data/auth_repository.dart';
import 'area_editor_screen.dart';

class AreasListScreen extends StatefulWidget {
  const AreasListScreen({super.key});

  @override
  State<AreasListScreen> createState() => _AreasListScreenState();
}

class _AreasListScreenState extends State<AreasListScreen> with WidgetsBindingObserver {
  final AreaService _areaService = AreaService();
  List<Area> _areas = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadAreas();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    // Refresh quand l'app revient au premier plan
    if (state == AppLifecycleState.resumed) {
      _loadAreas();
    }
  }

  Future<void> _loadAreas() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final authRepo = context.read<AuthRepository>();
      final token = await authRepo.getToken();

      if (token == null || token.isEmpty) {
        setState(() {
          _error = 'Not authenticated';
          _isLoading = false;
        });
        return;
      }

      final areas = await _areaService.getAreas(token);
      setState(() {
        _areas = areas;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _toggleArea(Area area) async {
    try {
      final authRepo = context.read<AuthRepository>();
      final token = await authRepo.getToken();

      if (token == null || token.isEmpty) return;

      await _areaService.toggleArea(
        areaId: area.id,
        isActive: !area.isActive,
        token: token,
      );
      await _loadAreas();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: _buildBody(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const AreaEditorScreen(),
            ),
          ).then((_) => _loadAreas());
        },
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Create'),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text(_error!, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadAreas,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_areas.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.auto_awesome, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No applets yet',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Create your first automation',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadAreas,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 80, 16, 16),
        itemCount: _areas.length,
        itemBuilder: (context, index) {
          final area = _areas[index];
          return _buildAreaCard(area);
        },
      ),
    );
  }

  Widget _buildAreaCard(Area area) {
    return Dismissible(
      key: Key(area.id),
      direction: DismissDirection.endToStart,
      confirmDismiss: (direction) async {
        return await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Text('Delete Applet'),
            content: Text('Are you sure you want to delete "${area.name}"?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () => Navigator.pop(context, true),
                style: TextButton.styleFrom(foregroundColor: Colors.red),
                child: const Text('Delete'),
              ),
            ],
          ),
        );
      },
      onDismissed: (direction) async {
        try {
          final authRepo = context.read<AuthRepository>();
          final token = await authRepo.getToken();

          if (token != null && token.isNotEmpty) {
            await _areaService.deleteArea(
              areaId: area.id,
              token: token,
            );

            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: const Text('Applet deleted successfully'),
                  backgroundColor: Colors.green,
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              );
            }
          }
        } catch (e) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Error: ${e.toString()}'),
                backgroundColor: Colors.red,
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
            );
          }
          _loadAreas();
        }
      },
      background: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFFFF6B6B), Color(0xFFEE5A6F)],
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 24),
        child: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.delete_outline, color: Colors.white, size: 32),
            SizedBox(height: 4),
            Text('Delete', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: area.isActive
                ? [Colors.white, const Color(0xFFF8F9FA)]
                : [const Color(0xFFF5F5F5), const Color(0xFFEEEEEE)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
          border: Border.all(
            color: area.isActive
                ? Colors.green.withValues(alpha: 0.3)
                : Colors.grey.withValues(alpha: 0.2),
            width: 1.5,
          ),
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => AreaEditorScreen(areaId: area.id),
                ),
              ).then((_) => _loadAreas());
            },
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header avec nom et switch
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Icône status
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: area.isActive
                                ? [const Color(0xFF4CAF50), const Color(0xFF45a049)]
                                : [Colors.grey[400]!, Colors.grey[500]!],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: (area.isActive ? Colors.green : Colors.grey)
                                  .withValues(alpha: 0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Icon(
                          area.isActive ? Icons.bolt : Icons.power_settings_new,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 16),
                      // Nom et description
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              area.name,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                letterSpacing: -0.5,
                              ),
                            ),
                            if (area.description != null &&
                                area.description!.isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Text(
                                area.description!,
                                style: TextStyle(
                                  color: Colors.grey[600],
                                  fontSize: 13,
                                  height: 1.3,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Switch moderne
                      Transform.scale(
                        scale: 0.9,
                        child: Switch(
                          value: area.isActive,
                          onChanged: (_) => _toggleArea(area),
                          activeThumbColor: Colors.white,
                          activeTrackColor: const Color(0xFF4CAF50),
                          inactiveThumbColor: Colors.white,
                          inactiveTrackColor: Colors.grey[300],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Stats
                  Row(
                    children: [
                      // Runs
                      _buildModernStatChip(
                        icon: Icons.play_circle_outline,
                        label: '${area.executionCount}',
                        sublabel: 'runs',
                        gradient: const LinearGradient(
                          colors: [Color(0xFF4CAF50), Color(0xFF45a049)],
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Status
                      if (area.lastExecutionStatus != null)
                        _buildModernStatChip(
                          icon: area.lastExecutionStatus == 'success'
                              ? Icons.check_circle_outline
                              : Icons.error_outline,
                          label: area.lastExecutionStatus!,
                          gradient: LinearGradient(
                            colors: area.lastExecutionStatus == 'success'
                                ? [const Color(0xFF4CAF50), const Color(0xFF45a049)]
                                : [const Color(0xFFF44336), const Color(0xFFE53935)],
                          ),
                        ),
                      const Spacer(),
                      // Last triggered
                      if (area.lastTriggeredAt != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.access_time, size: 14, color: Colors.grey[600]),
                              const SizedBox(width: 6),
                              Text(
                                _formatDate(area.lastTriggeredAt!),
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[700],
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildModernStatChip({
    required IconData icon,
    required String label,
    String? sublabel,
    required Gradient gradient,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        gradient: gradient,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: Colors.white),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
          if (sublabel != null) ...[
            const SizedBox(width: 4),
            Text(
              sublabel,
              style: TextStyle(
                fontSize: 11,
                color: Colors.white.withValues(alpha: 0.9),
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 7) {
      return '${date.day}/${date.month}/${date.year}';
    } else if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }
}
