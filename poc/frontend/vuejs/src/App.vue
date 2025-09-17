<script setup lang="ts">
import LoginForm from './components/LoginForm.vue'
</script>

<template>
  <div id="app">
    <LoginForm />
  </div>
</template>

<style>
body {
  margin: 0 !important;
  display: block !important;
  place-items: unset !important;
}

#app {
  max-width: none !important;
  margin: 0 !important;
  padding: 0 !important;
  text-align: left !important;
  width: 100%;
  height: 100vh;
}
</style>
