package com.example.myapplication.ui.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.myapplication.data.User

@Composable
fun ProfileScreen(
    user: User?,
    onLogout: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Top
    ) {
        Text("Profil", style = MaterialTheme.typography.headlineSmall)
        Spacer(Modifier.height(16.dp))
        if (user == null) {
            Text("Aucun utilisateur connecté")
        } else {
            Text("Nom d'utilisateur: ${user.username}")
            Spacer(Modifier.height(8.dp))
            Text("Email: ${user.email}")
        }
        Spacer(Modifier.height(24.dp))
        Button(onClick = onLogout, modifier = Modifier.fillMaxWidth()) {
            Text("Se déconnecter")
        }
    }
}
