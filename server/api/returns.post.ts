import { and, eq, gt } from 'drizzle-orm'
import { orders, returnCases } from '../db/schema'
import { useDatabase } from '../db/client'
import { requireCustomer } from '../utils/customer-auth'

export default defineEventHandler(async (event) => {
  const customer = await requireCustomer(event)
  const body = await readBody<{ orderNumber?: string; type?: string; reason?: string }>(event)
  if (!body.orderNumber || !['return', 'exchange'].includes(body.type || '') || !body.reason?.trim()) throw createError({ statusCode: 400, statusMessage: 'Data pengajuan tidak valid' })
  const [order] = await useDatabase().select().from(orders).where(and(eq(orders.orderNumber, body.orderNumber), eq(orders.customerId, customer.id), eq(orders.status, 'completed'), gt(orders.updatedAt, new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)))).limit(1)
  if (!order) throw createError({ statusCode: 409, statusMessage: 'Pesanan belum selesai atau batas pengajuan tiga hari telah lewat' })
  const [created] = await useDatabase().insert(returnCases).values({ orderId: order.id, customerId: customer.id, type: body.type!, reason: body.reason.trim() }).returning()
  return created
})
