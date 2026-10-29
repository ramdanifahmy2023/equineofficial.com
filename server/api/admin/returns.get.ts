import { desc, eq } from 'drizzle-orm'
import { orders, returnCases } from '../../db/schema'
import { useDatabase } from '../../db/client'
import { requireStaff } from '../../utils/auth'

export default defineEventHandler(async (event) => { await requireStaff(event); return useDatabase().select({ id: returnCases.id, orderNumber: orders.orderNumber, type: returnCases.type, reason: returnCases.reason, status: returnCases.status, inspectionResult: returnCases.inspectionResult, createdAt: returnCases.createdAt }).from(returnCases).innerJoin(orders, eq(returnCases.orderId, orders.id)).orderBy(desc(returnCases.createdAt)) })
