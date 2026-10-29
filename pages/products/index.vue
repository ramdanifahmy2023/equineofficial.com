<script setup lang="ts">
import { Search, SlidersHorizontal, ArrowDownUp, ChevronDown, X } from '@lucide/vue'
import { products, categories } from '~/data/products'

const route = useRoute()
const filterOpen = ref(false)
const sortOpen = ref(false)
const selectedCategory = ref(String(route.query.category || 'Semua'))
const selectedType = ref('Semua')
const selectedAvailability = ref('Semua')
const selectedPrice = ref('Semua')
const selectedSort = ref('Pilihan')
const query = ref(String(route.query.q || ''))

const sortOptions = ['Pilihan', 'Harga terendah', 'Harga tertinggi', 'Nama A-Z']
const priceOptions = [
  { label: 'Di bawah Rp200.000', value: 'under-200' },
  { label: 'Rp200.000 - Rp275.000', value: '200-275' },
  { label: 'Rp275.000 - Rp350.000', value: '275-350' },
  { label: 'Rp350.000+', value: 'over-350' },
]

watch(() => `${route.query.category || ''}|${route.query.q || ''}`, () => {
  const nextCategory = String(route.query.category || 'Semua')
  selectedCategory.value = categories.some((item) => item.value === nextCategory) ? nextCategory : 'Semua'
  query.value = String(route.query.q || '')
})

const filteredProducts = computed(() => {
  let list = products.filter((product) => selectedCategory.value === 'Semua' || product.category === selectedCategory.value)
  if (selectedType.value === 'Diskon') list = list.filter((product) => product.discount)
  if (selectedType.value === 'Pilihan Equine') list = list.slice(0, 4)
  if (selectedAvailability.value === 'Tersedia') list = list.filter((product) => !product.soldOut)
  if (selectedPrice.value !== 'Semua') {
    list = list.filter((product) => {
      if (selectedPrice.value === 'under-200') return product.price < 200000
      if (selectedPrice.value === '200-275') return product.price >= 200000 && product.price < 275000
      if (selectedPrice.value === '275-350') return product.price >= 275000 && product.price < 350000
      return product.price >= 350000
    })
  }
  if (query.value) list = list.filter((product) => `${product.name} ${product.category} ${product.material}`.toLowerCase().includes(query.value.toLowerCase()))
  if (selectedSort.value === 'Harga terendah') list = [...list].sort((a, b) => a.price - b.price)
  if (selectedSort.value === 'Harga tertinggi') list = [...list].sort((a, b) => b.price - a.price)
  if (selectedSort.value === 'Nama A-Z') list = [...list].sort((a, b) => a.name.localeCompare(b.name))
  return list
})

const clearFilters = () => {
  selectedCategory.value = 'Semua'
  selectedType.value = 'Semua'
  selectedAvailability.value = 'Semua'
  selectedPrice.value = 'Semua'
  query.value = ''
}

const hasFilters = computed(() => selectedCategory.value !== 'Semua' || selectedType.value !== 'Semua' || selectedAvailability.value !== 'Semua' || selectedPrice.value !== 'Semua' || Boolean(query.value))
</script>

<template>
  <div class="catalog-page category-page page-container">
    <section class="catalog-heading"><h1>Mens.</h1></section>

    <div class="mobile-catalog-actions">
      <button class="catalog-action-button" :aria-expanded="filterOpen" @click="filterOpen = !filterOpen"><SlidersHorizontal :size="17" :stroke-width="1.5" />Filter</button>
      <button class="catalog-action-button" :aria-expanded="sortOpen" @click="sortOpen = !sortOpen"><ArrowDownUp :size="17" :stroke-width="1.5" />Sort</button>
    </div>

    <div class="catalog-layout">
      <aside class="filter-sidebar" :class="{ 'is-open': filterOpen }" aria-label="Filter katalog">
        <div class="filter-search"><Search :size="19" :stroke-width="1.5" /><input v-model="query" type="search" placeholder="Search" aria-label="Search produk" /></div>
        <div class="filter-group"><div class="filter-group-title"><span>Categories</span><ChevronDown :size="17" :stroke-width="1.5" /></div><label v-for="category in categories.slice(1)" :key="category.value" class="filter-option"><input v-model="selectedCategory" type="radio" name="category" :value="category.value" /><span>{{ category.name }}</span></label></div>
        <div class="filter-group"><div class="filter-group-title"><span>Product Type</span><ChevronDown :size="17" :stroke-width="1.5" /></div><label class="filter-option"><input v-model="selectedType" type="radio" name="type" value="Semua" /><span>Semua produk</span></label><label class="filter-option"><input v-model="selectedType" type="radio" name="type" value="Pilihan Equine" /><span>Pilihan Equine</span></label><label class="filter-option"><input v-model="selectedType" type="radio" name="type" value="Diskon" /><span>Discount</span></label></div>
        <div class="filter-group"><div class="filter-group-title"><span>Availability</span><ChevronDown :size="17" :stroke-width="1.5" /></div><label class="filter-option"><input v-model="selectedAvailability" type="radio" name="availability" value="Semua" /><span>All</span></label><label class="filter-option"><input v-model="selectedAvailability" type="radio" name="availability" value="Tersedia" /><span>In Stock</span></label></div>
        <div class="filter-group"><div class="filter-group-title"><span>Price</span><ChevronDown :size="17" :stroke-width="1.5" /></div><label v-for="option in priceOptions" :key="option.value" class="filter-option"><input v-model="selectedPrice" type="radio" name="price" :value="option.value" /><span>{{ option.label }}</span></label></div>
        <button v-if="hasFilters" class="reset-filter" @click="clearFilters"><X :size="15" :stroke-width="1.5" />Reset filters</button>
      </aside>

      <section class="catalog-content">
        <div class="catalog-topbar">
          <p>{{ filteredProducts.length }} produk</p>
          <div class="sort-control" :class="{ 'is-open': sortOpen }"><span>sort :</span><select v-model="selectedSort" aria-label="Urutkan produk"><option v-for="option in sortOptions" :key="option">{{ option }}</option></select></div>
        </div>
        <div v-if="filteredProducts.length" class="product-grid catalog-grid"><ProductCard v-for="product in filteredProducts" :key="product.slug" :product="product" /></div>
        <div v-else class="catalog-empty"><Search :size="26" :stroke-width="1.35" /><h2>Produk tidak ditemukan</h2><p>Coba kata kunci atau filter lain.</p><button class="button button-dark" @click="clearFilters">Tampilkan semua produk</button></div>
      </section>
    </div>
  </div>
</template>
