import { and, eq } from 'drizzle-orm'
import { orderItems, orders } from '../../db/schema'
import { useDatabase } from '../../db/client'
import { requireCustomer } from '../../utils/customer-auth'

export default defineEventHandler(async (event) => {
  const customer = await requireCustomer(event)
  const orderNumber = getRouterParam(event, 'orderNumber') || ''
  const db = useDatabase()
  const [order] = await db.select({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status, paymentMethod: orders.paymentMethod, customerName: orders.customerName, destination: orders.destination, address: orders.address, postalCode: orders.postalCode, subtotal: orders.subtotal, shippingCost: orders.shippingCost, total: orders.total, shipping: orders.shippingSnapshot, createdAt: orders.createdAt }).from(orders).where(and(eq(orders.orderNumber, orderNumber), eq(orders.customerId, customer.id))).limit(1)
  if (!order) throw createError({ statusCode: 404, statusMessage: 'Pesanan tidak ditemukan' })
  const items = await db.select({ name: orderItems.productName, color: orderItems.color, size: orderItems.size, quantity: orderItems.quantity, unitPrice: orderItems.unitPrice }).from(orderItems).where(eq(orderItems.orderId, order.id))
  const { id: _id, ...details } = order
  return { ...details, items }
})
