import { and, eq } from 'drizzle-orm'
import { products, productVariants } from '../db/schema'
import { useDatabase } from '../db/client'

export default defineEventHandler(async () => {
  const db = useDatabase()
  const rows = await db.select().from(products).leftJoin(productVariants, eq(products.id, productVariants.productId)).where(and(eq(products.active, 1), eq(products.archived, 0)))
  const grouped = new Map<string, any>()
  for (const row of rows) {
    const product = row.products
    const variant = row.product_variants
    if (!grouped.has(product.id)) grouped.set(product.id, { ...product, colors: [], sizes: [], variants: [], price: 0, soldOut: true })
    if (variant) {
      const item = grouped.get(product.id)
      item.variants.push(variant)
      if (!item.colors.includes(variant.color)) item.colors.push(variant.color)
      if (!item.sizes.includes(variant.size)) item.sizes.push(variant.size)
      if (!item.price || variant.price < item.price) item.price = variant.price
      if (variant.stock > 0) item.soldOut = false
    }
  }
  return [...grouped.values()]
})
