import { eq } from 'drizzle-orm'
import { orders, refunds } from '../../db/schema'
import { useDatabase } from '../../db/client'
import { requireStaff } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const body = await readBody<{ orderNumber?: string; amount?: number; reason?: string; recipient?: string }>(event)
  if (!body.orderNumber || !Number.isInteger(body.amount) || body.amount! <= 0 || !body.reason?.trim() || !body.recipient?.trim()) throw createError({ statusCode: 400, statusMessage: 'Data refund tidak valid' })
  const [order] = await useDatabase().select().from(orders).where(eq(orders.orderNumber, body.orderNumber)).limit(1)
  if (!order || body.amount! > order.total) throw createError({ statusCode: 400, statusMessage: 'Nominal refund tidak valid' })
  const [refund] = await useDatabase().insert(refunds).values({ orderId: order.id, amount: body.amount!, reason: body.reason.trim(), recipient: body.recipient.trim(), requestedBy: user.id }).returning()
  return refund
})
