<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>Connexion</h2>
        <p>Accédez à votre compte</p>
      </div>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            v-model="formData.email"
            :class="['form-input', { error: errors.email }]"
            placeholder="votre@email.com"
            :disabled="isLoading"
            @input="clearError('email')"
          />
          <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label for="password">Mot de passe</label>
          <div class="password-container">
            <input
              :type="showPassword ? 'text' : 'password'"
              id="password"
              v-model="formData.password"
              :class="['form-input', { error: errors.password }]"
              placeholder="••••••••"
              :disabled="isLoading"
              @input="clearError('password')"
            />
            <button
              type="button"
              class="password-toggle"
              @click="showPassword = !showPassword"
              :disabled="isLoading"
            >
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
          <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
        </div>

        <div class="form-options">
          <label class="checkbox-container">
            <input type="checkbox" v-model="rememberMe" />
            <span class="checkmark"></span>
            Se souvenir de moi
          </label>
          <a href="#" class="forgot-password">Mot de passe oublié ?</a>
        </div>

        <button 
          type="submit" 
          :class="['login-button', { loading: isLoading }]"
          :disabled="isLoading"
        >
          <div v-if="isLoading" class="spinner"></div>
          {{ isLoading ? 'Connexion...' : 'Se connecter' }}
        </button>

        <div v-if="errors.submit" class="error-message submit-error">
          {{ errors.submit }}
        </div>
      </form>

      <div class="login-footer">
        <p>Pas encore de compte ? <a href="#" class="signup-link">S'inscrire</a></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const formData = reactive({
  email: '',
  password: ''
})

const errors = reactive<Record<string, string>>({})
const isLoading = ref(false)
const showPassword = ref(false)
const rememberMe = ref(false)

const validateForm = (): boolean => {
  Object.keys(errors).forEach(key => delete errors[key])

  if (!formData.email) {
    errors.email = 'Email requis'
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    errors.email = 'Email invalide'
  }

  if (!formData.password) {
    errors.password = 'Mot de passe requis'
  } else if (formData.password.length < 6) {
    errors.password = 'Au moins 6 caractères'
  }

  return Object.keys(errors).length === 0
}

const clearError = (field: string) => {
  if (errors[field]) {
    delete errors[field]
  }
}

const handleSubmit = async () => {
  if (!validateForm()) return

  isLoading.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    console.log('Connexion avec:', {
      email: formData.email,
      password: formData.password,
      rememberMe: rememberMe.value
    })
    
    alert('Connexion réussie !')
    
    formData.email = ''
    formData.password = ''
    rememberMe.value = false
    
  } catch (error) {
    errors.submit = 'Erreur de connexion'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Container principal avec dégradé */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  font-family: 'Arial', sans-serif;
}

/* Carte de login */
.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 
    0 8px 32px rgba(31, 38, 135, 0.37),
    0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* En-tête */
.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  color: #333;
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.login-header p {
  color: #666;
  font-size: 14px;
  margin: 0;
}

/* Formulaire */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Labels */
.form-group label {
  color: #333;
  font-weight: 600;
  font-size: 14px;
}

/* Inputs */
.form-input {
  padding: 14px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
  outline: none;
}

.form-input:focus {
  border-color: #667eea;
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input.error {
  border-color: #e74c3c;
  background: rgba(231, 76, 60, 0.05);
}

.form-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

/* Container pour le mot de passe */
.password-container {
  position: relative;
  display: flex;
  align-items: center;
}

.password-toggle {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.password-toggle:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.password-toggle:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Messages d'erreur */
.error-message {
  color: #e74c3c;
  font-size: 12px;
  font-weight: 500;
  margin-top: 4px;
}

.submit-error {
  text-align: center;
  background: rgba(231, 76, 60, 0.1);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(231, 76, 60, 0.2);
}

/* Options du formulaire */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  margin: 10px 0;
}

/* Checkbox personnalisée */
.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  gap: 8px;
}

.checkbox-container input[type="checkbox"] {
  display: none;
}

.checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid #ddd;
  border-radius: 4px;
  position: relative;
  transition: all 0.3s ease;
}

.checkbox-container input[type="checkbox"]:checked + .checkmark {
  background: #667eea;
  border-color: #667eea;
}

.checkbox-container input[type="checkbox"]:checked + .checkmark::after {
  content: "✓";
  position: absolute;
  color: white;
  font-size: 12px;
  font-weight: bold;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Lien mot de passe oublié */
.forgot-password {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.forgot-password:hover {
  color: #764ba2;
  text-decoration: underline;
}

/* Bouton de connexion */
.login-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.login-button.loading {
  background: linear-gradient(135deg, #95a5f0 0%, #9d83c4 100%);
}

/* Spinner de chargement */
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Footer */
.login-footer {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.login-footer p {
  color: #666;
  margin: 0;
  font-size: 14px;
}

.signup-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s;
}

.signup-link:hover {
  color: #764ba2;
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 480px) {
  .login-container {
    padding: 10px;
  }
  
  .login-card {
    padding: 30px 20px;
  }
  
  .login-header h2 {
    font-size: 24px;
  }
  
  .form-options {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style>