import 'package:flutter/material.dart';

class NavbarConfig {
  final double height;
  final double itemPadding;
  final double iconSize;
  final double selectedIconSize;
  final double fontSize;
  final double selectedFontSize;
  final FontWeight fontWeight;
  final FontWeight selectedFontWeight;
  final Duration animationDuration;
  final Curve animationCurve;
  final Color? backgroundColor;
  final Color? selectedColor;
  final Color? unselectedColor;
  final Color? shadowColor;
  final double shadowBlurRadius;
  final double shadowSpreadRadius;
  final Offset shadowOffset;
  final BorderRadius? borderRadius;
  final double? elevation;
  final bool showLabels;
  final bool showBadges;
  final bool showRipple;
  final bool enableHaptics;

  const NavbarConfig({
    this.height = 70,
    this.itemPadding = 16,
    this.iconSize = 24,
    this.selectedIconSize = 26,
    this.fontSize = 12,
    this.selectedFontSize = 13,
    this.fontWeight = FontWeight.w500,
    this.selectedFontWeight = FontWeight.w600,
    this.animationDuration = const Duration(milliseconds: 250),
    this.animationCurve = Curves.easeInOutCubic,
    this.backgroundColor,
    this.selectedColor,
    this.unselectedColor,
    this.shadowColor,
    this.shadowBlurRadius = 20,
    this.shadowSpreadRadius = 0,
    this.shadowOffset = const Offset(0, -4),
    this.borderRadius,
    this.elevation,
    this.showLabels = true,
    this.showBadges = true,
    this.showRipple = true,
    this.enableHaptics = true,
  });

  NavbarConfig copyWith({
    double? height,
    double? itemPadding,
    double? iconSize,
    double? selectedIconSize,
    double? fontSize,
    double? selectedFontSize,
    FontWeight? fontWeight,
    FontWeight? selectedFontWeight,
    Duration? animationDuration,
    Curve? animationCurve,
    Color? backgroundColor,
    Color? selectedColor,
    Color? unselectedColor,
    Color? shadowColor,
    double? shadowBlurRadius,
    double? shadowSpreadRadius,
    Offset? shadowOffset,
    BorderRadius? borderRadius,
    double? elevation,
    bool? showLabels,
    bool? showBadges,
    bool? showRipple,
    bool? enableHaptics,
  }) {
    return NavbarConfig(
      height: height ?? this.height,
      itemPadding: itemPadding ?? this.itemPadding,
      iconSize: iconSize ?? this.iconSize,
      selectedIconSize: selectedIconSize ?? this.selectedIconSize,
      fontSize: fontSize ?? this.fontSize,
      selectedFontSize: selectedFontSize ?? this.selectedFontSize,
      fontWeight: fontWeight ?? this.fontWeight,
      selectedFontWeight: selectedFontWeight ?? this.selectedFontWeight,
      animationDuration: animationDuration ?? this.animationDuration,
      animationCurve: animationCurve ?? this.animationCurve,
      backgroundColor: backgroundColor ?? this.backgroundColor,
      selectedColor: selectedColor ?? this.selectedColor,
      unselectedColor: unselectedColor ?? this.unselectedColor,
      shadowColor: shadowColor ?? this.shadowColor,
      shadowBlurRadius: shadowBlurRadius ?? this.shadowBlurRadius,
      shadowSpreadRadius: shadowSpreadRadius ?? this.shadowSpreadRadius,
      shadowOffset: shadowOffset ?? this.shadowOffset,
      borderRadius: borderRadius ?? this.borderRadius,
      elevation: elevation ?? this.elevation,
      showLabels: showLabels ?? this.showLabels,
      showBadges: showBadges ?? this.showBadges,
      showRipple: showRipple ?? this.showRipple,
      enableHaptics: enableHaptics ?? this.enableHaptics,
    );
  }
}