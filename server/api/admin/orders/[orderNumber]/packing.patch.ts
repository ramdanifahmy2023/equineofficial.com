import { and, eq } from 'drizzle-orm'
import { auditEvents, orders } from '../../../../db/schema'
import { useDatabase } from '../../../../db/client'
import { requireStaff } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const orderNumber = getRouterParam(event, 'orderNumber') || ''
  const body = await readBody<{ itemsChecked?: boolean; variantChecked?: boolean; conditionChecked?: boolean }>(event)
  const complete = Boolean(body.itemsChecked && body.variantChecked && body.conditionChecked)
  return useDatabase().transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(and(eq(orders.orderNumber, orderNumber), eq(orders.claimedBy, user.id))).for('update')
    if (!order) throw createError({ statusCode: 403, statusMessage: 'Pesanan harus diklaim oleh admin ini' })
    if (!['paid', 'processing'].includes(order.status)) throw createError({ statusCode: 409, statusMessage: 'Pesanan belum dapat dikemas' })
    const [updated] = await tx.update(orders).set({ status: 'processing', packingChecklist: body, packingCompletedAt: complete ? new Date() : null, updatedAt: new Date() }).where(eq(orders.id, order.id)).returning()
    await tx.insert(auditEvents).values({ actorId: user.id, entityType: 'order', entityId: orderNumber, action: 'packing_checklist', before: order.packingChecklist, after: body })
    return updated
  })
})
