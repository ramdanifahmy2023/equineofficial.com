<script setup lang="ts">
import { Check, Globe2, MapPin, Save, Store } from '@lucide/vue'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const form = reactive({
  storeName: 'Equine Official',
  domain: 'equineofficial.com',
  origin: 'Jakarta Selatan',
  weight: '1000',
  couriers: ['JNE', 'J&T', 'SiCepat'],
  pakasirReady: false,
  rajaOngkirReady: false,
  emailReady: false,
  whatsapp: '',
  codEnabled: false,
  refundSlaDays: '2',
})
const saved = ref(false)
const saveError = ref('')
const storageKey = 'equine-preview-settings-v1'
onMounted(() => {
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return
    const value = JSON.parse(stored)
    if (!value || !['storeName', 'domain', 'origin', 'weight'].every((key) => typeof value[key] === 'string') || !Array.isArray(value.couriers) || !value.couriers.every((item: unknown) => typeof item === 'string')) throw new Error('Invalid settings')
    Object.assign(form, value)
  } catch {
    saveError.value = 'Pengaturan tersimpan tidak dapat dimuat. Periksa isian lalu simpan ulang.'
  }
})
watch(form, () => { saved.value = false })
const saveSettings = () => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(form))
    saveError.value = ''
    saved.value = true
  } catch {
    saved.value = false
    saveError.value = 'Pengaturan belum tersimpan. Aktifkan penyimpanan browser lalu coba lagi.'
  }
}
</script>

<template>
  <div class="admin-page">
    <div class="admin-page-heading"><div><p class="eyebrow">Store setup</p><h1>Pengaturan.</h1></div><span class="admin-date">Frontend preview</span></div>
    <div class="settings-layout">
      <form class="admin-panel admin-settings-form" @submit.prevent="saveSettings">
        <div class="admin-panel-heading"><div><p class="eyebrow">Store profile</p><h2>Identitas toko</h2></div><Store :size="19" :stroke-width="1.5" /></div>
        <label>Nama toko<input v-model="form.storeName" type="text" /></label>
        <label>Domain<input v-model="form.domain" type="text" /></label>
        <div class="admin-panel-heading settings-subheading"><div><p class="eyebrow">Shipping defaults</p><h2>Pengiriman</h2></div><MapPin :size="19" :stroke-width="1.5" /></div>
        <label>Kota gudang<input v-model="form.origin" type="text" /></label>
        <label>Berat default (gram)<input v-model="form.weight" type="number" min="1" /></label>
        <fieldset><legend>Kurir yang ditampilkan</legend><label v-for="courier in ['JNE', 'J&T', 'SiCepat', 'Pos Indonesia']" :key="courier" class="settings-check"><input v-model="form.couriers" type="checkbox" :value="courier" />{{ courier }}</label></fieldset>
        <div class="admin-panel-heading settings-subheading"><div><p class="eyebrow">Integrations</p><h2>Kesiapan layanan</h2></div><Globe2 :size="19" :stroke-width="1.5" /></div>
        <label>WhatsApp bantuan<input v-model="form.whatsapp" type="tel" placeholder="628xxxxxxxxxx" /></label>
        <fieldset><legend>Status konfigurasi server</legend><label class="settings-check"><input v-model="form.pakasirReady" type="checkbox" />Pakasir siap</label><label class="settings-check"><input v-model="form.rajaOngkirReady" type="checkbox" />RajaOngkir siap</label><label class="settings-check"><input v-model="form.emailReady" type="checkbox" />Email siap</label><label class="settings-check"><input v-model="form.codEnabled" type="checkbox" />Aktifkan COD setelah verifikasi kurir</label></fieldset>
        <label>SLA refund (hari kerja)<input v-model="form.refundSlaDays" type="number" min="1" /></label>
        <p class="summary-note">API key dan password tidak boleh dimasukkan di halaman ini. Simpan sebagai environment variable server.</p>
        <button class="button button-clay" type="submit"><Save :size="16" :stroke-width="1.6" />Simpan pengaturan</button>
        <p v-if="saved" class="admin-save-note" role="status"><Check :size="15" :stroke-width="1.7" />Pengaturan preview tersimpan di browser ini.</p>
        <p v-if="saveError" class="checkout-error" role="alert">{{ saveError }}</p>
      </form>
      <aside class="settings-status">
        <div class="settings-status-icon"><Globe2 :size="19" :stroke-width="1.5" /></div>
        <p class="eyebrow">Integration readiness</p>
        <h2>Frontend siap disambungkan.</h2>
        <p>Domain, asal gudang, pilihan kurir, dan berat default akan menjadi input untuk RajaOngkir saat backend diaktifkan.</p>
        <div class="settings-status-row"><span><Check :size="15" :stroke-width="1.8" />Catalog</span><strong>Ready</strong></div>
        <div class="settings-status-row"><span><Check :size="15" :stroke-width="1.8" />Checkout</span><strong>Ready</strong></div>
        <div class="settings-status-row"><span><Check :size="15" :stroke-width="1.8" />Payment UI</span><strong>Preview</strong></div>
        <div class="settings-status-row"><span><Check :size="15" :stroke-width="1.8" />Shipping UI</span><strong>Preview</strong></div>
      </aside>
    </div>
  </div>
</template>
