<script setup lang="ts">
import { ArrowLeft, Check, MapPin, Truck } from '@lucide/vue'
import type { CartItem } from '~/types/preview'

type ShippingOption = { id: string; courier: string; service: string; etd: string; price: number; destinationId?: string; quoteToken?: string }

const cart = useState<CartItem[]>('cart', () => [])
const isPreview = import.meta.dev
const formatPrice = (price: number) => new Intl.NumberFormat('id-ID').format(price)
const destinations = ['Kebayoran Baru, Jakarta Selatan', 'Cidadap, Bandung', 'Tegalsari, Surabaya', 'Klojen, Malang']
const shippingOptions: ShippingOption[] = [
  { id: 'jne-reg', courier: 'JNE', service: 'REG', etd: '2-4 hari', price: 18000 },
  { id: 'jnt-ez', courier: 'J&T', service: 'EZ', etd: '2-4 hari', price: 20000 },
  { id: 'sicepat-reg', courier: 'SiCepat', service: 'REG', etd: '2-5 hari', price: 19000 },
]
const paymentOptions = [
  { id: 'qris', name: 'QRIS', description: 'Scan dengan aplikasi pembayaran Anda' },
  { id: 'bri_va', name: 'BRI Virtual Account', description: 'Pembayaran melalui BRI' },
  { id: 'bni_va', name: 'BNI Virtual Account', description: 'Pembayaran melalui BNI' },
  { id: 'cod', name: 'COD', description: 'Bayar saat paket diterima' },
]
const form = reactive({ email: '', phone: '', name: '', address: '', destination: '', postalCode: '' })
const destinationQuery = ref('')
const destinationId = ref('')
const liveDestinations = ref<Array<{ id: string; label: string }>>([])
const selectedShipping = ref(shippingOptions[0].id)
const shippingQuotes = ref<ShippingOption[]>([])
const { data: health } = await useFetch<{ status: string; integrations: { pakasir: boolean; rajaOngkir: boolean } }>('/api/health')
const shippingOptionsView = computed(() => shippingQuotes.value.length ? shippingQuotes.value : (isPreview ? shippingOptions : []))
const liveCheckoutReady = computed(() => isPreview || Boolean(health.value?.integrations.rajaOngkir && (selectedPayment.value === 'cod' || health.value.integrations.pakasir)))
const loadQuotes = async () => { if (!destinationId.value) return; try { shippingQuotes.value = await $fetch<any[]>('/api/shipping/quotes', { method: 'POST', body: { destinationId: destinationId.value, weight: checkoutItems.value.reduce((sum: number, item: CartItem) => sum + (item.quantity * 500), 0), courier: 'jne:jnt:sicepat' } }); if (shippingQuotes.value[0]) selectedShipping.value = shippingQuotes.value[0].id } catch { shippingQuotes.value = [] } }
const selectedPayment = ref('qris')
const voucherCode = ref('')
const voucherDiscount = ref(0)
const voucherMessage = ref('')
const applyVoucher = async () => { try { const result = await $fetch<{ discount: number }>('/api/vouchers/validate', { method: 'POST', body: { code: voucherCode.value, subtotal: subtotal.value } }); voucherDiscount.value = result.discount; voucherMessage.value = `Potongan Rp ${formatPrice(result.discount)}` } catch (error: any) { voucherDiscount.value = 0; voucherMessage.value = error?.data?.statusMessage || 'Voucher tidak valid.' } }
const orderError = ref('')
const { data: customerSession } = await useFetch<any>('/api/auth/session')
const { products } = useAdminStore()

const currentVariant = (item: CartItem) => {
  const product = products.value.find((candidate) => candidate.slug === item.slug)
  const variant = product?.variants.find((candidate) => candidate.sku === item.sku) || product?.variants.find((candidate) => candidate.color === item.color && candidate.size === item.size)
  return { product, variant }
}
const checkoutItems = computed<CartItem[]>(() => cart.value.map((item) => {
  const { variant } = currentVariant(item)
  return variant ? { ...item, price: variant.price, sku: variant.sku, availableStock: variant.stock } : item
}))
const subtotal = computed(() => checkoutItems.value.reduce((total: number, item: CartItem) => total + item.price * item.quantity, 0))

const matchingDestinations = computed(() => destinations.filter((destination) => destination.toLowerCase().includes(destinationQuery.value.toLowerCase())))
const shipping = computed(() => shippingOptionsView.value.find((option: ShippingOption) => option.id === selectedShipping.value) || shippingOptionsView.value[0] || shippingOptions[0])
const total = computed(() => subtotal.value - voucherDiscount.value + shipping.value.price)
const canSubmit = computed(() => Boolean(cart.value.length && form.email && form.phone && form.name && form.address && form.destination && form.postalCode && selectedShipping.value && selectedPayment.value && liveCheckoutReady.value && (isPreview || shipping.value.quoteToken)))

watch(() => destinationQuery.value, () => {
  if (destinationQuery.value !== form.destination) form.destination = ''
})

const searchLiveDestinations = async () => {
  if (destinationQuery.value.length < 3) return
  try { liveDestinations.value = await $fetch<any[]>('/api/shipping/destinations', { query: { search: destinationQuery.value } }).then((items) => items.map((item) => ({ id: String(item.id), label: item.label || item.name || item.subdistrict_name || destinationQuery.value }))) } catch { liveDestinations.value = [] }
}
const selectDestination = (destination: string, id = '') => {
  form.destination = destination
  destinationId.value = id
  destinationQuery.value = destination
  loadQuotes()
}

const validateInventory = () => {
  for (const item of cart.value) {
    const { product, variant } = currentVariant(item)
    if (!product) return `${item.name} tidak lagi tersedia. Hapus produk dari keranjang.`
    if (!product.active) return `${item.name} sedang nonaktif. Hapus produk dari keranjang.`
    if (!variant) return `Varian ${item.name} ${item.color} / ${item.size} tidak lagi tersedia.`
    if (variant.stock < item.quantity) return `Stok ${item.name} ${item.color} / ${item.size} tersisa ${variant.stock}. Sesuaikan jumlah di keranjang.`
  }
  return ''
}

const submitCheckout = async () => {
  if (!customerSession.value) { await navigateTo('/login'); return }
  if (!liveCheckoutReady.value) { orderError.value = selectedPayment.value === 'cod' ? 'Pengiriman belum tersedia. Coba lagi setelah layanan ongkir aktif.' : 'Pembayaran online belum tersedia. Coba lagi setelah layanan pembayaran dan ongkir aktif.'; return }
  if (!canSubmit.value) {
    orderError.value = 'Lengkapi kontak, alamat, tujuan, dan layanan pengiriman terlebih dahulu.'
    return
  }
  orderError.value = validateInventory()
  if (orderError.value) return
  const items = checkoutItems.value.map((item: CartItem) => ({ variantId: item.variantId, quantity: item.quantity }))
  if (items.some((item: { variantId?: string; quantity: number }) => !item.variantId)) { orderError.value = 'Keranjang lama tidak kompatibel. Hapus item lalu tambahkan kembali.'; return }
  try {
    const order = await $fetch<{ orderNumber: string }>('/api/orders', { method: 'POST', body: { items, contact: { ...form, destinationId: destinationId.value }, shipping: { ...shipping.value, quoteToken: shipping.value.quoteToken }, paymentMethod: selectedPayment.value === 'cod' ? 'cod' : 'online', voucherCode: voucherCode.value || undefined } })
    navigateTo(`/payment/${order.orderNumber}`)
  } catch (error: any) {
    orderError.value = error?.data?.statusMessage || 'Pesanan gagal dibuat. Coba lagi.'
  }
}
</script>

<template>
  <div class="checkout-page page-container">
    <NuxtLink to="/products" class="back-link"><ArrowLeft :size="16" :stroke-width="1.6" />Kembali belanja</NuxtLink>
    <section v-if="!cart.length" class="checkout-empty-state standalone-empty-state">
      <p class="eyebrow">Equine / checkout</p>
      <h1>Keranjang masih kosong.</h1>
      <p>Pilih produk terlebih dahulu sebelum melanjutkan ke checkout.</p>
      <NuxtLink to="/products" class="button button-dark">Lihat produk</NuxtLink>
    </section>
    <section v-else class="checkout-layout">
      <div>
        <p class="eyebrow">Equine / checkout</p>
        <h1>Lengkapi pesanan.</h1>
        <p v-if="!liveCheckoutReady" class="preview-notice" role="status">Checkout live belum aktif. Pilihan pengiriman dan pembayaran akan muncul setelah layanan toko terhubung.</p><p v-else-if="isPreview" class="preview-notice">Simulasi checkout. Gunakan data contoh; pesanan hanya disimpan di tab browser ini dan tidak diproses oleh toko.</p>
        <form class="checkout-form" @submit.prevent="submitCheckout">
          <div class="checkout-section">
            <h2>Kontak</h2>
            <label>Email<input v-model="form.email" required autocomplete="email" type="email" placeholder="nama@email.com" /></label>
            <label>Nomor WhatsApp<input v-model="form.phone" required autocomplete="tel" type="tel" inputmode="tel" placeholder="08xxxxxxxxxx" /></label>
          </div>
          <div class="checkout-section">
            <h2>Alamat pengiriman</h2>
            <label>Nama penerima<input v-model="form.name" required autocomplete="name" type="text" placeholder="Nama lengkap" /></label>
            <label>Alamat lengkap<textarea v-model="form.address" required autocomplete="street-address" rows="3" placeholder="Jalan, nomor rumah, patokan" /></label>
            <label class="destination-field">Kecamatan atau kota
              <span class="input-with-icon"><MapPin :size="17" :stroke-width="1.5" /><input v-model="destinationQuery" required type="search" autocomplete="address-level2" placeholder="Cari tujuan pengiriman" @focus="destinationQuery = form.destination ? destinationQuery : ''; searchLiveDestinations()" @input="searchLiveDestinations" /><Check v-if="form.destination" class="field-valid-icon" :size="17" :stroke-width="1.8" /></span>
              <span v-if="destinationQuery && !form.destination && (liveDestinations.length || matchingDestinations.length)" class="destination-list"><button v-for="destination in liveDestinations" :key="destination.id" type="button" @click="selectDestination(destination.label, destination.id)">{{ destination.label }}</button><button v-if="!liveDestinations.length" v-for="destination in matchingDestinations" :key="destination" type="button" @click="selectDestination(destination)">{{ destination }}</button></span>
            </label>
            <div class="form-grid"><label>Kode pos<input v-model="form.postalCode" required autocomplete="postal-code" inputmode="numeric" type="text" placeholder="Kode pos" /></label><div class="address-confirmation"><Check :size="16" :stroke-width="1.7" /><span>{{ form.destination || 'Tujuan dipilih dari data lokasi' }}</span></div></div>
          </div>
          <div class="checkout-section">
            <div class="section-title-row"><h2>Pengiriman</h2><span class="section-caption">{{ isPreview ? 'Tarif simulasi' : 'Tarif live' }}</span></div>
            <div v-if="shippingOptionsView.length" class="shipping-options"><label v-for="option in shippingOptionsView" :key="option.id" class="shipping-option" :class="{ 'is-selected': selectedShipping === option.id }"><input v-model="selectedShipping" type="radio" name="shipping" :value="option.id" /><span class="shipping-option-copy"><strong>{{ option.courier }} <small>{{ option.service }}</small></strong><span>{{ option.etd }}</span></span><b>Rp {{ formatPrice(option.price) }}</b></label></div><p v-else class="checkout-error" role="status">Tarif pengiriman belum tersedia untuk tujuan ini.</p>
          </div>
          <div class="checkout-section"><h2>Voucher</h2><div class="form-grid"><input v-model="voucherCode" type="text" placeholder="Kode voucher" /><button type="button" class="button button-outline" @click="applyVoucher">Gunakan</button></div><p v-if="voucherMessage" role="status">{{ voucherMessage }}</p></div>
          <div class="checkout-section">
             <div class="section-title-row"><h2>Pembayaran</h2><span class="section-caption">{{ isPreview ? 'Metode simulasi' : 'Metode live' }}</span></div>
            <div class="payment-options"><label v-for="option in paymentOptions" :key="option.id" class="payment-option" :class="{ 'is-selected': selectedPayment === option.id }"><input v-model="selectedPayment" type="radio" name="payment" :value="option.id" /><span><strong>{{ option.name }}</strong><small>{{ option.description }}</small></span><Check v-if="selectedPayment === option.id" :size="17" :stroke-width="1.8" /></label></div>
          </div>
          <p v-if="orderError" class="checkout-error" role="alert">{{ orderError }}</p>
          <button class="button button-clay button-wide checkout-submit" type="submit" :disabled="!liveCheckoutReady">{{ liveCheckoutReady ? 'Lanjut ke pembayaran' : 'Checkout belum tersedia' }}</button>
        </form>
      </div>
      <aside class="checkout-summary">
        <p class="eyebrow">Ringkasan</p>
        <div class="summary-items"><div v-for="item in checkoutItems" :key="`${item.slug}-${item.color}-${item.size}`" class="summary-item"><span>{{ item.name }} <small>{{ item.color }} / {{ item.size }} × {{ item.quantity }}</small></span><strong>Rp {{ formatPrice(item.price * item.quantity) }}</strong></div></div>
        <div class="summary-total"><span>Subtotal</span><strong>Rp {{ formatPrice(subtotal) }}</strong></div>
        <div class="summary-total shipping-total"><span><Truck :size="15" :stroke-width="1.5" /> {{ shipping.courier }} {{ shipping.service }}</span><strong>Rp {{ formatPrice(shipping.price) }}</strong></div>
        <div class="summary-grand-total"><span>Total</span><strong>Rp {{ formatPrice(total) }}</strong></div>
        <p class="summary-note">{{ isPreview ? 'Preview saja. Tidak ada pembayaran atau pengiriman nyata.' : 'Total dihitung dari quote pengiriman dan layanan toko yang aktif.' }}</p>
      </aside>
    </section>
  </div>
</template>
