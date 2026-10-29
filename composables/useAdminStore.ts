import { adminOrders, adminProducts, type AdminOrder, type AdminProduct, type AdminVariant } from '~/data/admin'
import type { PreviewOrder } from '~/types/preview'

const productsKey = 'equine-admin-products-v1'
const ordersKey = 'equine-admin-orders-v1'
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const isBrowserMedia = (src: string) => src.startsWith('data:') || src.startsWith('blob:')
const statusFromPreview = (state: PreviewOrder['state']): AdminOrder['status'] => ({ pending: 'Menunggu pembayaran', success: 'Dibayar', failed: 'Gagal', expired: 'Kedaluwarsa' } satisfies Record<PreviewOrder['state'], AdminOrder['status']>)[state]
const paymentStatusFromPreview = (state: PreviewOrder['state']): NonNullable<AdminOrder['paymentStatus']> => ({ pending: 'Menunggu', success: 'Berhasil', failed: 'Gagal', expired: 'Kedaluwarsa' } satisfies Record<PreviewOrder['state'], NonNullable<AdminOrder['paymentStatus']>>)[state]
const paymentLabel = (method: string) => method === 'bri_va' ? 'BRI VA' : method === 'bni_va' ? 'BNI VA' : 'QRIS'

export const useAdminStore = () => {
  const products = useState<AdminProduct[]>('admin-products', () => clone(adminProducts))
  const orders = useState<AdminOrder[]>('admin-orders', () => clone(adminOrders))
  const hydrated = useState('admin-store-hydrated', () => false)
  const serverLoaded = ref(false)
  const preview = usePreviewOrders()

  const persist = () => {
    try {
      localStorage.setItem(productsKey, JSON.stringify(products.value.map((product) => {
        const media = product.media.filter((item) => item.persisted && !isBrowserMedia(item.src))
        const seedImage = adminProducts.find((item) => item.slug === product.slug)?.image
        return { ...product, media, image: media.find((item) => item.type === 'image')?.src || seedImage || '/product-images/cargo-premium.jpg' }
      })))
      localStorage.setItem(ordersKey, JSON.stringify(orders.value))
    } catch { return false }
    return true
  }

  const syncPreviewOrder = (source: (typeof preview.orders.value)[number]) => {
    const order = JSON.parse(JSON.stringify(source)) as PreviewOrder
    const existing = orders.value.find((item) => item.id === order.id)
    const fulfillmentStarted = existing && ['Diproses', 'Dikirim', 'Selesai', 'Dibatalkan'].includes(existing.status)
    const mapped: AdminOrder = {
      id: order.id,
      customer: order.contact.name,
      item: `${order.items[0]?.name || 'Pesanan'}${order.items.length > 1 ? ` +${order.items.length - 1}` : ''}`,
      total: order.total,
      status: fulfillmentStarted ? existing.status : statusFromPreview(order.state),
      payment: paymentLabel(order.paymentMethod),
      paymentStatus: paymentStatusFromPreview(order.state),
      createdAt: new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(order.createdAt)),
      source: 'preview',
      items: clone(order.items),
      contact: clone(order.contact),
      shipping: clone(order.shipping),
      paymentMethod: order.paymentMethod,
      state: order.state,
      timeline: [{ label: 'Order dibuat', at: order.createdAt, status: statusFromPreview(order.state) }],
    }
    const index = orders.value.findIndex((item) => item.id === order.id)
    if (index === -1) orders.value.unshift(mapped)
    else orders.value[index] = { ...orders.value[index], ...mapped, timeline: orders.value[index].timeline || mapped.timeline }
    const syncedOrder = orders.value.find((item) => item.id === order.id)
    if (syncedOrder?.state === 'success' && !syncedOrder.inventoryApplied) {
      syncedOrder.items?.forEach((item) => {
        const product = products.value.find((candidate) => candidate.slug === item.slug)
        const variant = product?.variants.find((candidate) => candidate.sku === item.sku) || product?.variants.find((candidate) => candidate.color === item.color && candidate.size === item.size)
        if (!product || !variant) return
        variant.stock = Math.max(0, variant.stock - item.quantity)
        product.stock = product.variants.reduce((total, candidate) => total + candidate.stock, 0)
      })
      syncedOrder.inventoryApplied = true
    }
    persist()
  }

  const syncPreviewOrders = () => preview.orders.value.forEach(syncPreviewOrder)

  onMounted(async () => {
    if (hydrated.value) return
    try {
      const [serverProducts, serverOrders] = await Promise.all([
        $fetch<AdminProduct[]>('/api/admin/products'),
        $fetch<AdminOrder[]>('/api/admin/orders'),
      ])
      if (serverProducts.length) products.value = serverProducts
      orders.value = serverOrders
      serverLoaded.value = true
    } catch {}
    try {
      const storedProducts = JSON.parse(localStorage.getItem(productsKey) || 'null')
      const storedOrders = JSON.parse(localStorage.getItem(ordersKey) || 'null')
      if (!serverLoaded.value && Array.isArray(storedProducts)) products.value = storedProducts.map((stored: Partial<AdminProduct>) => {
        const seed = adminProducts.find((product) => product.slug === stored?.slug)
        if (!seed) return stored as AdminProduct
        const variants: AdminVariant[] = Array.isArray(stored.variants) ? stored.variants : clone(seed.variants)
        return { ...seed, ...stored, variants, media: Array.isArray(stored.media) ? stored.media : clone(seed.media), stock: variants.reduce((total: number, variant: AdminVariant) => total + Math.max(0, Number(variant.stock) || 0), 0) }
      })
      if (!serverLoaded.value && Array.isArray(storedOrders)) orders.value = storedOrders
    } catch {}
    syncPreviewOrders()
    hydrated.value = true
  })

  watch(preview.orders, syncPreviewOrders, { deep: true })
  watch([products, orders], persist, { deep: true })

  const adjustStock = async (product: AdminProduct, amount: number) => {
    const variant = amount > 0 ? product.variants[0] : product.variants.find((item) => item.stock > 0)
    if (!variant) return
    if (serverLoaded.value) {
      try { await $fetch(`/api/admin/inventory/${variant.id}`, { method: 'POST', body: { amount, reason: 'Admin adjustment' } }) } catch { return }
    }
    variant.stock = Math.max(0, variant.stock + amount)
    product.stock = product.variants.reduce((total, item) => total + item.stock, 0)
  }
  const toggleProductStatus = async (product: AdminProduct) => {
    const active = !product.active
    if (serverLoaded.value && product.id) {
      try { await $fetch(`/api/admin/products/${product.id}/status`, { method: 'PATCH', body: { active } }) } catch { return false }
    }
    product.active = active
    return true
  }
  const updateOrderOperations = async (order: AdminOrder, details: Pick<AdminOrder, 'status' | 'trackingNumber' | 'internalNote'>) => {
    const statusChanged = order.status !== details.status
    if (serverLoaded.value) {
      const status = ({ 'Menunggu pembayaran': 'pending', Dibayar: 'paid', Diproses: 'processing', Dikirim: 'shipped', Selesai: 'completed', Dibatalkan: 'cancelled' } as Record<string, string>)[details.status]
      try { await $fetch(`/api/admin/orders/${order.id}`, { method: 'PATCH', body: { ...details, status } }) } catch { return false }
    }
    Object.assign(order, details)
    if (statusChanged) order.timeline = [...(order.timeline || []), { label: details.status, at: new Date().toISOString(), status: details.status }]
    persist()
  }

  return { products, orders, syncPreviewOrder, syncPreviewOrders, adjustStock, toggleProductStatus, updateOrderOperations }
}
