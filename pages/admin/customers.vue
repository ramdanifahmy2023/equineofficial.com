<script setup lang="ts">
import { ArrowRight, ChevronLeft, Search, UserRound, X } from '@lucide/vue'
import type { AdminOrder } from '~/data/admin'

type Customer = {
  id: string
  name: string
  email: string
  phone: string
  orders: AdminOrder[]
  total: number
}

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { orders, syncPreviewOrders } = useAdminStore()
const query = ref('')
const selectedCustomer = ref<Customer | null>(null)
const formatPrice = (price: number) => new Intl.NumberFormat('id-ID').format(price)
const customers = computed<Customer[]>(() => {
  const records = new Map<string, Customer>()
  orders.value.forEach((order: AdminOrder) => {
    const id = order.contact?.email || order.contact?.phone || order.customer.toLowerCase()
    const current = records.get(id) || { id, name: order.customer, email: order.contact?.email || 'Belum tersedia', phone: order.contact?.phone || 'Belum tersedia', orders: [], total: 0 }
    current.orders.push(order)
    current.total += order.total
    records.set(id, current)
  })
  return [...records.values()].sort((first, second) => second.total - first.total)
})
const filteredCustomers = computed<Customer[]>(() => customers.value.filter((customer: Customer) => `${customer.name} ${customer.email} ${customer.phone}`.toLowerCase().includes(query.value.toLowerCase())))
const addresses = computed(() => [...new Set(selectedCustomer.value?.orders.flatMap((order: AdminOrder) => order.contact ? [`${order.contact.address}, ${order.contact.destination} ${order.contact.postalCode}`] : []) || [])])

onMounted(syncPreviewOrders)
</script>

<template>
  <div class="admin-page">
    <div class="admin-page-heading"><div><p class="eyebrow">Commerce</p><h1>Pelanggan.</h1></div><span class="admin-date">{{ filteredCustomers.length }} pelanggan</span></div>
    <div class="admin-toolbar"><label class="admin-search"><Search :size="17" :stroke-width="1.5" /><input v-model="query" type="search" placeholder="Cari nama, email, atau nomor" aria-label="Cari pelanggan admin" /></label><button v-if="query" class="admin-clear-filter" @click="query = ''">Reset</button></div>
    <section class="admin-panel"><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Pelanggan</th><th>Kontak</th><th>Order</th><th>Total belanja</th><th>Order terakhir</th><th /></tr></thead><tbody><tr v-for="customer in filteredCustomers" :key="customer.id"><td><strong>{{ customer.name }}</strong><small>{{ customer.orders[0]?.id }}</small></td><td>{{ customer.email }}<small>{{ customer.phone }}</small></td><td>{{ customer.orders.length }}</td><td>Rp {{ formatPrice(customer.total) }}</td><td>{{ customer.orders[0]?.createdAt }}</td><td><button class="admin-row-action" @click="selectedCustomer = customer">Detail <ArrowRight :size="14" :stroke-width="1.5" /></button></td></tr><tr v-if="!filteredCustomers.length"><td colspan="6" class="admin-empty-cell">Pelanggan tidak ditemukan.</td></tr></tbody></table></div></section>
    <AppOverlay :open="Boolean(selectedCustomer)" label="Detail pelanggan" @close="selectedCustomer = null">
      <div class="admin-drawer-backdrop" @click="selectedCustomer = null" />
      <aside v-if="selectedCustomer" class="admin-order-drawer">
        <div class="drawer-head"><div><p class="eyebrow">Pelanggan</p><h2>{{ selectedCustomer.name }}</h2></div><button class="icon-button" aria-label="Tutup detail pelanggan" @click="selectedCustomer = null"><X :size="20" :stroke-width="1.7" /></button></div>
        <div class="admin-order-detail"><div class="order-detail-status"><UserRound :size="18" :stroke-width="1.5" /><span>{{ selectedCustomer.orders.length }} order · Rp {{ formatPrice(selectedCustomer.total) }}</span></div><dl><div><dt>Email</dt><dd>{{ selectedCustomer.email }}</dd></div><div><dt>Telepon</dt><dd>{{ selectedCustomer.phone }}</dd></div><div v-if="addresses.length"><dt>Alamat tersimpan</dt><dd>{{ addresses[0] }}<small v-if="addresses.length > 1">+{{ addresses.length - 1 }} alamat lain</small></dd></div></dl><div class="admin-order-items"><p class="eyebrow">Riwayat pesanan</p><div v-for="order in selectedCustomer.orders" :key="order.id"><span>{{ order.id }}<small>{{ order.item }} · {{ order.createdAt }}</small></span><strong>Rp {{ formatPrice(order.total) }}</strong></div></div><button class="button button-dark button-wide" @click="selectedCustomer = null"><ChevronLeft :size="16" :stroke-width="1.5" />Kembali ke daftar</button></div>
      </aside>
    </AppOverlay>
  </div>
</template>
