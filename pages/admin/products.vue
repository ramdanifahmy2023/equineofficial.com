<script setup lang="ts">
import { Check, ImagePlus, Plus, Search, Trash2, Video, X } from '@lucide/vue'
import type { AdminMedia, AdminProduct, AdminVariant } from '~/data/admin'

type VariantForm = Omit<AdminVariant, 'price' | 'stock'> & { price: string; stock: string }

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { products: rows, adjustStock, toggleProductStatus } = useAdminStore()
const { data: session } = await useFetch<any>('/api/admin/auth/session')
const isSuperAdmin = computed(() => session.value?.user?.role === 'super_admin')
const query = ref('')
const category = ref('Semua')
const availability = ref('Semua')
const modalOpen = ref(false)
const editingProduct = ref<AdminProduct | null>(null)
const mediaInput = ref<HTMLInputElement | null>(null)
const mediaError = ref('')
const categories = ['Semua', 'Cargo', 'Carpenter', 'Cargo Loreng']
const emptyForm = () => ({ name: '', category: 'Cargo', description: '', material: '', fit: '', active: true, variants: [{ id: crypto.randomUUID(), color: 'Hitam', size: '30', sku: '', price: '', stock: '0' }] as VariantForm[], media: [] as AdminMedia[] })
const form = ref(emptyForm())
const formatPrice = (price: number) => new Intl.NumberFormat('id-ID').format(price)
const filteredRows = computed(() => rows.value.filter((product) => (category.value === 'Semua' || product.category === category.value) && (availability.value === 'Semua' || (availability.value === 'Aktif' ? product.active : !product.active)) && `${product.name} ${product.sku}`.toLowerCase().includes(query.value.toLowerCase())))
const clearFilters = () => { query.value = ''; category.value = 'Semua'; availability.value = 'Semua' }
const totalFormStock = computed(() => form.value.variants.reduce((total: number, variant: VariantForm) => total + Math.max(0, Number(variant.stock) || 0), 0))

const toggleActive = (product: AdminProduct) => toggleProductStatus(product)
const productMedia = (product: AdminProduct) => product.media.find((item) => item.type === 'image')?.src || product.image
const resetForm = () => { form.value = emptyForm(); mediaError.value = '' }
const openCreate = () => { editingProduct.value = null; resetForm(); modalOpen.value = true }
const draftCopyCount = (product: AdminProduct) => rows.value.filter((item) => item.slug.startsWith(`${product.slug}-copy-`)).length + 1
const duplicateProduct = (product: AdminProduct) => {
  const copyNumber = draftCopyCount(product)
  const variants = product.variants.map((variant: AdminVariant) => ({ ...variant, id: crypto.randomUUID(), sku: `${variant.sku}-COPY${copyNumber}` }))
  const media = product.media.filter((item: AdminMedia) => item.persisted).map((item: AdminMedia) => ({ ...item, id: crypto.randomUUID() }))
  rows.value.unshift({ ...product, slug: `${product.slug}-copy-${Date.now()}`, name: `${product.name} copy`, sku: `${product.sku}-COPY${copyNumber}`, active: false, variants, media: media.length ? media : product.media, stock: variants.reduce((total, variant) => total + variant.stock, 0), price: Math.min(...variants.map((variant) => variant.price)) })
}
const deleteProduct = (product: AdminProduct) => {
  if (product.active) { mediaError.value = 'Produk aktif harus dijadikan Draft sebelum dihapus.'; return }
  if (confirm(`Hapus draft ${product.name}?`)) rows.value = rows.value.filter((item) => item.slug !== product.slug)
}
const openEdit = (product: AdminProduct) => {
  editingProduct.value = product
  form.value = {
    name: product.name,
    category: product.category,
    description: product.description,
    material: product.material,
    fit: product.fit,
    active: product.active,
    variants: product.variants.map((variant: AdminVariant) => ({ ...variant, price: String(variant.price), stock: String(variant.stock) })),
    media: product.media.map((item: AdminMedia) => ({ ...item })),
  }
  mediaError.value = ''
  modalOpen.value = true
}
const addVariant = () => form.value.variants.push({ id: crypto.randomUUID(), color: '', size: '', sku: '', price: String(form.value.variants[0]?.price || ''), stock: '0' })
const removeVariant = (id: string) => { if (form.value.variants.length > 1) form.value.variants = form.value.variants.filter((variant: VariantForm) => variant.id !== id) }
const addMedia = (event: Event) => {
  const files = Array.from((event.target as HTMLInputElement).files || [])
  mediaError.value = ''
  if (form.value.media.length + files.length > 6) { mediaError.value = 'Maksimal enam media per produk untuk preview.'; return }
  for (const file of files) {
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    const sizeLimit = isVideo ? 25 * 1024 * 1024 : 10 * 1024 * 1024
    if ((!isImage && !isVideo) || file.size > sizeLimit) { mediaError.value = 'Gunakan gambar maksimum 10 MB atau video maksimum 25 MB.'; continue }
    const reader = new FileReader()
    reader.onload = () => form.value.media.push({ id: crypto.randomUUID(), type: isVideo ? 'video' : 'image', name: file.name, src: String(reader.result), persisted: false })
    reader.readAsDataURL(file)
  }
  ;(event.target as HTMLInputElement).value = ''
}
const removeMedia = (id: string) => { form.value.media = form.value.media.filter((item: AdminMedia) => item.id !== id) }
const saveProduct = async () => {
  const validVariants = form.value.variants.filter((variant: VariantForm) => variant.color && variant.size && variant.sku && Number(variant.price) >= 0 && Number(variant.stock) >= 0)
  if (!form.value.name || !validVariants.length) { mediaError.value = 'Isi nama produk dan setidaknya satu varian lengkap.'; return }
  const variants: AdminVariant[] = validVariants.map((variant: VariantForm) => ({ id: variant.id, color: variant.color, size: variant.size, sku: variant.sku, price: Number(variant.price), stock: Number(variant.stock) }))
  const media = form.value.media.length ? form.value.media : [{ id: crypto.randomUUID(), type: 'image' as const, name: 'Foto utama', src: '/product-images/cargo-premium.jpg', persisted: true }]
  const product = { name: form.value.name, category: form.value.category, description: form.value.description, material: form.value.material, fit: form.value.fit, active: form.value.active, variants, media, stock: variants.reduce((total: number, variant: AdminVariant) => total + variant.stock, 0), price: Math.min(...variants.map((variant: AdminVariant) => variant.price)), image: media.find((item: AdminMedia) => item.type === 'image')?.src || '/product-images/cargo-premium.jpg' }
  try {
    if (editingProduct.value?.id) await $fetch(`/api/admin/products/${editingProduct.value.id}`, { method: 'PATCH', body: product })
    else await $fetch('/api/admin/products', { method: 'POST', body: product })
    if (editingProduct.value) Object.assign(editingProduct.value, product)
    else rows.value.unshift({ ...product, slug: `draft-${Date.now()}`, sku: `DRAFT-${String(rows.value.length + 1).padStart(3, '0')}` })
    modalOpen.value = false
  } catch (error: any) { mediaError.value = error?.data?.statusMessage || 'Produk gagal disimpan.' }
}
</script>

<template>
  <div class="admin-page">
    <div class="admin-page-heading"><div><p class="eyebrow">Catalog</p><h1>Produk.</h1></div><button class="button button-dark admin-primary-action" @click="openCreate"><Plus :size="16" :stroke-width="1.7" />Tambah produk</button></div>
    <div class="admin-toolbar"><label class="admin-search"><Search :size="17" :stroke-width="1.5" /><input v-model="query" type="search" placeholder="Cari nama atau SKU" aria-label="Cari produk admin" /></label><select v-model="category" aria-label="Filter kategori"><option v-for="item in categories" :key="item">{{ item }}</option></select><select v-model="availability" aria-label="Filter status produk"><option>Semua</option><option>Aktif</option><option>Draft</option></select><button v-if="query || category !== 'Semua' || availability !== 'Semua'" class="admin-clear-filter" @click="clearFilters">Reset</button><span>{{ filteredRows.length }} produk</span></div>
    <p v-if="mediaError && !modalOpen" class="checkout-error" role="alert">{{ mediaError }}</p>
    <section class="admin-panel"><div class="admin-table-wrap"><table class="admin-table admin-product-table"><thead><tr><th>Produk</th><th>SKU</th><th>Harga mulai</th><th>Stok</th><th>Status</th><th>Aksi</th></tr></thead><tbody><tr v-for="product in filteredRows" :key="product.slug"><td><div class="admin-product-cell"><img :src="productMedia(product)" :alt="product.name" /><span><strong>{{ product.name }}</strong><small>{{ product.category }} · {{ product.variants.length }} varian · {{ product.media.length }} media</small></span></div></td><td>{{ product.sku }}</td><td>Rp {{ formatPrice(product.price) }}</td><td><div class="stock-control"><button aria-label="Kurangi stok" @click="adjustStock(product, -1)">-</button><strong>{{ product.stock }}</strong><button aria-label="Tambah stok" @click="adjustStock(product, 1)">+</button></div></td><td><button class="status-toggle" :class="{ 'is-active': product.active }" :aria-pressed="product.active" @click="toggleActive(product)"><Check v-if="product.active" :size="14" :stroke-width="1.8" />{{ product.active ? 'Aktif' : 'Draft' }}</button></td><td><div class="admin-action-stack"><button class="admin-row-action" @click="openEdit(product)">Edit</button><button class="admin-row-action" @click="duplicateProduct(product)">Duplikat</button><button class="admin-row-action is-danger" :disabled="product.active" @click="deleteProduct(product)">Hapus</button></div></td></tr><tr v-if="!filteredRows.length"><td colspan="6" class="admin-empty-cell">Produk tidak ditemukan. <button class="admin-inline-action" @click="clearFilters">Reset filter</button></td></tr></tbody></table></div></section>
    <AppOverlay :open="modalOpen" label="Form produk" @close="modalOpen = false">
      <div class="admin-modal-backdrop" @click="modalOpen = false"><section class="admin-modal admin-product-modal" aria-labelledby="product-form-title" @click.stop><div class="admin-modal-heading"><h2 id="product-form-title">{{ editingProduct ? 'Edit produk' : 'Tambah produk' }}</h2><button class="icon-button" aria-label="Tutup form produk" @click="modalOpen = false"><X :size="19" :stroke-width="1.6" /></button></div><form class="admin-form" @submit.prevent="saveProduct"><div class="admin-form-grid"><label>Nama produk<input v-model="form.name" required type="text" placeholder="Nama produk" /></label><label>Kategori<select v-model="form.category"><option v-for="item in categories.slice(1)" :key="item">{{ item }}</option></select></label></div><label>Deskripsi<textarea v-model="form.description" rows="3" placeholder="Deskripsi singkat produk" /></label><div class="admin-form-grid"><label>Bahan<input v-model="form.material" type="text" placeholder="Katun ripstop" /></label><label>Fit<input v-model="form.fit" type="text" placeholder="Reguler" /></label></div><fieldset class="admin-variant-editor"><legend>Varian & stok <small>{{ totalFormStock }} unit</small></legend><div v-for="variant in form.variants" :key="variant.id" class="admin-variant-row"><input v-model="variant.color" required type="text" placeholder="Warna" /><input v-model="variant.size" required type="text" placeholder="Ukuran" /><input v-model="variant.sku" required type="text" placeholder="SKU" /><input v-model="variant.price" required min="0" type="number" placeholder="Harga" /><input v-model="variant.stock" required min="0" type="number" placeholder="Stok" /><button type="button" :disabled="form.variants.length === 1" aria-label="Hapus varian" @click="removeVariant(variant.id)"><Trash2 :size="15" :stroke-width="1.6" /></button></div><button type="button" class="admin-add-row" @click="addVariant"><Plus :size="15" :stroke-width="1.6" />Tambah varian</button></fieldset><fieldset class="admin-media-editor"><legend>Media produk <small>Gambar 10 MB · video 25 MB · preview browser</small></legend><input ref="mediaInput" class="sr-only" type="file" accept="image/*,video/*" multiple @change="addMedia" /><button type="button" class="admin-media-upload" @click="mediaInput?.click()"><ImagePlus :size="17" :stroke-width="1.6" />Tambah gambar / <Video :size="17" :stroke-width="1.6" />video</button><div v-if="form.media.length" class="admin-media-grid"><div v-for="item in form.media" :key="item.id" class="admin-media-card"><img v-if="item.type === 'image'" :src="item.src" :alt="item.name" /><video v-else :src="item.src" muted preload="metadata" /><span>{{ item.type === 'video' ? 'Video' : 'Gambar' }} · {{ item.name }}</span><button type="button" :aria-label="`Hapus ${item.name}`" @click="removeMedia(item.id)"><Trash2 :size="14" :stroke-width="1.6" /></button></div></div><p class="admin-media-note">Upload ini hanya preview frontend. File baru hilang setelah refresh sampai backend media tersedia.</p></fieldset><label class="admin-publish-toggle"><input v-model="form.active" type="checkbox" />Tampilkan produk di katalog preview</label><p v-if="mediaError" class="checkout-error" role="alert">{{ mediaError }}</p><button class="button button-clay button-wide" type="submit">{{ editingProduct ? 'Simpan perubahan' : 'Simpan produk' }}</button></form></section></div>
    </AppOverlay>
  </div>
</template>
