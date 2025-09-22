package com.example.myapplication.data

import android.content.Context
import java.security.MessageDigest

data class User(
    val username: String,
    val email: String
)

/**
 * Very small local auth store using SharedPreferences.
 * It supports a single local user for demo purposes.
 */
class AuthStore(private val context: Context) {
    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun isLoggedIn(): Boolean = prefs.getBoolean(KEY_LOGGED_IN, false)

    fun getCurrentUser(): User? {
        val username = prefs.getString(KEY_USERNAME, null) ?: return null
        val email = prefs.getString(KEY_EMAIL, "") ?: ""
        return User(username = username, email = email)
    }

    /**
     * Register a new local user. Fails if a user already exists in the store.
     */
    fun register(username: String, email: String, password: String): Result<Unit> {
        if (username.isBlank()) return Result.failure(IllegalArgumentException("Le nom d'utilisateur est requis."))
        if (!email.contains('@')) return Result.failure(IllegalArgumentException("L'email n'est pas valide."))
        if (password.length < 6) return Result.failure(IllegalArgumentException("Le mot de passe doit contenir au moins 6 caractères."))

        val existing = prefs.getString(KEY_USERNAME, null)
        if (!existing.isNullOrBlank()) {
            return Result.failure(IllegalStateException("Un compte existe déjà localement. Déconnectez-vous pour en créer un autre."))
        }

        val hash = sha256(password)
        prefs.edit()
            .putString(KEY_USERNAME, username)
            .putString(KEY_EMAIL, email)
            .putString(KEY_PASSWORD_HASH, hash)
            .putBoolean(KEY_LOGGED_IN, true)
            .apply()
        return Result.success(Unit)
    }

    /**
     * Login using either username or email + password.
     */
    fun login(identifier: String, password: String): Result<Unit> {
        val username = prefs.getString(KEY_USERNAME, null)
            ?: return Result.failure(IllegalStateException("Aucun compte n'est enregistré. Veuillez créer un compte."))
        val email = prefs.getString(KEY_EMAIL, null) ?: ""
        val savedHash = prefs.getString(KEY_PASSWORD_HASH, null)
            ?: return Result.failure(IllegalStateException("Données de compte manquantes. Veuillez vous réinscrire."))

        val idMatches = identifier.equals(username, ignoreCase = false) || identifier.equals(email, ignoreCase = true)
        val pwdMatches = sha256(password) == savedHash

        return if (idMatches && pwdMatches) {
            prefs.edit().putBoolean(KEY_LOGGED_IN, true).apply()
            Result.success(Unit)
        } else {
            Result.failure(IllegalArgumentException("Identifiants invalides."))
        }
    }

    fun logout() {
        prefs.edit().putBoolean(KEY_LOGGED_IN, false).apply()
    }

    companion object {
        private const val PREFS_NAME = "auth_prefs"
        private const val KEY_USERNAME = "user_username"
        private const val KEY_EMAIL = "user_email"
        private const val KEY_PASSWORD_HASH = "user_password_hash"
        private const val KEY_LOGGED_IN = "logged_in"

        private fun sha256(input: String): String {
            val bytes = MessageDigest.getInstance("SHA-256").digest(input.toByteArray())
            return bytes.joinToString(separator = "") { b -> "%02x".format(b) }
        }
    }
}
