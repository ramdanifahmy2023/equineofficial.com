<script setup lang="ts">
import { ArrowRight } from '@lucide/vue'
import { products } from '~/data/products'

const featured = products.slice(0, 4)
const categoryTiles = [
  { label: 'Cargo', to: '/products?category=Cargo', image: '/product-images/cargo-premium.jpg' },
  { label: 'Carpenter', to: '/products?category=Carpenter', image: '/product-images/carpenter-king-marsoto.jpg' },
  { label: 'Loreng', to: '/products?category=Cargo%20Loreng', image: '/product-images/cargo-camo-loreng.jpg' },
]
</script>

<template>
  <div>
    <section class="home-hero" aria-label="Equine workwear pants">
      <img src="/product-images/cargo-premium.jpg" alt="Cargo Pants Premium Equine" />
      <div class="home-hero-copy page-container">
        <p>Equine workwear</p>
        <h1>Celana kerja. Dipakai harian.</h1>
        <NuxtLink to="/products" class="hero-link">Belanja sekarang <ArrowRight :size="15" :stroke-width="1.6" /></NuxtLink>
      </div>
    </section>

    <section class="home-categories page-container" aria-label="Kategori produk">
      <NuxtLink v-for="tile in categoryTiles" :key="tile.label" :to="tile.to" class="category-tile">
        <img :src="tile.image" :alt="`${tile.label} Equine`" loading="lazy" />
        <span>{{ tile.label }}</span>
      </NuxtLink>
    </section>

    <section class="home-products page-container">
      <div class="home-section-title">
        <p>New in</p>
        <NuxtLink to="/products">Lihat semua</NuxtLink>
      </div>
      <div class="product-grid product-grid-home"><ProductCard v-for="product in featured" :key="product.slug" :product="product" /></div>
    </section>

    <section id="about" class="home-note page-container">
      <div>
        <p>About Equine</p>
        <h2>Potongan jelas. Kantong cukup. Warna mudah dipakai.</h2>
      </div>
      <NuxtLink to="/products" class="text-link">Masuk katalog</NuxtLink>
    </section>
  </div>
</template>
