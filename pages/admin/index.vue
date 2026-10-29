<script setup lang="ts">
import { ArrowRight, CircleAlert, CreditCard, PackageCheck, ShoppingBag } from '@lucide/vue'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { products, orders } = useAdminStore()
const revenue = computed(() => orders.value.filter((order) => order.status !== 'Menunggu pembayaran').reduce((total, order) => total + order.total, 0))
const lowStockProducts = computed(() => products.value.filter((product) => product.stock <= 5).sort((first, second) => first.stock - second.stock))
const lowStock = computed(() => lowStockProducts.value.length)
const pendingOrders = computed(() => orders.value.filter((order) => order.status === 'Menunggu pembayaran').length)
const statusSummary = computed(() => [
  { label: 'Menunggu pembayaran', count: orders.value.filter((order) => order.status === 'Menunggu pembayaran').length },
  { label: 'Dibayar', count: orders.value.filter((order) => order.status === 'Dibayar').length },
  { label: 'Diproses', count: orders.value.filter((order) => order.status === 'Diproses').length },
  { label: 'Dikirim', count: orders.value.filter((order) => order.status === 'Dikirim').length },
])
const formatPrice = (price: number) => new Intl.NumberFormat('id-ID').format(price)
</script>

<template>
  <div class="admin-page">
    <div class="admin-page-heading"><div><p class="eyebrow">Overview</p><h1>Selamat datang.</h1></div><span class="admin-date">05 September 2026</span></div>
    <section class="admin-stats">
      <article class="admin-stat"><div class="admin-stat-icon"><ShoppingBag :size="18" :stroke-width="1.5" /></div><span>Pesanan aktif</span><strong>{{ orders.length }}</strong><small>Hari ini</small></article>
      <article class="admin-stat"><div class="admin-stat-icon"><CreditCard :size="18" :stroke-width="1.5" /></div><span>Penjualan tercatat</span><strong>Rp {{ formatPrice(revenue) }}</strong><small>Dari pesanan dibayar</small></article>
      <article class="admin-stat"><div class="admin-stat-icon"><PackageCheck :size="18" :stroke-width="1.5" /></div><span>Produk aktif</span><strong>{{ products.filter((product) => product.active).length }}</strong><small>Dari {{ products.length }} produk</small></article>
      <article class="admin-stat admin-stat-alert"><div class="admin-stat-icon"><CircleAlert :size="18" :stroke-width="1.5" /></div><span>Stok perlu dicek</span><strong>{{ lowStock }}</strong><small>{{ pendingOrders }} pembayaran tertunda</small></article>
    </section>
    <section class="admin-workspace-grid">
      <article class="admin-panel admin-priority-panel">
        <div class="admin-panel-heading"><div><p class="eyebrow">Perlu perhatian</p><h2>Stok kritis</h2></div><NuxtLink to="/admin/products" class="admin-text-link">Kelola <ArrowRight :size="15" :stroke-width="1.5" /></NuxtLink></div>
        <div v-if="lowStockProducts.length" class="admin-priority-list"><NuxtLink v-for="product in lowStockProducts.slice(0, 4)" :key="product.slug" to="/admin/products" class="admin-priority-row"><span><strong>{{ product.name }}</strong><small>{{ product.sku }} · {{ product.active ? 'Aktif' : 'Draft' }}</small></span><b :class="{ 'is-empty': product.stock === 0 }">{{ product.stock === 0 ? 'Habis' : `${product.stock} tersisa` }}</b></NuxtLink></div>
        <p v-else class="admin-empty-inline">Semua stok berada di atas batas minimum.</p>
      </article>
      <article class="admin-panel admin-status-panel">
        <div class="admin-panel-heading"><div><p class="eyebrow">Alur order</p><h2>Status pesanan</h2></div><NuxtLink to="/admin/orders" class="admin-text-link">Buka order <ArrowRight :size="15" :stroke-width="1.5" /></NuxtLink></div>
        <div class="admin-status-summary"><div v-for="item in statusSummary" :key="item.label" class="admin-status-summary-row"><span>{{ item.label }}</span><strong>{{ item.count }}</strong><i><em :style="{ width: `${orders.length ? item.count / orders.length * 100 : 0}%` }" /></i></div></div>
      </article>
    </section>
    <section class="admin-panel admin-orders-preview"><div class="admin-panel-heading"><div><p class="eyebrow">Aktivitas terbaru</p><h2>Pesanan terbaru</h2></div><NuxtLink to="/admin/orders" class="admin-text-link">Lihat semua <ArrowRight :size="15" :stroke-width="1.5" /></NuxtLink></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Order</th><th>Pelanggan</th><th>Total</th><th>Status</th><th>Waktu</th></tr></thead><tbody><tr v-for="order in orders.slice(0, 4)" :key="order.id"><td><strong>{{ order.id }}</strong><small>{{ order.item }}</small></td><td>{{ order.customer }}</td><td>Rp {{ formatPrice(order.total) }}</td><td><span class="status-pill" :class="`status-${order.status.toLowerCase().replaceAll(' ', '-')}`">{{ order.status }}</span></td><td>{{ order.createdAt }}</td></tr><tr v-if="!orders.length"><td colspan="5" class="admin-empty-cell">Belum ada pesanan.</td></tr></tbody></table></div></section>
  </div>
</template>
