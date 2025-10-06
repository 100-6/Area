import 'package:flutter/material.dart';

/// Thème de l'application avec palette verte
class AppTheme {
  // 🎨 Palette de couleurs verte

  // Verts
  static const Color lightGreen = Color(0xFFA7F0BA);      // Vert clair (accent principal)
  static const Color mediumGreen = Color(0xFF48C774);     // Vert moyen (accent secondaire)
  static const Color darkGreen = Color(0xFF166534);       // Vert foncé (éléments & boutons)
  static const Color veryDarkGreen = Color(0xFF064E3B);   // Vert très foncé (texte/boutons actifs)

  // Gris
  static const Color lightGrey = Color(0xFFF4F4F5);       // Gris clair (fonds, séparateurs)
  static const Color mediumGrey = Color(0xFF9CA3AF);      // Gris moyen (texte secondaire, icônes)
  static const Color darkGrey = Color(0xFF111827);        // Gris foncé (texte principal)

  // Blanc
  static const Color white = Color(0xFFFFFFFF);           // Blanc (fonds, cartes)

  static ThemeData get light {
    return ThemeData(
      useMaterial3: true,
      fontFamily: 'Roboto',
      colorScheme: ColorScheme.fromSeed(
        seedColor: mediumGreen,
        brightness: Brightness.light,
        primary: mediumGreen,
        secondary: lightGreen,
        surface: white,
        onPrimary: white,
        onSecondary: darkGrey,
        onSurface: darkGrey,
      ),
      appBarTheme: const AppBarTheme(
        elevation: 0,
        centerTitle: true,
        backgroundColor: Colors.transparent,
        foregroundColor: darkGrey,
      ),
      cardTheme: CardThemeData(
        elevation: 4,
        color: white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: lightGrey,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: mediumGrey.withValues(alpha: 0.3)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: mediumGrey, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.red, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
      textSelectionTheme: const TextSelectionThemeData(
        cursorColor: darkGrey, // Couleur du curseur en noir
        selectionColor: mediumGrey, // Couleur de sélection en gris
        selectionHandleColor: mediumGreen, // Couleur des poignées de sélection en vert
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          backgroundColor: darkGreen,
          foregroundColor: white,
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ).copyWith(
          overlayColor: WidgetStateProperty.resolveWith<Color?>(
            (Set<WidgetState> states) {
              if (states.contains(WidgetState.hovered)) {
                return veryDarkGreen;
              }
              if (states.contains(WidgetState.pressed)) {
                return veryDarkGreen;
              }
              return null;
            },
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: darkGreen,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
    );
  }

  static ThemeData get dark {
    return ThemeData(
      useMaterial3: true,
      fontFamily: 'Roboto',
      colorScheme: ColorScheme.fromSeed(
        seedColor: mediumGreen,
        brightness: Brightness.dark,
        primary: mediumGreen,
        secondary: lightGreen,
        surface: darkGreen,
        onPrimary: white,
        onSecondary: white,
        onSurface: white,
      ),
      appBarTheme: const AppBarTheme(
        elevation: 0,
        centerTitle: true,
        backgroundColor: Colors.transparent,
        foregroundColor: white,
      ),
      cardTheme: CardThemeData(
        elevation: 4,
        color: darkGreen,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFFF4F4F5), // Gris clair
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: mediumGrey.withValues(alpha: 0.3)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: mediumGrey, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.red, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
      textSelectionTheme: const TextSelectionThemeData(
        cursorColor: white, // Couleur du curseur en blanc pour le thème sombre
        selectionColor: mediumGrey, // Couleur de sélection en gris
        selectionHandleColor: lightGreen, // Couleur des poignées de sélection en vert clair
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          backgroundColor: mediumGreen,
          foregroundColor: white,
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ).copyWith(
          overlayColor: WidgetStateProperty.resolveWith<Color?>(
            (Set<WidgetState> states) {
              if (states.contains(WidgetState.hovered)) {
                return lightGreen;
              }
              if (states.contains(WidgetState.pressed)) {
                return lightGreen;
              }
              return null;
            },
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: lightGreen,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
    );
  }
}