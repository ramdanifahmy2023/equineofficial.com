import { eq } from 'drizzle-orm'
import { products } from '../../../db/schema'
import { useDatabase } from '../../../db/client'
import { requireStaff } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireStaff(event, ['super_admin'])
  const productId = getRouterParam(event, 'productId') || ''
  const [archived] = await useDatabase().update(products).set({ active: 0, archived: 1, updatedAt: new Date() }).where(eq(products.id, productId)).returning({ id: products.id })
  if (!archived) throw createError({ statusCode: 404, statusMessage: 'Produk tidak ditemukan' })
  return { archived: true }
})
