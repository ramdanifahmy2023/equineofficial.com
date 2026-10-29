<script setup lang="ts">
definePageMeta({ layout: false })
const form = reactive({ email: '', password: '' })
const errorMessage = ref('')
const submitting = ref(false)
const submit = async () => {
  submitting.value = true
  errorMessage.value = ''
  try { await $fetch('/api/admin/auth/login', { method: 'POST', body: form }); await navigateTo('/admin') }
  catch (error: any) { errorMessage.value = error?.data?.statusMessage || 'Login gagal.' }
  finally { submitting.value = false }
}
useHead({ title: 'Login admin | Equine' })
</script>

<template><main class="page-container"><section class="standalone-empty-state"><p class="eyebrow">Equine Official</p><h1>Login admin</h1><form class="checkout-form" @submit.prevent="submit"><label>Email<input v-model="form.email" type="email" autocomplete="username" required /></label><label>Password<input v-model="form.password" type="password" autocomplete="current-password" required /></label><p v-if="errorMessage" class="checkout-error" role="alert">{{ errorMessage }}</p><button class="button button-dark" :disabled="submitting" type="submit">{{ submitting ? 'Memeriksa…' : 'Login' }}</button></form></section></main></template>
