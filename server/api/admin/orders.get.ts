import { desc, eq } from 'drizzle-orm'
import { auditEvents, orderItems, orders } from '../../db/schema'
import { useDatabase } from '../../db/client'
import { requireStaff } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireStaff(event)
  const db = useDatabase()
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt))
  const labels: Record<string, string> = { pending: 'Menunggu pembayaran', paid: 'Dibayar', processing: 'Diproses', shipped: 'Dikirim', completed: 'Selesai', failed: 'Gagal', expired: 'Kedaluwarsa', cancelled: 'Dibatalkan', cod_pending_confirmation: 'Menunggu konfirmasi COD', cod_confirmed: 'COD dikonfirmasi' }
  return Promise.all(rows.map(async (order) => {
    const items = await db.select({ name: orderItems.productName, color: orderItems.color, size: orderItems.size, quantity: orderItems.quantity, price: orderItems.unitPrice }).from(orderItems).where(eq(orderItems.orderId, order.id))
    const events = await db.select({ action: auditEvents.action, createdAt: auditEvents.createdAt }).from(auditEvents).where(eq(auditEvents.entityId, order.orderNumber)).orderBy(auditEvents.createdAt)
    return { id: order.orderNumber, customer: order.customerName, item: `${items[0]?.name || order.orderNumber}${items.length > 1 ? ` +${items.length - 1}` : ''}`, total: order.total, status: labels[order.status] || order.status, payment: order.paymentMethod === 'cod' ? 'COD' : 'Online', paymentStatus: order.status === 'paid' || ['processing', 'shipped', 'completed'].includes(order.status) ? 'Berhasil' : 'Menunggu', createdAt: new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(order.createdAt), trackingNumber: order.trackingNumber || undefined, internalNote: order.internalNote || undefined, contact: { name: order.customerName, email: order.customerEmail, phone: order.customerPhone, address: order.address, destination: order.destination, postalCode: order.postalCode }, shipping: order.shippingSnapshot, items, timeline: events.map((entry) => ({ label: entry.action, at: entry.createdAt.toISOString(), status: labels[order.status] || order.status })) }
  }))
})
