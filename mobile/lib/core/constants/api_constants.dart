/// Constantes pour l'API
class ApiConstants {
  // URL de base de l'API
  // Pour l'émulateur Android : utilisez 10.0.2.2
  // Pour un appareil physique ou iOS : utilisez l'IP de votre machine
  // Appareil physique (CLT L09) : utilise l'IP locale
  static const String baseUrl = 'https://area-eric.eliasdrissi.dev';
  
  // Endpoints d'authentification
  static const String authBase = '/api/auth';
  static const String loginEndpoint = '$authBase/login';
  static const String registerEndpoint = '$authBase/register';
  static const String logoutEndpoint = '$authBase/logout';
  static const String verifyTokenEndpoint = '$authBase/verify';
  
  // Headers
  static const Map<String, String> jsonHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  // Timeout
  static const Duration timeoutDuration = Duration(seconds: 30);
}
