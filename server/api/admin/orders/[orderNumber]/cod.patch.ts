import { eq } from 'drizzle-orm'
import { auditEvents, codTransactions, orders } from '../../../../db/schema'
import { useDatabase } from '../../../../db/client'
import { requireStaff } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const orderNumber = getRouterParam(event, 'orderNumber') || ''
  const body = await readBody<{ action?: 'confirm' | 'collect' | 'settle'; settlementReference?: string; reason?: string }>(event)
  return useDatabase().transaction(async (tx) => {
    const [row] = await tx.select({ order: orders, cod: codTransactions }).from(orders).innerJoin(codTransactions, eq(codTransactions.orderId, orders.id)).where(eq(orders.orderNumber, orderNumber)).for('update')
    if (!row) throw createError({ statusCode: 404, statusMessage: 'COD tidak ditemukan' })
    if (body.action === 'confirm' && row.cod.status === 'awaiting_confirmation') {
      if (row.cod.confirmationDeadline < new Date()) throw createError({ statusCode: 409, statusMessage: 'Batas konfirmasi COD terlewati' })
      await tx.update(codTransactions).set({ status: 'confirmed', confirmedAt: new Date(), updatedAt: new Date() }).where(eq(codTransactions.id, row.cod.id))
      await tx.update(orders).set({ status: 'processing', updatedAt: new Date() }).where(eq(orders.id, row.order.id))
    } else if (body.action === 'collect' && row.cod.status === 'confirmed') await tx.update(codTransactions).set({ status: 'collected', collectedAt: new Date(), updatedAt: new Date() }).where(eq(codTransactions.id, row.cod.id))
    else if (body.action === 'settle' && row.cod.status === 'collected' && body.settlementReference?.trim()) await tx.update(codTransactions).set({ status: 'settled', settledAt: new Date(), settlementReference: body.settlementReference.trim(), updatedAt: new Date() }).where(eq(codTransactions.id, row.cod.id))
    else if (body.action !== undefined) throw createError({ statusCode: 409, statusMessage: 'Transisi COD tidak valid' })
    else throw createError({ statusCode: 400, statusMessage: 'Aksi COD wajib diisi' })
    await tx.insert(auditEvents).values({ actorId: user.id, entityType: 'cod', entityId: orderNumber, action: `cod_${body.action}`, reason: body.reason })
    const [cod] = await tx.select().from(codTransactions).where(eq(codTransactions.id, row.cod.id))
    return { orderNumber, status: cod.status }
  })
})
