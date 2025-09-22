package com.example.myapplication.ui.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp

@Composable
fun RegisterScreen(
    onRegister: (username: String, email: String, password: String) -> Unit,
    onNavigateToLogin: () -> Unit,
    errorMessage: String? = null
) {
    var username by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirm by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Top
    ) {
        Text("Créer un compte", style = MaterialTheme.typography.headlineSmall)
        Spacer(Modifier.height(16.dp))

        if (!errorMessage.isNullOrBlank()) {
            Text(text = errorMessage, color = MaterialTheme.colorScheme.error)
            Spacer(Modifier.height(8.dp))
        }

        OutlinedTextField(
            value = username,
            onValueChange = { username = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Nom d'utilisateur") }
        )
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Email") }
        )
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Mot de passe") },
            visualTransformation = PasswordVisualTransformation()
        )
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = confirm,
            onValueChange = { confirm = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Confirmer le mot de passe") },
            visualTransformation = PasswordVisualTransformation()
        )

        Spacer(Modifier.height(16.dp))
        Button(
            onClick = {
                if (password == confirm) {
                    onRegister(username.trim(), email.trim(), password)
                }
            },
            modifier = Modifier.fillMaxWidth()
        ) { Text("S'inscrire") }

        Spacer(Modifier.height(8.dp))
        Button(onClick = onNavigateToLogin, modifier = Modifier.fillMaxWidth()) {
            Text("Déjà un compte ? Se connecter")
        }
    }
}
