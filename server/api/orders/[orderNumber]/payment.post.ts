import { and, eq } from 'drizzle-orm'
import { orders, payments } from '../../../db/schema'
import { useDatabase } from '../../../db/client'
import { requireCustomer } from '../../../utils/customer-auth'

export default defineEventHandler(async (event) => {
  const customer = await requireCustomer(event)
  const orderNumber = getRouterParam(event, 'orderNumber') || ''
  const body = await readBody<{ method?: string }>(event)
  const config = useRuntimeConfig()
  const slug = config.pakasirProjectSlug
  if (!slug) throw createError({ statusCode: 503, statusMessage: 'Payment gateway belum dikonfigurasi' })
  const db = useDatabase()
  const [order] = await db.select().from(orders).where(and(eq(orders.orderNumber, orderNumber), eq(orders.customerId, customer.id))).limit(1)
  if (!order) throw createError({ statusCode: 404, statusMessage: 'Pesanan tidak ditemukan' })
  if (order.paymentMethod === 'cod') throw createError({ statusCode: 409, statusMessage: 'Pesanan COD tidak memakai payment gateway' })
  if (order.status !== 'pending') throw createError({ statusCode: 409, statusMessage: 'Pesanan tidak menunggu pembayaran' })
  const method = body.method?.trim() || 'qris'
  if (!['qris', 'bri_va', 'bni_va'].includes(method)) throw createError({ statusCode: 400, statusMessage: 'Metode pembayaran tidak valid' })
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const [created] = await db.insert(payments).values({ orderId: order.id, provider: 'pakasir', providerTransactionId: orderNumber, method, amount: order.total, expiresAt }).onConflictDoNothing({ target: [payments.orderId, payments.provider] }).returning()
  const payment = created || (await db.select().from(payments).where(and(eq(payments.orderId, order.id), eq(payments.provider, 'pakasir'))).limit(1))[0]
  if (!payment) throw createError({ statusCode: 500, statusMessage: 'Pembayaran gagal dibuat' })
  if (payment.status !== 'pending') throw createError({ statusCode: 409, statusMessage: 'Pembayaran tidak menunggu' })
  const redirect = `${config.public.siteUrl}/payment/${orderNumber}`
  const url = `https://app.pakasir.com/pay/${encodeURIComponent(slug)}/${order.total}?order_id=${encodeURIComponent(payment.providerTransactionId)}&redirect=${encodeURIComponent(redirect)}`
  return { url, orderNumber, expiresAt: payment.expiresAt }
})
