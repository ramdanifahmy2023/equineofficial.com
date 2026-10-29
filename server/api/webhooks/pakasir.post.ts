import { createHash, timingSafeEqual } from 'node:crypto'
import { and, eq, ne, sql } from 'drizzle-orm'
import { inventoryMovements, orderItems, orders, payments, productVariants, vouchers, webhookEvents } from '../../db/schema'
import { useDatabase } from '../../db/client'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const secret = config.pakasirWebhookSecret
  const suppliedSecret = getHeader(event, 'x-pakasir-webhook-secret') || ''
  if (!secret || suppliedSecret.length !== secret.length || !timingSafeEqual(Buffer.from(suppliedSecret), Buffer.from(secret))) {
    throw createError({ statusCode: 401, statusMessage: 'Webhook tidak terautentikasi' })
  }
  const payload = await readBody<any>(event)
  const raw = JSON.stringify(payload || {})
  const eventHash = createHash('sha256').update(raw).digest('hex')
  const db = useDatabase()
  const project = payload?.project || payload?.project_slug
  const providerTransactionId = String(payload?.order_id || '')
  const amount = Number(payload?.amount)
  const status = String(payload?.status || '').toLowerCase()
  if (!config.pakasirProjectSlug || project !== config.pakasirProjectSlug || !providerTransactionId || !Number.isInteger(amount) || !['paid', 'success', 'completed', 'expired', 'failed', 'cancelled'].includes(status)) {
    await db.insert(webhookEvents).values({ provider: 'pakasir', eventHash, payload, status: 'rejected', error: 'Invalid project, transaction, amount, or status' }).onConflictDoNothing({ target: webhookEvents.eventHash })
    throw createError({ statusCode: 400, statusMessage: 'Webhook tidak valid' })
  }
  const result = await db.transaction(async (tx) => {
    const [eventRow] = await tx.insert(webhookEvents).values({ provider: 'pakasir', eventHash, payload, status: 'processing' }).onConflictDoNothing({ target: webhookEvents.eventHash }).returning({ id: webhookEvents.id })
    if (!eventRow) return 'duplicate'
    const [order] = await tx.select().from(orders).where(eq(orders.orderNumber, providerTransactionId)).limit(1)
    if (!order || order.total !== amount) throw createError({ statusCode: 400, statusMessage: 'Pesanan atau nominal tidak cocok' })
    await tx.insert(payments).values({ orderId: order.id, provider: 'pakasir', providerTransactionId, method: String(payload?.method || 'unknown'), amount }).onConflictDoNothing({ target: [payments.orderId, payments.provider] })
    await tx.execute(sql`select ${payments.id} from ${payments} where ${payments.orderId} = ${order.id} and ${payments.provider} = 'pakasir' for update`)
    const [payment] = await tx.select().from(payments).where(and(eq(payments.orderId, order.id), eq(payments.provider, 'pakasir'))).limit(1)
    if (!payment || payment.providerTransactionId !== providerTransactionId || payment.amount !== amount) throw createError({ statusCode: 409, statusMessage: 'Identitas pembayaran tidak cocok' })
    const mapped = status === 'paid' || status === 'success' || status === 'completed' ? 'paid' : status
    await tx.update(payments).set({ status: mapped, paidAt: mapped === 'paid' ? new Date() : payment.paidAt, updatedAt: new Date() }).where(and(eq(payments.id, payment.id), ne(payments.status, 'paid')))
    if (mapped === 'paid') await tx.update(orders).set({ status: 'paid', updatedAt: new Date() }).where(and(eq(orders.id, order.id), eq(orders.status, 'pending')))
    if (['expired', 'failed', 'cancelled'].includes(mapped) && order.status === 'pending') {
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id))
      for (const item of items) {
        await tx.update(productVariants).set({ stock: sql`${productVariants.stock} + ${item.quantity}` }).where(eq(productVariants.id, item.variantId))
        await tx.insert(inventoryMovements).values({ variantId: item.variantId, orderId: order.id, quantity: item.quantity, reason: `payment_${mapped}` })
      }
      if (order.voucherCode) await tx.update(vouchers).set({ used: sql`greatest(0, ${vouchers.used} - 1)` }).where(eq(vouchers.code, order.voucherCode))
      await tx.update(orders).set({ status: mapped, cancelledAt: new Date(), updatedAt: new Date() }).where(and(eq(orders.id, order.id), eq(orders.status, 'pending')))
    }
    await tx.update(webhookEvents).set({ status: 'processed' }).where(eq(webhookEvents.id, eventRow.id))
    return 'processed'
  })
  return { ok: true, duplicate: result === 'duplicate' }
})
