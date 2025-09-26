export default defineNuxtRouteMiddleware(async () => {
  const { isLoggedIn, verifyToken } = useAuth()

  if (isLoggedIn.value || await verifyToken()) {
    return navigateTo('/dashboard')
  }
})