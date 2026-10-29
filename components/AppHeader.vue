<script setup lang="ts">
import { ArrowLeft, Heart, Menu, Search, ShoppingBag, X } from '@lucide/vue'

const emit = defineEmits<{ openCart: [] }>()
const menuOpen = ref(false)
const searchOpen = ref(false)
const searchQuery = ref('')
const cart = useState<Array<{ quantity?: number }>>('cart', () => [])
const { count: wishlistCount } = useWishlist()
const cartCount = computed(() => cart.value.reduce((total, item) => total + (item.quantity || 1), 0))
const route = useRoute()
const router = useRouter()
const isSubpage = computed(() => route.path !== '/')

const closeMenu = () => { menuOpen.value = false }
const goBack = () => {
  if (window.history.length > 1) router.back()
  else navigateTo('/')
}
</script>

<template>
  <header class="site-header">
    <div class="header-inner">
      <button v-if="isSubpage" class="mobile-back icon-button" aria-label="Kembali" @click="goBack">
        <ArrowLeft :size="21" :stroke-width="1.7" />
      </button>
      <button v-else class="menu-toggle icon-button" :aria-label="menuOpen ? 'Tutup menu' : 'Buka menu'" @click="menuOpen = !menuOpen">
        <X v-if="menuOpen" :size="21" :stroke-width="1.7" />
        <Menu v-else :size="21" :stroke-width="1.7" />
      </button>
      <NuxtLink to="/" class="wordmark" aria-label="Equine halaman utama" @click="closeMenu">EQUINE</NuxtLink>
      <nav class="desktop-nav" aria-label="Navigasi utama">
        <NuxtLink to="/">Home</NuxtLink>
        <NuxtLink to="/products" active-class="is-active">Shop</NuxtLink>
        <NuxtLink to="/#about">About Us</NuxtLink>
      </nav>
      <div class="header-actions">
        <span class="currency-label">IDR</span>
        <button class="icon-button" aria-label="Cari produk" @click="searchOpen = !searchOpen">
          <Search :size="20" :stroke-width="1.7" />
        </button>
        <NuxtLink to="/wishlist" class="icon-button wishlist-header-button" aria-label="Buka wishlist">
          <Heart :size="20" :stroke-width="1.7" />
          <span v-if="wishlistCount" class="header-count">{{ wishlistCount }}</span>
        </NuxtLink>
        <button class="cart-button" aria-label="Buka keranjang" @click="emit('openCart')">
          <ShoppingBag :size="19" :stroke-width="1.7" />
          <span class="cart-count">{{ cartCount }}</span>
        </button>
      </div>
    </div>
    <Transition name="search">
      <form v-if="searchOpen" class="search-panel" @submit.prevent="navigateTo(`/products?q=${encodeURIComponent(searchQuery)}`)">
        <Search :size="19" :stroke-width="1.7" />
        <input v-model="searchQuery" autofocus type="search" placeholder="Cari cargo, carpenter..." aria-label="Cari produk" />
        <button class="text-button" type="submit">Cari</button>
      </form>
    </Transition>
    <Transition name="menu">
      <nav v-if="menuOpen" class="mobile-menu" aria-label="Navigasi mobile">
        <NuxtLink to="/products" @click="closeMenu">Shop</NuxtLink>
        <NuxtLink to="/products?category=Carpenter" @click="closeMenu">Carpenter</NuxtLink>
        <NuxtLink to="/products?category=Cargo" @click="closeMenu">Cargo</NuxtLink>
        <NuxtLink to="/#about" @click="closeMenu">Tentang Equine</NuxtLink>
      </nav>
    </Transition>
  </header>
</template>
