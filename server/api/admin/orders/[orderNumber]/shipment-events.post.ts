import { eq } from 'drizzle-orm'
import { auditEvents, codTransactions, orders, shipmentEvents } from '../../../../db/schema'
import { useDatabase } from '../../../../db/client'
import { requireStaff } from '../../../../utils/auth'

const terminalStatuses = ['delivered', 'failed']

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const orderNumber = getRouterParam(event, 'orderNumber') || ''
  const body = await readBody<{ externalId?: string; status?: string; description?: string; occurredAt?: string }>(event)
  if (!body.externalId?.trim() || !body.status?.trim() || !body.description?.trim() || !body.occurredAt || Number.isNaN(Date.parse(body.occurredAt))) throw createError({ statusCode: 400, statusMessage: 'Event pengiriman tidak valid' })
  const shipment = { externalId: body.externalId.trim(), status: body.status.trim(), description: body.description.trim(), occurredAt: new Date(body.occurredAt) }
  return useDatabase().transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.orderNumber, orderNumber)).for('update')
    if (!order) throw createError({ statusCode: 404, statusMessage: 'Pesanan tidak ditemukan' })
    const [existing] = await tx.select().from(shipmentEvents).where(eq(shipmentEvents.externalId, shipment.externalId)).limit(1)
    if (existing?.orderId === order.id) return { orderNumber, status: order.status, duplicate: true }
    if (existing) throw createError({ statusCode: 409, statusMessage: 'ID event pengiriman sudah digunakan' })
    if (['completed', 'failed'].includes(order.status) && terminalStatuses.includes(shipment.status)) return { orderNumber, status: order.status, duplicate: true }
    if (terminalStatuses.includes(shipment.status) && order.status !== 'shipped') throw createError({ statusCode: 409, statusMessage: 'Pesanan belum berstatus dikirim' })
    await tx.insert(shipmentEvents).values({ orderId: order.id, ...shipment })
    const orderStatus = shipment.status === 'delivered' ? 'completed' : shipment.status === 'failed' ? 'failed' : order.status
    await tx.update(orders).set({ status: orderStatus, updatedAt: new Date() }).where(eq(orders.id, order.id))
    if (shipment.status === 'delivered' && order.paymentMethod === 'cod') await tx.update(codTransactions).set({ status: 'collected', collectedAt: new Date(), updatedAt: new Date() }).where(eq(codTransactions.orderId, order.id))
    await tx.insert(auditEvents).values({ actorId: user.id, entityType: 'shipment', entityId: orderNumber, action: `shipment_${shipment.status}`, after: shipment })
    return { orderNumber, status: orderStatus, duplicate: false }
  })
})
