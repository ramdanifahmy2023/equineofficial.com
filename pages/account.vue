<script setup lang="ts">
const { data: session, error } = await useFetch<any>('/api/auth/session')
if (error.value) await navigateTo('/login')
const { data: orders } = await useFetch<any[]>('/api/account/orders')
const formatPrice = (price: number) => new Intl.NumberFormat('id-ID').format(price)
const logout = async () => { await $fetch('/api/auth/logout', { method: 'POST' }); await navigateTo('/') }
const cancelOrder = async (order: any) => { if (!confirm(`Batalkan ${order.orderNumber}?`)) return; try { await $fetch(`/api/orders/${order.orderNumber}/cancel`, { method: 'POST' }); order.status = 'cancelled' } catch (error: any) { alert(error?.data?.statusMessage || 'Pesanan tidak dapat dibatalkan.') } }
useHead({ title: 'Akun saya | Equine' })
</script>
<template><main class="page-container"><section class="admin-page"><div class="admin-page-heading"><div><p class="eyebrow">Akun</p><h1>{{ session?.user?.name }}</h1></div><button class="button button-outline" @click="logout">Logout</button></div><section class="admin-panel"><h2>Pesanan saya</h2><div v-if="orders?.length" class="summary-items"><div v-for="order in orders" :key="order.orderNumber"><NuxtLink :to="`/payment/${order.orderNumber}`" class="summary-item"><span>{{ order.orderNumber }} <small>{{ order.items.map((item: any) => `${item.name} × ${item.quantity}`).join(', ') }}</small></span><strong>Rp {{ formatPrice(order.total) }} · {{ order.status }}</strong></NuxtLink><button v-if="order.status === 'pending'" type="button" class="button button-outline" @click="cancelOrder(order)">Batalkan</button></div></div><p v-else>Belum ada pesanan.</p></section></section></main></template>
