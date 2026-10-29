export default defineNuxtRouteMiddleware(async () => {
  const { data, error } = await useFetch('/api/admin/auth/session', { key: 'admin-session' })
  if (error.value || !data.value) return navigateTo('/admin/login')
})
