import type { PaymentState, PreviewOrder } from '~/types/preview'
import { onMounted, readonly } from 'vue'

const storageKey = 'equine-preview-orders-v1'

export const usePreviewOrders = () => {
  const orders = useState<PreviewOrder[]>('preview-orders', () => [])
  const ready = useState('preview-orders-ready', () => false)
  const storageError = useState('preview-orders-error', () => '')

  onMounted(() => {
    if (ready.value) return
    try {
      const stored = JSON.parse(sessionStorage.getItem(storageKey) || '[]')
      if (!Array.isArray(stored) || !stored.every((order) =>
        typeof order?.id === 'string' && Array.isArray(order.items) && order.contact &&
        typeof order.shipping?.price === 'number' && Number.isFinite(order.total) &&
        Number.isFinite(order.subtotal) && ['pending', 'success', 'failed', 'expired'].includes(order.state)
      )) throw new Error('Invalid preview orders')
      orders.value = stored
    } catch {
      storageError.value = 'Pesanan simulasi tidak dapat dimuat. Buat ulang dari checkout atau coba tab baru.'
    } finally {
      ready.value = true
    }
  })

  const persist = (next: PreviewOrder[]) => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(next))
      orders.value = next
      storageError.value = ''
      return true
    } catch {
      storageError.value = 'Penyimpanan browser tidak tersedia. Aktifkan penyimpanan lalu coba lagi.'
      return false
    }
  }

  const createOrder = (draft: Pick<PreviewOrder, 'items' | 'contact' | 'shipping' | 'paymentMethod'>) => {
    const snapshot = JSON.parse(JSON.stringify(draft)) as typeof draft
    const subtotal = snapshot.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const order: PreviewOrder = {
      ...snapshot, id: `EQ-${crypto.randomUUID()}`, createdAt: new Date().toISOString(),
      subtotal, total: subtotal + snapshot.shipping.price, state: 'pending',
    }
    return persist([...orders.value, order]) ? order : null
  }

  const setStatus = (id: string, state: PaymentState) => {
    if (!orders.value.some((order) => order.id === id)) return false
    return persist(orders.value.map((order) => order.id === id ? { ...order, state } : order))
  }

  return { orders: readonly(orders), ready: readonly(ready), storageError: readonly(storageError), createOrder, setStatus }
}
