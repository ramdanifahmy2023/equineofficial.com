import { eq, sql } from 'drizzle-orm'
import { auditEvents, financialLedger, orderItems, orders } from '../../../db/schema'
import { useDatabase } from '../../../db/client'
import { requireStaff } from '../../../utils/auth'

const transitions: Record<string, string[]> = { pending: ['cancelled'], paid: ['processing', 'cancelled'], processing: ['shipped'], shipped: ['completed'], completed: [], cancelled: [] }
export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const orderNumber = getRouterParam(event, 'orderNumber') || ''
  const body = await readBody<{ status?: string; trackingNumber?: string; internalNote?: string; reason?: string }>(event)
  return useDatabase().transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.orderNumber, orderNumber)).for('update')
    if (!order) throw createError({ statusCode: 404, statusMessage: 'Pesanan tidak ditemukan' })
    if (body.status !== order.status && !transitions[order.status]?.includes(body.status || '')) throw createError({ statusCode: 409, statusMessage: 'Transisi status tidak valid' })
    if (body.status === 'processing' && order.claimedBy !== user.id) throw createError({ statusCode: 403, statusMessage: 'Klaim pesanan sebelum memproses' })
    if (body.status === 'shipped' && (!order.packingCompletedAt || !body.trackingNumber?.trim())) throw createError({ statusCode: 409, statusMessage: 'Checklist packing dan resi wajib lengkap' })
    const [updated] = await tx.update(orders).set({ status: body.status || order.status, trackingNumber: body.trackingNumber?.trim() || order.trackingNumber, internalNote: body.internalNote?.trim() || order.internalNote, updatedAt: new Date() }).where(eq(orders.id, order.id)).returning()
    await tx.insert(auditEvents).values({ actorId: user.id, entityType: 'order', entityId: orderNumber, action: 'status_updated', reason: body.reason, before: { status: order.status }, after: { status: updated.status } })
    if (updated.status === 'completed' && order.status !== 'completed') {
      const [cost] = await tx.select({ amount: sql<number>`coalesce(sum(${orderItems.unitCost} * ${orderItems.quantity}), 0)` }).from(orderItems).where(eq(orderItems.orderId, order.id))
      await tx.insert(financialLedger).values([
        { orderId: order.id, category: 'product_revenue', amount: order.subtotal - order.discount, recognizedAt: updated.updatedAt },
        { orderId: order.id, category: 'delivery_revenue', amount: order.shippingCost, recognizedAt: updated.updatedAt },
        { orderId: order.id, category: 'cogs', amount: -Number(cost.amount), recognizedAt: updated.updatedAt },
      ]).onConflictDoNothing()
    }
    return { orderNumber, status: updated.status, actor: user.email }
  })
})
