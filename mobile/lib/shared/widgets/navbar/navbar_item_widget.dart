import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'navbar_item.dart';
import 'navbar_config.dart';

class NavbarItemWidget extends StatefulWidget {
  final NavbarItem item;
  final NavbarConfig config;
  final bool isSelected;
  final VoidCallback onTap;
  final int? badgeCount;

  const NavbarItemWidget({
    super.key,
    required this.item,
    required this.config,
    required this.isSelected,
    required this.onTap,
    this.badgeCount,
  });

  @override
  State<NavbarItemWidget> createState() => _NavbarItemWidgetState();
}

class _NavbarItemWidgetState extends State<NavbarItemWidget>
    with TickerProviderStateMixin {
  late AnimationController _scaleController;
  late AnimationController _fadeController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      duration: const Duration(milliseconds: 150),
      vsync: this,
    );
    _fadeController = AnimationController(
      duration: widget.config.animationDuration,
      vsync: this,
    );

    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.95,
    ).animate(CurvedAnimation(
      parent: _scaleController,
      curve: Curves.easeInOut,
    ));

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _fadeController,
      curve: widget.config.animationCurve,
    ));

    if (widget.isSelected) {
      _fadeController.forward();
    }
  }

  @override
  void didUpdateWidget(NavbarItemWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isSelected != oldWidget.isSelected) {
      if (widget.isSelected) {
        _fadeController.forward();
      } else {
        _fadeController.reverse();
      }
    }
  }

  @override
  void dispose() {
    _scaleController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  void _handleTap() {
    if (!widget.item.enabled) return;

    if (widget.config.enableHaptics) {
      HapticFeedback.lightImpact();
    }

    _scaleController.forward().then((_) {
      _scaleController.reverse();
    });

    widget.onTap();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final selectedColor = widget.item.customColor ??
                         widget.config.selectedColor ??
                         theme.colorScheme.primary;
    final unselectedColor = widget.config.unselectedColor ??
                           Colors.grey.shade600;

    return Expanded(
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: GestureDetector(
              onTap: _handleTap,
              behavior: HitTestBehavior.opaque,
              child: Container(
                height: widget.config.height,
                padding: EdgeInsets.symmetric(
                  horizontal: widget.config.itemPadding,
                  vertical: 8,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _buildIcon(selectedColor, unselectedColor),
                    if (widget.config.showLabels) ...[
                      const SizedBox(height: 4),
                      _buildLabel(selectedColor, unselectedColor),
                    ],
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildIcon(Color selectedColor, Color unselectedColor) {
    return AnimatedBuilder(
      animation: _fadeAnimation,
      builder: (context, child) {
        return Stack(
          alignment: Alignment.center,
          children: [
            // Background circle animation
            AnimatedContainer(
              duration: widget.config.animationDuration,
              curve: widget.config.animationCurve,
              width: widget.isSelected ? 40 : 0,
              height: widget.isSelected ? 40 : 0,
              decoration: BoxDecoration(
                color: selectedColor.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
            ),
            // Icon with badge
            Stack(
              clipBehavior: Clip.none,
              children: [
                AnimatedSwitcher(
                  duration: widget.config.animationDuration,
                  child: Icon(
                    widget.isSelected ? widget.item.selectedIcon : widget.item.icon,
                    key: ValueKey(widget.isSelected),
                    size: widget.isSelected
                        ? widget.config.selectedIconSize
                        : widget.config.iconSize,
                    color: widget.isSelected ? selectedColor : unselectedColor,
                  ),
                ),
                if (widget.config.showBadges &&
                    widget.badgeCount != null &&
                    widget.badgeCount! > 0)
                  Positioned(
                    right: -6,
                    top: -6,
                    child: AnimatedScale(
                      scale: widget.isSelected ? 1.1 : 1.0,
                      duration: widget.config.animationDuration,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 16,
                          minHeight: 16,
                        ),
                        child: Text(
                          widget.badgeCount! > 99 ? '99+' : widget.badgeCount.toString(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ],
        );
      },
    );
  }

  Widget _buildLabel(Color selectedColor, Color unselectedColor) {
    return AnimatedDefaultTextStyle(
      duration: widget.config.animationDuration,
      style: TextStyle(
        fontSize: widget.isSelected
            ? widget.config.selectedFontSize
            : widget.config.fontSize,
        fontWeight: widget.isSelected
            ? widget.config.selectedFontWeight
            : widget.config.fontWeight,
        color: widget.isSelected ? selectedColor : unselectedColor,
      ),
      child: Text(
        widget.item.label,
        textAlign: TextAlign.center,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
    );
  }
}