export default defineNuxtRouteMiddleware(async (to) => {
  const { isLoggedIn, verifyToken, refreshTokens } = useAuth()

  if (!isLoggedIn.value) {
    const tokenValid = await verifyToken()

    if (!tokenValid) {
      const refreshed = await refreshTokens()

      if (!refreshed) {
        return navigateTo({
          path: '/login',
          query: { redirect: to.fullPath }
        })
      }
    }
  }
})