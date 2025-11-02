export default defineNuxtRouteMiddleware(async () => {
  const { verifyToken, refreshTokens } = useAuth()

  const ensureValidSession = async () => {
    const tokenValid = await verifyToken()
    if (tokenValid) return true

    const refreshed = await refreshTokens()
    return refreshed
  }

  const ok = await ensureValidSession()

  if (!ok) {
    return navigateTo('/')
  }
})
