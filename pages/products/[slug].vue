<script setup lang="ts">
import { ChevronDown, ChevronRight, Heart, Maximize2, Minus, Plus, RotateCcw, Truck, Video, X } from '@lucide/vue'
import { findProduct } from '~/data/products'
import type { AdminMedia, AdminProduct, AdminVariant } from '~/data/admin'
import type { CartItem } from '~/types/preview'

const route = useRoute()
const product = findProduct(String(route.params.slug))
if (!product) {
  throw createError({ statusCode: 404, statusMessage: 'Produk tidak ditemukan' })
}
const cart = useState<CartItem[]>('cart', () => [])
const cartOpen = useState('cart-open', () => false)
const { products: adminProducts } = useAdminStore()
const adminProduct = computed<AdminProduct | undefined>(() => adminProducts.value.find((item: AdminProduct) => item.slug === product.slug))
const variants = computed<AdminVariant[]>(() => adminProduct.value?.variants || [])
const media = computed<AdminMedia[]>(() => adminProduct.value?.media?.length ? adminProduct.value.media : [{ id: 'fallback', type: 'image', name: product.name, src: product.image, persisted: true }])
const selectedMediaId = ref('')
const selectedColor = ref(product.colors[0])
const selectedSize = ref('')
const quantity = ref(1)
const openInfo = ref('size')
const { isWished, toggle } = useWishlist()
const wished = computed(() => isWished(product.slug))
const selectionMessage = ref('')
const addModalOpen = ref(false)
const zoomOpen = ref(false)
const formatPrice = (price: number) => new Intl.NumberFormat('id-ID').format(price)
const selectedVariant = computed(() => variants.value.find((variant: AdminVariant) => variant.color === selectedColor.value && variant.size === selectedSize.value))
const currentPrice = computed(() => selectedVariant.value?.price || adminProduct.value?.price || product.price)
const selectedMedia = computed(() => media.value.find((item: AdminMedia) => item.id === selectedMediaId.value) || media.value[0])
const zoomableMedia = computed(() => media.value.find((item: AdminMedia) => item.type === 'image') || media.value[0])
const variantFor = (color: string, size: string) => variants.value.find((variant: AdminVariant) => variant.color === color && variant.size === size)
const availableStock = computed(() => selectedVariant.value?.stock || 0)
const productAvailable = computed(() => adminProduct.value?.active !== false && variants.value.some((variant: AdminVariant) => variant.stock > 0))

watch(media, (items: AdminMedia[]) => { if (!items.some((item: AdminMedia) => item.id === selectedMediaId.value)) selectedMediaId.value = items[0]?.id || '' }, { immediate: true })
watch(selectedColor, () => { if (selectedSize.value && !variantFor(selectedColor.value, selectedSize.value)?.stock) selectedSize.value = '' })

useHead({
  title: `${product.name} | Equine`,
  meta: [{ name: 'description', content: product.description }],
})

const addLineToCart = () => {
  const existing = cart.value.find((item) => item.slug === product.slug && item.color === selectedColor.value && item.size === selectedSize.value)
  if (existing) existing.quantity = Math.min(existing.quantity + quantity.value, availableStock.value)
  else cart.value.push({ slug: product.slug, name: product.name, price: currentPrice.value, color: selectedColor.value, size: selectedSize.value, quantity: Math.min(quantity.value, availableStock.value), variantId: selectedVariant.value?.id, sku: selectedVariant.value?.sku, availableStock: availableStock.value })
}

const openAddModal = () => {
  if (!selectedSize.value || !availableStock.value) {
    selectionMessage.value = selectedSize.value ? 'Varian ini sedang habis.' : 'Pilih ukuran terlebih dahulu.'
    return
  }
  addModalOpen.value = true
}

const confirmAddToCart = () => {
  addLineToCart()
  selectionMessage.value = ''
  addModalOpen.value = false
  cartOpen.value = true
}

const buyNow = () => {
  if (!selectedSize.value || !availableStock.value) {
    selectionMessage.value = selectedSize.value ? 'Varian ini sedang habis.' : 'Pilih ukuran terlebih dahulu.'
    return
  }
  addLineToCart()
  selectionMessage.value = ''
  navigateTo('/checkout')
}
</script>

<template>
  <div class="product-page page-container">
    <section class="product-detail">
      <div class="product-detail-media" :class="`tone-${product.tone}`">
        <span class="media-note">EQUINE STORE</span>
        <img v-if="selectedMedia.type === 'image'" class="product-detail-image" :src="selectedMedia.src" :alt="selectedMedia.name" />
        <video v-else class="product-detail-image" :src="selectedMedia.src" controls playsinline />
        <button v-if="zoomableMedia.type === 'image'" class="media-zoom" aria-label="Perbesar foto produk" @click="zoomOpen = true"><Maximize2 :size="18" :stroke-width="1.5" /></button>
      </div>
      <div v-if="media.length > 1" class="product-media-thumbs" aria-label="Galeri media produk"><button v-for="item in media" :key="item.id" :class="{ 'is-selected': selectedMedia.id === item.id }" :aria-label="`Pilih ${item.name}`" @click="selectedMediaId = item.id"><img v-if="item.type === 'image'" :src="item.src" :alt="item.name" /><span v-else><Video :size="16" :stroke-width="1.5" />Video</span></button></div>

      <div class="product-detail-copy">
        <div class="detail-status">{{ productAvailable ? (selectedSize ? `${availableStock} tersedia` : 'Tersedia') : 'Stok habis' }}</div>
        <div class="detail-title-row">
          <div>
            <p class="eyebrow">{{ product.category }} / Equine</p>
            <h1>{{ product.name }}</h1>
          </div>
          <button class="detail-wishlist" :class="{ 'is-wished': wished }" :aria-label="wished ? `Hapus ${product.name} dari wishlist` : `Simpan ${product.name}`" :aria-pressed="wished" @click="toggle(product.slug)">
            <Heart :size="21" :stroke-width="1.35" :fill="wished ? 'currentColor' : 'none'" />
          </button>
        </div>

        <div class="detail-price">
          <span v-if="product.originalPrice" class="detail-original-price">Rp {{ formatPrice(product.originalPrice) }}</span>
          <span class="detail-current-price">Rp {{ formatPrice(currentPrice) }}</span>
          <span v-if="product.discount" class="discount">-{{ product.discount }}%</span>
        </div>

        <div class="selection-group">
          <div class="selection-label"><span>Warna</span><strong>{{ selectedColor }}</strong></div>
          <div class="swatch-list">
            <button v-for="color in product.colors" :key="color" :class="['color-swatch', `swatch-${color.toLowerCase().replaceAll(' ', '-')}`, { 'is-selected': selectedColor === color }]" :aria-label="`Pilih warna ${color}`" :aria-pressed="selectedColor === color" :disabled="!product.sizes.some((size) => variantFor(color, size)?.stock)" @click="selectedColor = color" />
          </div>
        </div>

        <div class="selection-group">
          <div class="selection-label"><span>Ukuran</span><NuxtLink to="/size-guide" class="size-link">Lihat size guide</NuxtLink></div>
          <div class="size-list">
            <button v-for="size in product.sizes" :key="size" :class="['size-option', { 'is-selected': selectedSize === size, 'is-sold-out': !variantFor(selectedColor, size)?.stock }]" :aria-pressed="selectedSize === size" :disabled="!variantFor(selectedColor, size)?.stock" @click="selectedSize = size; selectionMessage = ''">{{ size }}</button>
          </div>
        </div>

        <div class="purchase-row">
          <div class="quantity-control large-control" aria-label="Jumlah produk">
            <button aria-label="Kurangi jumlah" @click="quantity = Math.max(1, quantity - 1)"><Minus :size="15" :stroke-width="1.7" /></button>
            <span>{{ quantity }}</span>
            <button aria-label="Tambah jumlah" :disabled="!availableStock || quantity >= availableStock" @click="quantity += 1"><Plus :size="15" :stroke-width="1.7" /></button>
          </div>
          <div class="purchase-actions">
            <button class="button button-clay purchase-button" :disabled="!selectedSize || !availableStock" @click="openAddModal">{{ !productAvailable ? 'Stok habis' : selectedSize ? 'Add to Cart' : 'Pilih ukuran' }}</button>
            <button class="button button-outline buy-now-button" :disabled="!selectedSize || !availableStock" @click="buyNow">Buy It Now</button>
          </div>
        </div>
        <p v-if="selectionMessage" class="selection-message" role="status">{{ selectionMessage }}</p>

        <div class="detail-notes">
          <div><Truck :size="18" :stroke-width="1.5" /><span>Ongkir dihitung saat checkout.</span></div>
          <div><RotateCcw :size="18" :stroke-width="1.5" /><span>Info retur mengikuti kebijakan toko.</span></div>
        </div>

        <div class="delivery-panel">
          <h2>Pengiriman</h2>
          <div class="delivery-row"><span>Kirim ke</span><strong>Atur di checkout</strong></div>
          <div class="delivery-row"><span>Berat</span><strong>Dihitung saat checkout</strong></div>
          <p>Estimasi pengiriman mengikuti konfirmasi pembayaran dan alamat tujuan.</p>
        </div>

        <div class="accordion-list">
          <button class="accordion-trigger" @click="openInfo = openInfo === 'size' ? '' : 'size'"><span>Size guide</span><ChevronDown :class="{ rotated: openInfo === 'size' }" :size="18" :stroke-width="1.6" /></button>
          <div v-if="openInfo === 'size'" class="accordion-content">
            <p>Ukuran tersedia: {{ product.sizes.join(', ') }}. Ukuran lingkar pinggang dalam sentimeter belum tersedia; size chart akan ditampilkan setelah data resmi Equine dikonfirmasi.</p>
          </div>
        </div>

        <p class="detail-description">{{ product.description }}</p>

        <div class="accordion-list">
          <button class="accordion-trigger" @click="openInfo = openInfo === 'material' ? '' : 'material'"><span>Bahan & perawatan</span><ChevronDown :class="{ rotated: openInfo === 'material' }" :size="18" :stroke-width="1.6" /></button>
          <div v-if="openInfo === 'material'" class="accordion-content"><p>{{ product.material }}. Ikuti petunjuk perawatan pada label produk.</p></div>
        </div>
      </div>
    </section>

    <AppOverlay :open="addModalOpen" label="Tambah ke keranjang" @close="addModalOpen = false">
      <div v-if="addModalOpen" class="add-modal-backdrop" @click="addModalOpen = false">
        <section class="add-modal" aria-labelledby="add-modal-title" @click.stop>
          <div class="add-modal-head">
            <h2 id="add-modal-title">Add to Cart</h2>
            <button class="icon-button" aria-label="Tutup Add to Cart" @click="addModalOpen = false"><X :size="19" :stroke-width="1.7" /></button>
          </div>
          <div class="add-modal-product">
            <img :src="zoomableMedia.src" :alt="zoomableMedia.name" />
            <div>
              <h3>{{ product.name }}</h3>
              <span v-if="product.discount" class="modal-discount">{{ product.discount }}% Off</span>
              <del v-if="product.originalPrice">Rp {{ formatPrice(product.originalPrice) }}</del>
              <strong>Rp {{ formatPrice(currentPrice) }}</strong>
              <p>{{ selectedColor }} / {{ selectedSize }}</p>
            </div>
            <ChevronRight class="add-modal-arrow" :size="19" :stroke-width="1.7" />
          </div>
          <div class="modal-quantity quantity-control" aria-label="Jumlah produk">
            <button aria-label="Kurangi jumlah" @click="quantity = Math.max(1, quantity - 1)"><Minus :size="14" :stroke-width="1.7" /></button>
            <span>{{ quantity }}</span>
            <button aria-label="Tambah jumlah" :disabled="quantity >= availableStock" @click="quantity += 1"><Plus :size="14" :stroke-width="1.7" /></button>
          </div>
          <button class="button button-clay button-wide modal-confirm" @click="confirmAddToCart">Add to Cart</button>
        </section>
      </div>
    </AppOverlay>
    <AppOverlay :open="zoomOpen" label="Foto produk" @close="zoomOpen = false">
      <div v-if="zoomOpen" class="product-zoom-backdrop" @click="zoomOpen = false">
        <section class="product-zoom-dialog" aria-label="Foto produk" @click.stop>
          <img :src="zoomableMedia.src" :alt="zoomableMedia.name" />
          <button class="icon-button product-zoom-close" aria-label="Tutup foto produk" @click="zoomOpen = false"><X :size="20" :stroke-width="1.7" /></button>
        </section>
      </div>
    </AppOverlay>
  </div>
</template>
