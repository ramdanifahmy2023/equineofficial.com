import { and, eq, isNull, lt, sql } from 'drizzle-orm'
import { inventoryMovements, orderItems, orders, payments, productVariants, vouchers } from '../../db/schema'
import { useDatabase } from '../../db/client'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.schedulerSecret || getHeader(event, 'authorization') !== `Bearer ${config.schedulerSecret}`) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const db = useDatabase()
  const candidates = await db.select({ paymentId: payments.id, orderId: orders.id }).from(payments).innerJoin(orders, eq(payments.orderId, orders.id)).where(and(eq(payments.status, 'pending'), eq(orders.status, 'pending'), isNull(orders.cancelledAt), lt(payments.expiresAt, new Date())))
  let processed = 0
  for (const candidate of candidates) await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, candidate.orderId)).for('update')
    if (!order || order.status !== 'pending' || order.cancelledAt) return
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id))
    for (const item of items) {
      await tx.update(productVariants).set({ stock: sql`${productVariants.stock} + ${item.quantity}` }).where(eq(productVariants.id, item.variantId))
      await tx.insert(inventoryMovements).values({ variantId: item.variantId, orderId: order.id, quantity: item.quantity, reason: 'payment_expired' })
    }
    if (order.voucherCode) await tx.update(vouchers).set({ used: sql`greatest(0, ${vouchers.used} - 1)` }).where(eq(vouchers.code, order.voucherCode))
    await tx.update(payments).set({ status: 'expired', updatedAt: new Date() }).where(eq(payments.id, candidate.paymentId))
    await tx.update(orders).set({ status: 'expired', cancelledAt: new Date(), updatedAt: new Date() }).where(eq(orders.id, order.id))
    processed++
  })
  return { processed }
})
