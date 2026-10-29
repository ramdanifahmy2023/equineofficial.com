<script setup lang="ts">
import { ArrowRight, Heart, ShoppingBag } from '@lucide/vue'
import ProductCard from '~/components/ProductCard.vue'
import { products } from '~/data/products'

const { wishlist, remove } = useWishlist()
const wishedProducts = computed(() => products.filter((product) => wishlist.value.includes(product.slug)))

useHead({ title: 'Wishlist | Equine' })

</script>

<template>
  <div class="wishlist-page page-container">
    <div class="page-heading-row">
      <div>
        <p class="eyebrow">Equine / saved pieces</p>
        <h1>Wishlist.</h1>
      </div>
      <span v-if="wishedProducts.length" class="page-count">{{ wishedProducts.length }} produk</span>
    </div>

    <section v-if="wishedProducts.length" class="wishlist-grid" aria-label="Produk yang disimpan">
      <div v-for="product in wishedProducts" :key="product.slug" class="wishlist-item">
        <ProductCard :product="product" />
        <button class="wishlist-remove" @click="remove(product.slug)">Hapus dari wishlist <ArrowRight :size="14" :stroke-width="1.5" /></button>
      </div>
    </section>

    <section v-else class="wishlist-empty standalone-empty-state">
      <div class="empty-icon"><Heart :size="26" :stroke-width="1.4" /></div>
      <h2>Belum ada produk tersimpan.</h2>
      <p>Simpan produk yang ingin Anda bandingkan atau beli nanti.</p>
      <NuxtLink to="/products" class="button button-dark">Lihat produk <ShoppingBag :size="16" :stroke-width="1.5" /></NuxtLink>
    </section>
  </div>
</template>
