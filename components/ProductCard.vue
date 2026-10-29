<script setup lang="ts">
import { Heart } from '@lucide/vue'
import type { Product } from '~/data/products'
import type { AdminMedia, AdminProduct } from '~/data/admin'

const props = defineProps<{ product: Product }>()
const { isWished, toggle } = useWishlist()
const { products: adminProducts } = useAdminStore()
const wished = computed(() => isWished(props.product.slug))
const formatPrice = (price: number) => new Intl.NumberFormat('id-ID').format(price)
const adminProduct = computed(() => adminProducts.value.find((item: AdminProduct) => item.slug === props.product.slug))
const image = computed(() => adminProduct.value?.media.find((item: AdminMedia) => item.type === 'image')?.src || props.product.image)
const price = computed(() => adminProduct.value?.price || props.product.price)
const unavailable = computed(() => props.product.soldOut || !adminProduct.value?.active || adminProduct.value.stock === 0)
</script>

<template>
  <article class="product-card">
    <div class="product-media" :class="`tone-${product.tone}`">
      <span class="media-note">EQUINE STORE</span>
      <span v-if="product.discount" class="card-badge">{{ product.discount }}%</span>
      <img class="product-image" :src="image" :alt="product.name" loading="lazy" />
      <div class="pant-shape" aria-hidden="true"><span /><span /></div>
      <NuxtLink :to="`/products/${product.slug}`" class="media-link" :aria-label="`Lihat ${product.name}`" />
      <button class="wishlist-button" :class="{ 'is-wished': wished }" :aria-label="wished ? `Hapus ${product.name} dari wishlist` : `Simpan ${product.name}`" :aria-pressed="wished" @click="toggle(product.slug)">
        <Heart :size="20" :stroke-width="1.35" :fill="wished ? 'currentColor' : 'none'" />
      </button>
    </div>
    <div class="product-info">
      <NuxtLink :to="`/products/${product.slug}`" class="product-name">{{ product.name }}</NuxtLink>
      <div class="product-price-row">
        <span v-if="product.originalPrice" class="product-original-price">Rp {{ formatPrice(product.originalPrice) }}</span>
        <span class="product-price">Rp {{ formatPrice(price) }}</span>
      </div>
      <span v-if="unavailable" class="buy-link">Stok habis</span>
      <NuxtLink v-else :to="`/products/${product.slug}`" class="buy-link">Pilih varian</NuxtLink>
    </div>
  </article>
</template>
