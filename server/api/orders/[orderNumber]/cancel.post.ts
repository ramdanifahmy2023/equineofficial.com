import { and, eq, sql } from 'drizzle-orm'
import { inventoryMovements, orderItems, orders, productVariants, vouchers } from '../../../db/schema'
import { useDatabase } from '../../../db/client'
import { requireCustomer } from '../../../utils/customer-auth'

export default defineEventHandler(async (event) => {
  const customer = await requireCustomer(event)
  const orderNumber = getRouterParam(event, 'orderNumber') || ''
  return useDatabase().transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(and(eq(orders.orderNumber, orderNumber), eq(orders.customerId, customer.id))).for('update')
    if (!order) throw createError({ statusCode: 404, statusMessage: 'Pesanan tidak ditemukan' })
    if (order.status === 'cancelled') return { cancelled: true, duplicate: true }
    if (order.status !== 'pending') throw createError({ statusCode: 409, statusMessage: 'Pesanan berbayar atau diproses memerlukan bantuan admin' })
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id))
    for (const item of items) {
      await tx.update(productVariants).set({ stock: sql`${productVariants.stock} + ${item.quantity}` }).where(eq(productVariants.id, item.variantId))
      await tx.insert(inventoryMovements).values({ variantId: item.variantId, orderId: order.id, quantity: item.quantity, reason: 'order_cancelled' })
    }
    if (order.voucherCode) await tx.update(vouchers).set({ used: sql`greatest(0, ${vouchers.used} - 1)` }).where(eq(vouchers.code, order.voucherCode))
    await tx.update(orders).set({ status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() }).where(eq(orders.id, order.id))
    return { cancelled: true, duplicate: false }
  })
})
