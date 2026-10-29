<script setup lang="ts">
const form = reactive({ orderNumber: '', type: 'return', reason: '' })
const message = ref('')
const submit = async () => { try { await $fetch('/api/returns', { method: 'POST', body: form }); message.value = 'Pengajuan tersimpan. Tim akan menindaklanjuti.' } catch (error: any) { message.value = error?.data?.statusMessage || 'Pengajuan gagal.' } }
</script>
<template><div class="info-page page-container"><p class="eyebrow">Equine / bantuan</p><h1>Retur & tukar.</h1><div class="info-content"><p>Pengajuan tersedia maksimal tiga hari setelah pesanan diterima.</p><form class="checkout-form" @submit.prevent="submit"><label>Nomor order<input v-model="form.orderNumber" required /></label><label>Jenis<select v-model="form.type"><option value="return">Retur</option><option value="exchange">Tukar ukuran/varian</option></select></label><label>Alasan<textarea v-model="form.reason" required rows="3" /></label><p v-if="message" role="status">{{ message }}</p><button class="button button-dark">Ajukan</button></form></div></div></template>
