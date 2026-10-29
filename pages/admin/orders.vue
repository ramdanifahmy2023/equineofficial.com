<script setup lang="ts">
import { ArrowRight, ChevronLeft, Download, Package, Search, X } from '@lucide/vue'
import type { AdminOrder } from '~/data/admin'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { orders, syncPreviewOrders, updateOrderOperations } = useAdminStore()
const query = ref('')
const status = ref('Semua')
const selectedOrder = ref<AdminOrder | null>(null)
const statusDraft = ref<AdminOrder['status']>('Dibayar')
const statusSaved = ref(false)
const trackingDraft = ref('')
const noteDraft = ref('')
const operationError = ref('')
const checklist = reactive({ itemsChecked: false, variantChecked: false, conditionChecked: false })
const claiming = ref(false)
const isCodOrder = computed(() => (selectedOrder.value as any)?.paymentMethod === 'cod')
const claimOrder = async () => { if (!selectedOrder.value) return; claiming.value = true; try { await $fetch(`/api/admin/orders/${selectedOrder.value.id}/claim`, { method: 'POST' }); operationError.value = '' } catch (error: any) { operationError.value = error?.data?.statusMessage || 'Gagal mengambil pesanan.' } finally { claiming.value = false } }
const savePacking = async () => { if (!selectedOrder.value) return; try { await $fetch<any>(`/api/admin/orders/${selectedOrder.value.id}/packing`, { method: 'PATCH', body: checklist }); statusDraft.value = 'Diproses'; selectedOrder.value.status = 'Diproses'; statusSaved.value = true } catch (error: any) { operationError.value = error?.data?.statusMessage || 'Checklist gagal disimpan.' } }
const codAction = async (action: 'confirm' | 'collect' | 'settle') => { if (!selectedOrder.value) return; const settlementReference = action === 'settle' ? prompt('Referensi settlement') || '' : undefined; try { await $fetch(`/api/admin/orders/${selectedOrder.value.id}/cod`, { method: 'PATCH', body: { action, settlementReference } }); operationError.value = ''; statusSaved.value = true } catch (error: any) { operationError.value = error?.data?.statusMessage || 'Aksi COD gagal.' } }
const statuses = ['Semua', 'Menunggu pembayaran', 'Dibayar', 'Diproses', 'Dikirim', 'Selesai', 'Gagal', 'Kedaluwarsa', 'Dibatalkan']
const editableStatuses: AdminOrder['status'][] = ['Menunggu pembayaran', 'Dibayar', 'Diproses', 'Dikirim', 'Selesai', 'Dibatalkan']
const formatPrice = (price: number) => new Intl.NumberFormat('id-ID').format(price)
const filteredOrders = computed<AdminOrder[]>(() => orders.value.filter((order: AdminOrder) => (status.value === 'Semua' || order.status === status.value) && `${order.id} ${order.customer} ${order.item}`.toLowerCase().includes(query.value.toLowerCase())))
const clearFilters = () => { query.value = ''; status.value = 'Semua' }
const csvCell = (value: string | number | undefined) => `"${String(value || '').replaceAll('"', '""')}"`
const exportOrders = () => {
  const headers = ['Order ID', 'Dibuat', 'Pelanggan', 'Email', 'Telepon', 'Alamat', 'Pengiriman', 'Pembayaran', 'Status pembayaran', 'Status fulfillment', 'Nomor resi', 'Total', 'Item', 'Catatan internal']
  const rows = filteredOrders.value.map((order: AdminOrder) => [order.id, order.createdAt, order.customer, order.contact?.email, order.contact?.phone, order.contact ? `${order.contact.address}, ${order.contact.destination} ${order.contact.postalCode}` : '', order.shipping ? `${order.shipping.courier} ${order.shipping.service}` : '', order.payment, order.paymentStatus, order.status, order.trackingNumber, order.total, order.items?.map((item) => `${item.name} ${item.color}/${item.size} x${item.quantity}`).join(' | ') || order.item, order.internalNote].map(csvCell).join(','))
  const url = URL.createObjectURL(new Blob([[headers.map(csvCell).join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `equine-orders-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

onMounted(syncPreviewOrders)

const openOrder = (order: AdminOrder) => {
  selectedOrder.value = order
  statusDraft.value = order.status
  trackingDraft.value = order.trackingNumber || ''
  noteDraft.value = order.internalNote || ''
  statusSaved.value = false
  operationError.value = ''
}
const saveStatus = async () => {
  if (!selectedOrder.value) return
  const paid = selectedOrder.value.paymentStatus === 'Berhasil' || ['Dibayar', 'Diproses', 'Dikirim', 'Selesai'].includes(selectedOrder.value.status)
  if (['Diproses', 'Dikirim', 'Selesai'].includes(statusDraft.value) && !paid) { operationError.value = 'Pesanan belum dibayar. Status fulfillment tidak dapat dilanjutkan.'; return }
  if (['Dikirim', 'Selesai'].includes(statusDraft.value) && !trackingDraft.value.trim()) { operationError.value = 'Nomor resi diperlukan sebelum mengubah status ke Dikirim atau Selesai.'; return }
  const saved = await updateOrderOperations(selectedOrder.value, { status: statusDraft.value, trackingNumber: trackingDraft.value.trim(), internalNote: noteDraft.value.trim() })
  if (saved === false) { operationError.value = 'Perubahan gagal disimpan ke server.'; return }
  operationError.value = ''
  statusSaved.value = true
}
</script>

<template>
  <div class="admin-page">
    <div class="admin-page-heading"><div><p class="eyebrow">Commerce</p><h1>Pesanan.</h1></div><button class="button button-dark admin-primary-action" @click="exportOrders"><Download :size="16" :stroke-width="1.7" />Export CSV</button></div>
    <div class="admin-toolbar"><label class="admin-search"><Search :size="17" :stroke-width="1.5" /><input v-model="query" type="search" placeholder="Cari order atau pelanggan" aria-label="Cari pesanan admin" /></label><select v-model="status" aria-label="Filter status pesanan"><option v-for="item in statuses" :key="item">{{ item }}</option></select><button v-if="query || status !== 'Semua'" class="admin-clear-filter" @click="clearFilters">Reset</button><span>{{ filteredOrders.length }} hasil</span></div>
    <section class="admin-panel"><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Order</th><th>Pelanggan</th><th>Pembayaran</th><th>Total</th><th>Status</th><th>Waktu</th><th /></tr></thead><tbody><tr v-for="order in filteredOrders" :key="order.id"><td><strong>{{ order.id }}</strong><small>{{ order.item }}</small></td><td>{{ order.customer }}</td><td>{{ order.payment }}</td><td>Rp {{ formatPrice(order.total) }}</td><td><span class="status-pill" :class="`status-${order.status.toLowerCase().replaceAll(' ', '-')}`">{{ order.status }}</span></td><td>{{ order.createdAt }}</td><td><button class="admin-row-action" @click="openOrder(order)">Detail <ArrowRight :size="14" :stroke-width="1.5" /></button></td></tr><tr v-if="!filteredOrders.length"><td colspan="7" class="admin-empty-cell">Tidak ada order yang cocok dengan filter.</td></tr></tbody></table></div></section>
    <AppOverlay :open="Boolean(selectedOrder)" label="Detail pesanan" @close="selectedOrder = null">
      <div class="admin-drawer-backdrop" @click="selectedOrder = null" />
      <aside v-if="selectedOrder" class="admin-order-drawer">
        <div class="drawer-head"><div><p class="eyebrow">Order detail</p><h2>{{ selectedOrder.id }}</h2></div><button class="icon-button" aria-label="Tutup detail order" @click="selectedOrder = null"><X :size="20" :stroke-width="1.7" /></button></div>
        <div class="admin-order-detail">
          <div class="order-detail-status"><Package :size="18" :stroke-width="1.5" /><span>{{ selectedOrder.status }}</span></div>
          <div v-if="selectedOrder.items?.length" class="admin-order-items"><p class="eyebrow">Item pesanan</p><div v-for="item in selectedOrder.items" :key="`${item.slug}-${item.color}-${item.size}`"><span>{{ item.name }}<small>{{ item.color }} / {{ item.size }} × {{ item.quantity }}</small></span><strong>Rp {{ formatPrice(item.price * item.quantity) }}</strong></div></div>
          <dl><div><dt>Pelanggan</dt><dd>{{ selectedOrder.customer }}</dd></div><div v-if="selectedOrder.contact"><dt>Kontak</dt><dd>{{ selectedOrder.contact.phone }}<small>{{ selectedOrder.contact.email }}</small></dd></div><div v-if="selectedOrder.contact"><dt>Alamat</dt><dd>{{ selectedOrder.contact.address }}<small>{{ selectedOrder.contact.destination }} · {{ selectedOrder.contact.postalCode }}</small></dd></div><div><dt>Pembayaran</dt><dd>{{ selectedOrder.payment }}<small v-if="selectedOrder.paymentStatus">{{ selectedOrder.paymentStatus }}</small></dd></div><div v-if="selectedOrder.shipping"><dt>Pengiriman</dt><dd>{{ selectedOrder.shipping.courier }} {{ selectedOrder.shipping.service }}<small>{{ selectedOrder.shipping.etd }} · Rp {{ formatPrice(selectedOrder.shipping.price) }}</small></dd></div><div v-if="selectedOrder.trackingNumber"><dt>Resi</dt><dd>{{ selectedOrder.trackingNumber }}</dd></div><div><dt>Total</dt><dd>Rp {{ formatPrice(selectedOrder.total) }}</dd></div><div><dt>Dibuat</dt><dd>{{ selectedOrder.createdAt }}</dd></div></dl>
          <div v-if="selectedOrder.timeline?.length" class="admin-order-timeline"><p class="eyebrow">Riwayat status</p><div v-for="entry in selectedOrder.timeline" :key="`${entry.at}-${entry.label}`"><strong>{{ entry.label }}</strong><span>{{ new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.at)) }}</span></div></div>
                     <div v-if="isCodOrder" class="admin-action-stack"><button class="button button-outline button-wide" @click="codAction('confirm')">Konfirmasi COD</button><button class="button button-outline button-wide" @click="codAction('collect')">Tandai tertagih</button><button class="button button-outline button-wide" @click="codAction('settle')">Catat settlement</button></div><button class="button button-outline button-wide" :disabled="claiming" @click="claimOrder">{{ claiming ? 'Mengambil…' : 'Ambil pesanan' }}</button><fieldset class="admin-variant-editor"><legend>Checklist packing</legend><label><input v-model="checklist.itemsChecked" type="checkbox" />Jumlah item sesuai</label><label><input v-model="checklist.variantChecked" type="checkbox" />Warna dan ukuran sesuai</label><label><input v-model="checklist.conditionChecked" type="checkbox" />Kondisi barang baik</label><button class="button button-outline" type="button" @click="savePacking">Simpan checklist</button></fieldset>
           <label class="admin-status-field">Update status<select v-model="statusDraft"><option v-for="item in editableStatuses" :key="item" :value="item">{{ item }}</option></select></label><label class="admin-status-field">Nomor resi<input v-model="trackingDraft" type="text" autocomplete="off" placeholder="Contoh: JNE123456789" /></label><label class="admin-status-field">Catatan internal<textarea v-model="noteDraft" rows="3" placeholder="Catatan operasional, tidak terlihat pelanggan" /></label><p v-if="operationError" class="checkout-error" role="alert">{{ operationError }}</p><button class="button button-clay button-wide" @click="saveStatus">Simpan status</button><p v-if="statusSaved" class="admin-save-note" role="status">Status fulfillment diperbarui.</p><button class="button button-dark button-wide" @click="selectedOrder = null"><ChevronLeft :size="16" :stroke-width="1.5" />Kembali ke daftar</button>
        </div>
      </aside>
    </AppOverlay>
  </div>
</template>
