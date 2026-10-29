<script setup lang="ts">
import { Minus, Plus, ShoppingBag, X } from '@lucide/vue'
import { findProduct } from '~/data/products'
import type { CartItem } from '~/types/preview'

const cart = useState<CartItem[]>('cart', () => [])
const cartOpen = useState('cart-open', () => false)

const cartTotal = computed(() => cart.value.reduce((total, item) => total + item.price * item.quantity, 0))
const cartQuantity = computed(() => cart.value.reduce((total, item) => total + item.quantity, 0))
const cartSavings = computed(() => cart.value.reduce((total, item) => {
  const originalPrice = findProduct(item.slug)?.originalPrice || item.price
  return total + Math.max(0, originalPrice - item.price) * item.quantity
}, 0))

if (import.meta.client) {
  onMounted(() => {
    const storedCart = localStorage.getItem('equine-cart')
    if (!storedCart) return
    try {
      cart.value = JSON.parse(storedCart)
    } catch {
      localStorage.removeItem('equine-cart')
    }
  })

  watch(cart, (value: typeof cart.value) => {
    localStorage.setItem('equine-cart', JSON.stringify(value))
  }, { deep: true })

}

const formatPrice = (price: number) => new Intl.NumberFormat('id-ID').format(price)

const increase = (slug: string, color: string, size: string) => {
  const item = cart.value.find((entry) => entry.slug === slug && entry.color === color && entry.size === size)
  if (item) item.quantity = Math.min(item.availableStock || Number.MAX_SAFE_INTEGER, item.quantity + 1)
}

const decrease = (slug: string, color: string, size: string) => {
  const index = cart.value.findIndex((entry) => entry.slug === slug && entry.color === color && entry.size === size)
  if (index === -1) return
  if (cart.value[index].quantity === 1) cart.value.splice(index, 1)
  else cart.value[index].quantity -= 1
}

const removeItem = (slug: string, color: string, size: string) => {
  cart.value = cart.value.filter((entry) => !(entry.slug === slug && entry.color === color && entry.size === size))
}
</script>

<template>
  <div class="site-shell">
    <AppHeader @open-cart="cartOpen = true" />
    <main>
      <slot />
    </main>
    <AppFooter />

    <AppOverlay :open="cartOpen" label="Keranjang belanja" @close="cartOpen = false">
      <div v-if="cartOpen" class="drawer-backdrop" @click="cartOpen = false" />
      <aside v-if="cartOpen" class="cart-drawer" aria-label="Keranjang belanja">
        <div class="drawer-head">
          <div>
            <p class="eyebrow">Pesanan Anda</p>
            <h2>Cart</h2>
          </div>
          <button class="icon-button" aria-label="Tutup keranjang" @click="cartOpen = false">
            <X :size="20" :stroke-width="1.7" />
          </button>
        </div>

        <div v-if="cart.length" class="drawer-items">
          <article v-for="item in cart" :key="`${item.slug}-${item.color}-${item.size}`" class="drawer-item">
            <div class="drawer-item-media">
              <img v-if="findProduct(item.slug)?.image" :src="findProduct(item.slug)?.image" :alt="item.name" />
            </div>
            <div class="drawer-item-copy">
              <div class="drawer-item-topline">
                <h3>{{ item.name }}</h3>
                <button class="text-button danger" @click="removeItem(item.slug, item.color, item.size)">Hapus</button>
              </div>
              <p>{{ item.color }} / {{ item.size }}</p>
              <span v-if="findProduct(item.slug)?.discount" class="drawer-discount">{{ findProduct(item.slug)?.discount }}% Off</span>
              <div class="drawer-item-bottomline">
                <span class="drawer-price"><del v-if="findProduct(item.slug)?.originalPrice">Rp {{ formatPrice(findProduct(item.slug)?.originalPrice || 0) }}</del>Rp {{ formatPrice(item.price * item.quantity) }}</span>
                <div class="quantity-control" aria-label="Jumlah produk">
                  <button aria-label="Kurangi jumlah" @click="decrease(item.slug, item.color, item.size)"><Minus :size="13" :stroke-width="1.8" /></button>
                  <span>{{ item.quantity }}</span>
                  <button aria-label="Tambah jumlah" @click="increase(item.slug, item.color, item.size)"><Plus :size="13" :stroke-width="1.8" /></button>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="drawer-empty">
          <ShoppingBag :size="28" :stroke-width="1.4" />
          <h3>Keranjang masih kosong</h3>
          <p>Pilih produk Equine untuk mulai berbelanja.</p>
          <NuxtLink to="/products" class="button button-dark" @click="cartOpen = false">Lihat produk</NuxtLink>
        </div>

        <div v-if="cart.length" class="drawer-footer">
          <div class="drawer-total"><span>Total Price ({{ cartQuantity }})</span><strong>Rp {{ formatPrice(cartTotal) }}</strong></div>
          <p v-if="cartSavings" class="drawer-savings">Hemat Rp {{ formatPrice(cartSavings) }}</p>
          <NuxtLink to="/checkout" class="button button-clay button-wide" @click="cartOpen = false">Checkout</NuxtLink>
          <p class="drawer-note">Ongkir dihitung setelah alamat pengiriman diisi.</p>
        </div>
      </aside>
    </AppOverlay>
  </div>
</template>
