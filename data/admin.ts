import { products } from '~/data/products'
import type { CartItem, PaymentState, PreviewOrder } from '~/types/preview'

export type AdminVariant = {
  id: string
  color: string
  size: string
  sku: string
  price: number
  stock: number
}

export type AdminMedia = {
  id: string
  type: 'image' | 'video'
  name: string
  src: string
  persisted: boolean
}

export type AdminProduct = {
  id?: string
  slug: string
  name: string
  category: string
  price: number
  image: string
  sku: string
  stock: number
  active: boolean
  description: string
  material: string
  fit: string
  variants: AdminVariant[]
  media: AdminMedia[]
}

export type AdminOrder = {
  id: string
  customer: string
  item: string
  total: number
  status: 'Menunggu pembayaran' | 'Dibayar' | 'Diproses' | 'Dikirim' | 'Gagal' | 'Kedaluwarsa' | 'Selesai' | 'Dibatalkan'
  payment: string
  paymentStatus?: 'Menunggu' | 'Berhasil' | 'Gagal' | 'Kedaluwarsa'
  createdAt: string
  source?: 'seed' | 'preview'
  items?: CartItem[]
  contact?: PreviewOrder['contact']
  shipping?: PreviewOrder['shipping']
  paymentMethod?: string
  state?: PaymentState
  timeline?: { label: string; at: string; status: AdminOrder['status'] }[]
  inventoryApplied?: boolean
  trackingNumber?: string
  internalNote?: string
}

const productStocks = [15, 12, 0, 20, 6, 4, 15, 9]

export const adminProducts: AdminProduct[] = products.map((product, productIndex) => {
  const totalStock = productStocks[productIndex] || 0
  const combinations = product.colors.flatMap((color) => product.sizes.map((size) => ({ color, size })))
  const variants = combinations.map((combination, variantIndex) => ({
    id: `${product.slug}-${combination.color}-${combination.size}`.toLowerCase().replaceAll(' ', '-'),
    color: combination.color,
    size: combination.size,
    sku: `EQ-${String(productIndex + 1).padStart(3, '0')}-${combination.color.slice(0, 2).toUpperCase()}-${combination.size}`,
    price: product.price,
    stock: Math.floor(totalStock / combinations.length) + (variantIndex < totalStock % combinations.length ? 1 : 0),
  }))
  return {
    slug: product.slug,
    name: product.name,
    category: product.category,
    price: product.price,
    image: product.image,
    sku: `EQ-${String(productIndex + 1).padStart(3, '0')}`,
    stock: variants.reduce((total, variant) => total + variant.stock, 0),
    active: productIndex !== 2,
    description: product.description,
    material: product.material,
    fit: product.fit,
    variants,
    media: [{ id: `${product.slug}-primary`, type: 'image', name: product.name, src: product.image, persisted: true }],
  }
})

export const adminOrders: AdminOrder[] = [
  { id: 'EQ-84219104', customer: 'Raka Pratama', item: 'Cargo Pants Premium +1', total: 601848, status: 'Diproses', payment: 'QRIS', createdAt: '04 Sep 2026, 10:24' },
  { id: 'EQ-84218872', customer: 'Nadia Putri', item: 'Carpenter Pants King Marsoto', total: 275500, status: 'Dibayar', payment: 'BRI VA', createdAt: '04 Sep 2026, 09:51' },
  { id: 'EQ-84218016', customer: 'Dimas Ardi', item: 'Cargo Army Ripstop', total: 215500, status: 'Menunggu pembayaran', payment: 'QRIS', createdAt: '04 Sep 2026, 08:12' },
  { id: 'EQ-84217423', customer: 'Sinta Amelia', item: 'Carpenter Semi Baggy', total: 275500, status: 'Dikirim', payment: 'BNI VA', createdAt: '03 Sep 2026, 17:45' },
]
