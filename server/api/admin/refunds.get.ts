import { desc, eq } from 'drizzle-orm'
import { orders, refunds } from '../../db/schema'
import { useDatabase } from '../../db/client'
import { requireStaff } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireStaff(event)
  return useDatabase().select({ id: refunds.id, orderNumber: orders.orderNumber, amount: refunds.amount, reason: refunds.reason, recipient: refunds.recipient, status: refunds.status, createdAt: refunds.createdAt, approvedAt: refunds.approvedAt, completedAt: refunds.completedAt, transferReference: refunds.transferReference }).from(refunds).innerJoin(orders, eq(refunds.orderId, orders.id)).orderBy(desc(refunds.createdAt))
})
