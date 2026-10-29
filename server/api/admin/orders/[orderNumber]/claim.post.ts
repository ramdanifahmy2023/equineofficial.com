import { and, eq, isNull } from 'drizzle-orm'
import { auditEvents, orders } from '../../../../db/schema'
import { useDatabase } from '../../../../db/client'
import { requireStaff } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const orderNumber = getRouterParam(event, 'orderNumber') || ''
  return useDatabase().transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(and(eq(orders.orderNumber, orderNumber), isNull(orders.claimedBy))).for('update')
    if (!order) throw createError({ statusCode: 409, statusMessage: 'Pesanan sudah diambil admin lain atau tidak ditemukan' })
    const [claimed] = await tx.update(orders).set({ claimedBy: user.id, claimedAt: new Date(), updatedAt: new Date() }).where(eq(orders.id, order.id)).returning()
    await tx.insert(auditEvents).values({ actorId: user.id, entityType: 'order', entityId: orderNumber, action: 'claimed', after: { claimedBy: user.id } })
    return claimed
  })
})
