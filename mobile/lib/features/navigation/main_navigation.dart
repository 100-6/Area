import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/navbar/navbar.dart';

class MainNavigation extends StatefulWidget {
  final Widget child;

  const MainNavigation({
    super.key,
    required this.child,
  });

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {

  List<NavbarItem> get _navbarItems => [
    const NavbarItem(
      id: 'dashboard',
      label: 'Dashboard',
      icon: Icons.dashboard_outlined,
      selectedIcon: Icons.dashboard,
      route: '/dashboard',
    ),
    const NavbarItem(
      id: 'profile',
      label: 'Compte',
      icon: Icons.person_outline,
      selectedIcon: Icons.person,
      route: '/profile',
    ),
    const NavbarItem(
      id: 'area',
      label: 'Area',
      icon: Icons.location_on_outlined,
      selectedIcon: Icons.location_on,
      route: '/area',
    ),
    const NavbarItem(
      id: 'settings',
      label: 'Settings',
      icon: Icons.settings_outlined,
      selectedIcon: Icons.settings,
      route: '/settings',
    ),
  ];

  NavbarConfig get _navbarConfig => NavbarConfig(
    height: 90,
    itemPadding: 12,
    iconSize: 24,
    selectedIconSize: 28,
    fontSize: 11,
    selectedFontSize: 12,
    fontWeight: FontWeight.w500,
    selectedFontWeight: FontWeight.w600,
    animationDuration: const Duration(milliseconds: 300),
    animationCurve: Curves.easeInOutCubic,
    borderRadius: BorderRadius.zero,
    showLabels: true,
    showBadges: true,
    showRipple: true,
    enableHaptics: true,
  );

  String get _currentRoute {
    final location = GoRouterState.of(context).uri.path;
    return location;
  }

  void _onItemTap(NavbarItem item) {
    if (item.route != _currentRoute) {
      context.go(item.route);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: widget.child,
      bottomNavigationBar: ResponsiveNavbar(
        items: _navbarItems,
        currentRoute: _currentRoute,
        onItemTap: _onItemTap,
        config: _navbarConfig,
        badges: const {},
      ),
    );
  }
}