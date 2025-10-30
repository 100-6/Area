import 'package:flutter/material.dart';

/// Constantes pour les services (couleurs et icônes)
/// Fichier centralisé pour éviter la duplication
class ServiceConstants {
  /// URLs des logos des services (hardcodées depuis les configs backend)
  static String? getServiceIconUrl(String serviceName) {
    switch (serviceName.toLowerCase()) {
      case 'discord':
        return 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png';
      case 'github':
        return 'https://cdn-icons-png.flaticon.com/512/25/25231.png';
      case 'gitlab':
        return 'https://about.gitlab.com/images/press/logo/png/gitlab-icon-rgb.png';
      case 'dropbox':
        return 'https://cdn.prod.website-files.com/66c503d081b2f012369fc5d2/674000d6c0a42d41f8c331be_dropbox-2-logo-png-transparent.png';
      case 'google':
        return 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png';
      case 'gmail':
        return 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png';
      case 'outlook':
      case 'microsoft':
        return 'https://cdn-icons-png.flaticon.com/512/732/732223.png';
      case 'spotify':
        return 'https://storage.googleapis.com/pr-newsroom-wp/1/2023/05/Spotify_Primary_Logo_RGB_Green.png';
      case 'strava':
        return 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Strava_Logo.svg/2560px-Strava_Logo.svg.png';
      case 'reddit':
        return 'https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png';
      case 'openai':
        return 'https://static-00.iconduck.com/assets.00/openai-icon-2021x2048-4rpe5x7n.png';
      case 'telegram':
        return 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg';
      default:
        return null;
    }
  }

  /// Obtient la couleur d'un service
  static Color getServiceColor(String serviceName) {
    switch (serviceName.toLowerCase()) {
      // Services de temps/système
      case 'timer':
        return const Color(0xFF9C27B0); // Violet
      case 'console':
        return const Color(0xFFFF9800); // Orange
      case 'rss':
        return const Color(0xFFFF6B35); // Orange RSS
      case 'webhook':
        return const Color(0xFF607D8B); // Gris bleu

      // Services OAuth2 - Réseaux sociaux
      case 'discord':
        return const Color(0xFF5865F2); // Violet Discord
      case 'reddit':
        return const Color(0xFFFF4500); // Orange Reddit
      case 'telegram':
        return const Color(0xFF0088CC); // Bleu Telegram
      case 'slack':
        return const Color(0xFF4A154B); // Violet Slack

      // Services OAuth2 - Code/Dev
      case 'github':
        return const Color(0xFF24292E); // Noir GitHub
      case 'gitlab':
        return const Color(0xFFFC6D26); // Orange GitLab

      // Services OAuth2 - Stockage
      case 'dropbox':
        return const Color(0xFF0061FF); // Bleu Dropbox
      case 'google':
        return const Color(0xFF4285F4); // Bleu Google

      // Services OAuth2 - Email
      case 'gmail':
      case 'email':
        return const Color(0xFFEA4335); // Rouge Gmail
      case 'outlook':
      case 'microsoft':
        return const Color(0xFF0078D4); // Bleu Outlook

      // Services OAuth2 - Musique/Sport
      case 'spotify':
        return const Color(0xFF1DB954); // Vert Spotify
      case 'strava':
        return const Color(0xFFFC4C02); // Orange Strava

      // Services API Key
      case 'openai':
        return const Color(0xFF10A37F); // Vert OpenAI
      case 'shodan':
        return const Color(0xFFDC3F41); // Rouge Shodan

      // Par défaut
      default:
        return const Color(0xFF2196F3); // Bleu par défaut
    }
  }

  /// Obtient l'icône d'un service
  static IconData getServiceIcon(String serviceName) {
    switch (serviceName.toLowerCase()) {
      // Services de temps/système
      case 'timer':
        return Icons.schedule_rounded;
      case 'console':
        return Icons.terminal_rounded;
      case 'rss':
        return Icons.rss_feed;
      case 'webhook':
        return Icons.webhook;

      // Services OAuth2 - Réseaux sociaux
      case 'discord':
        return Icons.discord;
      case 'reddit':
        return Icons.forum_rounded;
      case 'telegram':
        return Icons.telegram;
      case 'slack':
        return Icons.chat_bubble_rounded;

      // Services OAuth2 - Code/Dev
      case 'github':
        return Icons.code_rounded;
      case 'gitlab':
        return Icons.source_rounded;

      // Services OAuth2 - Stockage
      case 'dropbox':
        return Icons.cloud_rounded;
      case 'google':
        return Icons.g_mobiledata_rounded;

      // Services OAuth2 - Email
      case 'gmail':
      case 'email':
        return Icons.email_rounded;
      case 'outlook':
      case 'microsoft':
        return Icons.email;

      // Services OAuth2 - Musique/Sport
      case 'spotify':
        return Icons.music_note_rounded;
      case 'strava':
        return Icons.directions_run_rounded;

      // Services API Key
      case 'openai':
        return Icons.auto_awesome_rounded;
      case 'shodan':
        return Icons.search_rounded;

      // Par défaut
      default:
        return Icons.widgets_rounded;
    }
  }

  /// Obtient la couleur sous forme d'entier (pour service_provider.dart)
  static int getServiceColorInt(String serviceName) {
    final color = getServiceColor(serviceName);
    return color.toARGB32();
  }
}
