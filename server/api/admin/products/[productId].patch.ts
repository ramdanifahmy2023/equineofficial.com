import { eq } from 'drizzle-orm'
import { products, productVariants } from '../../../db/schema'
import { useDatabase } from '../../../db/client'
import { requireStaff } from '../../../utils/auth'
import { validateProductInput } from '../../../utils/product'

export default defineEventHandler(async (event) => {
  await requireStaff(event, ['super_admin'])
  const productId = getRouterParam(event, 'productId') || ''
  const body = validateProductInput(await readBody(event))
  return useDatabase().transaction(async (tx) => {
    const [product] = await tx.update(products).set({ name: body.name.trim(), category: body.category.trim(), description: body.description?.trim() || '', material: body.material?.trim() || '', fit: body.fit?.trim() || '', image: body.image || '/product-images/cargo-premium.jpg', active: body.active === false ? 0 : 1, updatedAt: new Date() }).where(eq(products.id, productId)).returning()
    if (!product) throw createError({ statusCode: 404, statusMessage: 'Produk tidak ditemukan' })
    await tx.delete(productVariants).where(eq(productVariants.productId, productId))
    await tx.insert(productVariants).values(body.variants.map((variant) => ({ productId, color: variant.color.trim(), size: variant.size.trim(), sku: variant.sku.trim(), price: variant.price, costPrice: variant.costPrice || 0, stock: variant.stock })))
    return product
  })
})
