import { eq, sql } from 'drizzle-orm'
import { productVariants, products } from '../../db/schema'
import { useDatabase } from '../../db/client'
import { requireStaff } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireStaff(event)
  const db = useDatabase()
  const rows = await db.select().from(products).leftJoin(productVariants, eq(products.id, productVariants.productId)).where(eq(products.archived, 0))
  const grouped = new Map<string, any>()
  for (const row of rows) {
    const product = row.products
    if (!grouped.has(product.id)) grouped.set(product.id, { ...product, active: Boolean(product.active), sku: '', stock: 0, price: 0, variants: [], media: [{ id: `${product.id}-primary`, type: 'image', name: product.name, src: product.image, persisted: true }] })
    if (row.product_variants) {
      const item = grouped.get(product.id)
      item.variants.push(row.product_variants)
      item.stock += row.product_variants.stock
      item.price = item.price ? Math.min(item.price, row.product_variants.price) : row.product_variants.price
      item.sku ||= row.product_variants.sku
    }
  }
  return [...grouped.values()]
})
