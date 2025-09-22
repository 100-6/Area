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
fun LoginScreen(
    onLogin: (identifier: String, password: String) -> Unit,
    onNavigateToRegister: () -> Unit,
    errorMessage: String? = null
) {
    var identifier by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Top
    ) {
        Text("Connexion", style = MaterialTheme.typography.headlineSmall)
        Spacer(Modifier.height(16.dp))

        if (!errorMessage.isNullOrBlank()) {
            Text(text = errorMessage, color = MaterialTheme.colorScheme.error)
            Spacer(Modifier.height(8.dp))
        }

        OutlinedTextField(
            value = identifier,
            onValueChange = { identifier = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Nom d'utilisateur ou Email") }
        )
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Mot de passe") },
            visualTransformation = PasswordVisualTransformation()
        )

        Spacer(Modifier.height(16.dp))
        Button(onClick = { onLogin(identifier.trim(), password) }, modifier = Modifier.fillMaxWidth()) {
            Text("Se connecter")
        }

        Spacer(Modifier.height(8.dp))
        Button(onClick = onNavigateToRegister, modifier = Modifier.fillMaxWidth()) {
            Text("Créer un compte")
        }
    }
}
