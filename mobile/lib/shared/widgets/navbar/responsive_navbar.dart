import 'package:flutter/material.dart';
import 'dart:ui';
import 'navbar_item.dart';
import 'navbar_config.dart';
import 'navbar_item_widget.dart';

class ResponsiveNavbar extends StatefulWidget {
  final List<NavbarItem> items;
  final String currentRoute;
  final Function(NavbarItem) onItemTap;
  final NavbarConfig? config;
  final Map<String, int>? badges;

  const ResponsiveNavbar({
    super.key,
    required this.items,
    required this.currentRoute,
    required this.onItemTap,
    this.config,
    this.badges,
  });

  @override
  State<ResponsiveNavbar> createState() => _ResponsiveNavbarState();
}

class _ResponsiveNavbarState extends State<ResponsiveNavbar>
    with TickerProviderStateMixin {
  late NavbarConfig _config;
  late AnimationController _slideController;
  late Animation<double> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _slideController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _slideAnimation = Tween<double>(
      begin: 1.0,
      end: 0.0,
    ).animate(CurvedAnimation(
      parent: _slideController,
      curve: Curves.easeInOut,
    ));
    _slideController.forward();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _initializeConfig();
  }

  void _initializeConfig() {
    final theme = Theme.of(context);
    _config = (widget.config ?? const NavbarConfig()).copyWith(
      backgroundColor: widget.config?.backgroundColor ?? theme.scaffoldBackgroundColor,
      selectedColor: widget.config?.selectedColor ?? theme.colorScheme.primary,
      unselectedColor: widget.config?.unselectedColor ?? Colors.grey.shade600,
      shadowColor: widget.config?.shadowColor ?? Colors.black.withValues(alpha: 0.1),
    );
  }

  @override
  void didUpdateWidget(ResponsiveNavbar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.config != oldWidget.config) {
      _initializeConfig();
    }
  }

  @override
  void dispose() {
    _slideController.dispose();
    super.dispose();
  }

  int get _selectedIndex {
    final index = widget.items.indexWhere((item) => item.route == widget.currentRoute);
    return index >= 0 ? index : 0;
  }

  void _handleItemTap(NavbarItem item) {
    if (item.onTap != null) {
      item.onTap!();
    } else {
      widget.onItemTap(item);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _slideAnimation,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(0, _slideAnimation.value * 100),
          child: _buildNavbar(),
        );
      },
    );
  }

  Widget _buildNavbar() {
    return ClipRRect(
      borderRadius: _config.borderRadius ?? BorderRadius.zero,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
        child: Container(
          height: _config.height,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.7),
            borderRadius: _config.borderRadius,
            boxShadow: [
              BoxShadow(
                color: _config.shadowColor ?? Colors.black.withValues(alpha: 0.08),
                blurRadius: _config.shadowBlurRadius * 1.5,
                offset: _config.shadowOffset,
                spreadRadius: _config.shadowSpreadRadius,
              ),
            ],
          ),
          child: SafeArea(
            child: _buildNavbarContent(),
          ),
        ),
      ),
    );
  }


  Widget _buildNavbarContent() {
    // Responsive behavior
    final screenWidth = MediaQuery.of(context).size.width;
    final isCompact = screenWidth < 600;

    if (isCompact && widget.items.length > 5) {
      return _buildCompactNavbar();
    }

    return _buildStandardNavbar();
  }

  Widget _buildStandardNavbar() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: widget.items.asMap().entries.map((entry) {
        final index = entry.key;
        final item = entry.value;
        final isSelected = index == _selectedIndex;

        return NavbarItemWidget(
          key: ValueKey(item.id),
          item: item,
          config: _config,
          isSelected: isSelected,
          onTap: () => _handleItemTap(item),
          badgeCount: widget.badges?[item.id],
        );
      }).toList(),
    );
  }

  Widget _buildCompactNavbar() {
    // For more than 5 items on small screens, show only selected and most important ones
    final importantItems = widget.items.take(4).toList();
    final moreItems = widget.items.skip(4).toList();
    final selectedItem = widget.items[_selectedIndex];
    final showMore = moreItems.isNotEmpty;

    List<NavbarItem> displayItems = List.from(importantItems);
    if (showMore) {
      displayItems.add(
        NavbarItem(
          id: 'more',
          label: 'Plus',
          icon: Icons.more_horiz,
          selectedIcon: Icons.more_horiz,
          route: 'more',
          onTap: () => _showMoreDialog(moreItems),
        ),
      );
    }

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: displayItems.map((item) {
        final isSelected = item.id == selectedItem.id ||
                          (item.id == 'more' && moreItems.contains(selectedItem));

        return NavbarItemWidget(
          key: ValueKey(item.id),
          item: item,
          config: _config,
          isSelected: isSelected,
          onTap: () => _handleItemTap(item),
          badgeCount: widget.badges?[item.id],
        );
      }).toList(),
    );
  }

  void _showMoreDialog(List<NavbarItem> moreItems) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: moreItems.map((item) {
            return ListTile(
              leading: Icon(item.icon),
              title: Text(item.label),
              onTap: () {
                Navigator.of(context).pop();
                _handleItemTap(item);
              },
              trailing: widget.badges?[item.id] != null &&
                       widget.badges![item.id]! > 0
                  ? Badge(
                      label: Text(widget.badges![item.id].toString()),
                    )
                  : null,
            );
          }).toList(),
        ),
      ),
    );
  }
}