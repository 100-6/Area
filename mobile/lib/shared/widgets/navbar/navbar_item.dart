import 'package:flutter/material.dart';

class NavbarItem {
  final String id;
  final String label;
  final IconData icon;
  final IconData selectedIcon;
  final String route;
  final Color? customColor;
  final VoidCallback? onTap;
  final bool enabled;

  const NavbarItem({
    required this.id,
    required this.label,
    required this.icon,
    required this.selectedIcon,
    required this.route,
    this.customColor,
    this.onTap,
    this.enabled = true,
  });

  NavbarItem copyWith({
    String? id,
    String? label,
    IconData? icon,
    IconData? selectedIcon,
    String? route,
    Color? customColor,
    VoidCallback? onTap,
    bool? enabled,
  }) {
    return NavbarItem(
      id: id ?? this.id,
      label: label ?? this.label,
      icon: icon ?? this.icon,
      selectedIcon: selectedIcon ?? this.selectedIcon,
      route: route ?? this.route,
      customColor: customColor ?? this.customColor,
      onTap: onTap ?? this.onTap,
      enabled: enabled ?? this.enabled,
    );
  }
}