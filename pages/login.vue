<script setup lang="ts">
const form = reactive({ email: '', password: '' })
const errorMessage = ref('')
const submit = async () => { try { await $fetch('/api/auth/login', { method: 'POST', body: form }); await navigateTo('/account') } catch (error: any) { errorMessage.value = error?.data?.statusMessage || 'Login gagal.' } }
useHead({ title: 'Login | Equine' })
</script>
<template><main class="page-container"><section class="standalone-empty-state"><p class="eyebrow">Akun Equine</p><h1>Login.</h1><form class="checkout-form" @submit.prevent="submit"><label>Email<input v-model="form.email" required type="email" autocomplete="email" /></label><label>Password<input v-model="form.password" required type="password" autocomplete="current-password" /></label><p v-if="errorMessage" class="checkout-error">{{ errorMessage }}</p><button class="button button-dark">Login</button><NuxtLink to="/register">Belum punya akun? Daftar</NuxtLink></form></section></main></template>
