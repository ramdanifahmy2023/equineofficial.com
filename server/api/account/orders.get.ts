import { desc, eq } from 'drizzle-orm'
import { orderItems, orders } from '../../db/schema'
import { useDatabase } from '../../db/client'
import { requireCustomer } from '../../utils/customer-auth'

export default defineEventHandler(async (event) => {
  const customer = await requireCustomer(event)
  const db = useDatabase()
  const rows = await db.select().from(orders).where(eq(orders.customerId, customer.id)).orderBy(desc(orders.createdAt))
  return Promise.all(rows.map(async (order) => ({ orderNumber: order.orderNumber, status: order.status, total: order.total, createdAt: order.createdAt, items: await db.select({ name: orderItems.productName, quantity: orderItems.quantity }).from(orderItems).where(eq(orderItems.orderId, order.id)) })))
})
