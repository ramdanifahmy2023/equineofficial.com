<script setup lang="ts">
const form = reactive({ name: '', email: '', phone: '', password: '' })
const errorMessage = ref('')
const submit = async () => { try { await $fetch('/api/auth/register', { method: 'POST', body: form }); await navigateTo('/checkout') } catch (error: any) { errorMessage.value = error?.data?.statusMessage || 'Pendaftaran gagal.' } }
useHead({ title: 'Daftar | Equine' })
</script>
<template><main class="page-container"><section class="standalone-empty-state"><p class="eyebrow">Akun Equine</p><h1>Daftar.</h1><form class="checkout-form" @submit.prevent="submit"><label>Nama<input v-model="form.name" required autocomplete="name" /></label><label>Email<input v-model="form.email" required type="email" autocomplete="email" /></label><label>WhatsApp<input v-model="form.phone" required type="tel" autocomplete="tel" /></label><label>Password<input v-model="form.password" required minlength="8" type="password" autocomplete="new-password" /></label><p v-if="errorMessage" class="checkout-error">{{ errorMessage }}</p><button class="button button-dark">Daftar</button><NuxtLink to="/login">Sudah punya akun? Login</NuxtLink></form></section></main></template>
