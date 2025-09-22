package com.example.myapplication

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.example.myapplication.data.AuthStore
import com.example.myapplication.ui.auth.LoginScreen
import com.example.myapplication.ui.auth.RegisterScreen
import com.example.myapplication.ui.profile.ProfileScreen
import com.example.myapplication.ui.theme.MyApplicationTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val authStore = AuthStore(this)
        setContent {
            MyApplicationTheme {
                val snackbarHostState = remember { SnackbarHostState() }
                val scope = rememberCoroutineScope()

                var screen by rememberSaveable {
                    mutableStateOf(
                        if (authStore.isLoggedIn()) Screen.Profile else Screen.Login
                    )
                }
                var error by remember { mutableStateOf<String?>(null) }

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    snackbarHost = { SnackbarHost(hostState = snackbarHostState) }
                ) { innerPadding ->
                    when (screen) {
                        Screen.Login -> LoginScreen(
                            onLogin = { id, pwd ->
                                error = null
                                val res = authStore.login(id, pwd)
                                res.onSuccess {
                                    screen = Screen.Profile
                                    scope.launch { snackbarHostState.show("Connecté !") }
                                }.onFailure { t ->
                                    error = t.message
                                }
                            },
                            onNavigateToRegister = { screen = Screen.Register },
                            errorMessage = error
                        )
                        Screen.Register -> RegisterScreen(
                            onRegister = { username, email, pwd ->
                                error = null
                                val res = authStore.register(username, email, pwd)
                                res.onSuccess {
                                    screen = Screen.Profile
                                    scope.launch { snackbarHostState.show("Compte créé et connecté") }
                                }.onFailure { t ->
                                    error = t.message
                                }
                            },
                            onNavigateToLogin = { screen = Screen.Login },
                            errorMessage = error
                        )
                        Screen.Profile -> ProfileScreen(
                            user = authStore.getCurrentUser(),
                            onLogout = {
                                authStore.logout()
                                screen = Screen.Login
                                scope.launch { snackbarHostState.show("Déconnecté") }
                            }
                        )
                    }
                }
            }
        }
    }
}

private enum class Screen { Login, Register, Profile }

private suspend fun SnackbarHostState.show(text: String) {
    showSnackbar(message = text)
}