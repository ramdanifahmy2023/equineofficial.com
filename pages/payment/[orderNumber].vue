<script setup lang="ts">
import { ArrowLeft, CheckCircle2, Clock3, Copy, XCircle } from '@lucide/vue'
import { ref } from 'vue'

const route = useRoute()
const orderNumber = String(route.params.orderNumber)
const { data: order, pending, error } = await useFetch<any>(`/api/orders/${orderNumber}`)
const formatPrice = (price: number) => new Intl.NumberFormat('id-ID').format(price)
const copyMessage = ref('')
const paymentError = ref('')
const paying = ref(false)
const startPayment = async () => {
  paying.value = true
  paymentError.value = ''
  try { const result = await $fetch<{ url: string }>(`/api/orders/${orderNumber}/payment`, { method: 'POST', body: { method: 'qris' } }); window.location.href = result.url }
  catch (error: any) { paymentError.value = error?.data?.statusMessage || 'Payment gateway belum siap.' }
  finally { paying.value = false }
}
const copyOrderNumber = async () => {
  try { await navigator.clipboard.writeText(orderNumber); copyMessage.value = 'Nomor pesanan disalin.' }
  catch { copyMessage.value = 'Salin nomor pesanan secara manual.' }
}
useHead({ title: `Pesanan ${orderNumber} | Equine` })
</script>

<template>
  <div class="payment-page page-container">
    <NuxtLink to="/products" class="back-link"><ArrowLeft :size="16" :stroke-width="1.6" />Kembali ke toko</NuxtLink>
    <p v-if="pending" role="status">Memuat pesanan…</p>
    <section v-else-if="error || !order" class="standalone-empty-state"><h1>Pesanan tidak ditemukan.</h1><p>Periksa nomor pesanan atau coba lagi.</p><NuxtLink to="/products" class="button button-dark">Kembali ke toko</NuxtLink></section>
    <section v-else class="payment-layout">
      <div class="payment-main">
        <p class="eyebrow">Equine / pesanan</p>
        <p class="preview-notice">Pesanan tercatat. Pembayaran online akan tersedia setelah integrasi payment gateway aktif.</p>
        <div v-if="order.status === 'paid'" class="payment-state-icon success"><CheckCircle2 :size="28" :stroke-width="1.45" /></div><div v-else class="payment-state-icon pending"><Clock3 :size="28" :stroke-width="1.45" /></div>
        <h1>{{ order.status === 'paid' ? 'Pembayaran berhasil.' : order.status === 'expired' ? 'Pembayaran kedaluwarsa.' : order.status === 'failed' ? 'Pembayaran gagal.' : order.status === 'cancelled' ? 'Pesanan dibatalkan.' : order.status === 'cod_pending_confirmation' ? 'Menunggu konfirmasi COD.' : 'Menunggu pembayaran.' }}</h1>
        <p class="payment-lead">Nomor pesanan tersimpan di server. Metode: {{ order.paymentMethod === 'cod' ? 'COD' : 'Pembayaran online' }}.</p>
        <p v-if="paymentError" class="checkout-error" role="alert">{{ paymentError }}</p>
        <div class="payment-actions"><button v-if="order.status === 'pending'" class="button button-clay button-wide" :disabled="paying" @click="startPayment">{{ paying ? 'Membuka pembayaran…' : 'Bayar sekarang' }}</button><NuxtLink to="/products" class="button button-dark button-wide">Kembali ke toko</NuxtLink></div>
      </div>
      <aside class="payment-summary">
        <div class="payment-order-number"><span>Order</span><button @click="copyOrderNumber">{{ order.orderNumber }} <Copy :size="14" :stroke-width="1.5" /></button></div>
        <p v-if="copyMessage" role="status">{{ copyMessage }}</p>
        <div class="summary-items"><div v-for="item in order.items" :key="`${item.name}-${item.color}-${item.size}`" class="summary-item"><span>{{ item.name }} <small>{{ item.color }} / {{ item.size }} × {{ item.quantity }}</small></span><strong>Rp {{ formatPrice(item.unitPrice * item.quantity) }}</strong></div></div>
        <div class="summary-total"><span>Subtotal</span><strong>Rp {{ formatPrice(order.subtotal) }}</strong></div>
        <div class="summary-total"><span>Pengiriman <small>{{ order.shipping.courier }} {{ order.shipping.service }}</small></span><strong>Rp {{ formatPrice(order.shipping?.price ?? order.shippingCost) }}</strong></div>
        <div class="summary-grand-total"><span>Total</span><strong>Rp {{ formatPrice(order.total) }}</strong></div>
        <p class="summary-note">{{ order.customerName }} · {{ order.destination }}<br />{{ order.address }} · {{ order.postalCode }}</p>
      </aside>
    </section>
  </div>
</template>
