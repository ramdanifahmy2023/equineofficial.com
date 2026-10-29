import { products, productVariants } from '../../db/schema'
import { useDatabase } from '../../db/client'
import { requireStaff } from '../../utils/auth'
import { slugify, validateProductInput } from '../../utils/product'

export default defineEventHandler(async (event) => {
  await requireStaff(event, ['super_admin'])
  const body = validateProductInput(await readBody(event))
  const db = useDatabase()
  return db.transaction(async (tx) => {
    const slug = `${slugify(body.name)}-${Date.now().toString(36)}`
    const [product] = await tx.insert(products).values({ slug, name: body.name.trim(), category: body.category.trim(), description: body.description?.trim() || '', material: body.material?.trim() || '', fit: body.fit?.trim() || '', image: body.image || '/product-images/cargo-premium.jpg', active: body.active === false ? 0 : 1 }).returning()
    await tx.insert(productVariants).values(body.variants.map((variant) => ({ productId: product.id, color: variant.color.trim(), size: variant.size.trim(), sku: variant.sku.trim(), price: variant.price, costPrice: variant.costPrice || 0, stock: variant.stock })))
    return product
  })
})
