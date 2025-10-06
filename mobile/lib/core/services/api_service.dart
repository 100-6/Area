import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/api_constants.dart';

/// Service pour gérer les appels HTTP à l'API
class ApiService {
  final http.Client _client;

  ApiService({http.Client? client}) : _client = client ?? http.Client();

  /// Effectue une requête POST
  Future<Map<String, dynamic>> post(
    String endpoint, {
    Map<String, dynamic>? body,
    Map<String, String>? headers,
  }) async {
    try {
      final url = Uri.parse('${ApiConstants.baseUrl}$endpoint');
      
      final response = await _client
          .post(
            url,
            headers: {
              ...ApiConstants.jsonHeaders,
              if (headers != null) ...headers,
            },
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(ApiConstants.timeoutDuration);

      return _handleResponse(response);
    } catch (e) {
      throw ApiException('Erreur de connexion: ${e.toString()}');
    }
  }

  /// Effectue une requête GET
  Future<Map<String, dynamic>> get(
    String endpoint, {
    Map<String, String>? headers,
  }) async {
    try {
      final url = Uri.parse('${ApiConstants.baseUrl}$endpoint');

      final response = await _client
          .get(
            url,
            headers: {
              ...ApiConstants.jsonHeaders,
              if (headers != null) ...headers,
            },
          )
          .timeout(ApiConstants.timeoutDuration);

      return _handleResponse(response);
    } catch (e) {
      throw ApiException('Erreur de connexion: ${e.toString()}');
    }
  }

  /// Effectue une requête PATCH
  Future<Map<String, dynamic>> patch(
    String endpoint, {
    Map<String, dynamic>? body,
    Map<String, String>? headers,
  }) async {
    try {
      final url = Uri.parse('${ApiConstants.baseUrl}$endpoint');

      final response = await _client
          .patch(
            url,
            headers: {
              ...ApiConstants.jsonHeaders,
              if (headers != null) ...headers,
            },
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(ApiConstants.timeoutDuration);

      return _handleResponse(response);
    } catch (e) {
      throw ApiException('Erreur de connexion: ${e.toString()}');
    }
  }

  /// Effectue une requête DELETE
  Future<Map<String, dynamic>> delete(
    String endpoint, {
    Map<String, String>? headers,
  }) async {
    try {
      final url = Uri.parse('${ApiConstants.baseUrl}$endpoint');

      final response = await _client
          .delete(
            url,
            headers: {
              ...ApiConstants.jsonHeaders,
              if (headers != null) ...headers,
            },
          )
          .timeout(ApiConstants.timeoutDuration);

      return _handleResponse(response);
    } catch (e) {
      throw ApiException('Erreur de connexion: ${e.toString()}');
    }
  }

  /// Gère la réponse HTTP
  Map<String, dynamic> _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) {
        return {};
      }
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else {
      final errorBody = response.body.isNotEmpty
          ? jsonDecode(response.body) as Map<String, dynamic>
          : <String, dynamic>{};
      
      final errorMessage = errorBody['error'] ?? 
                          errorBody['message'] ?? 
                          'Erreur ${response.statusCode}';
      
      throw ApiException(errorMessage);
    }
  }

  /// Ferme le client HTTP
  void dispose() {
    _client.close();
  }
}

/// Exception personnalisée pour les erreurs d'API
class ApiException implements Exception {
  final String message;
  
  ApiException(this.message);

  @override
  String toString() => message;
}

