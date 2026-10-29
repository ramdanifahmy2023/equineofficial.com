import { and, eq } from 'drizzle-orm'
import { products, productVariants } from '../../db/schema'
import { useDatabase } from '../../db/client'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') || ''
  const db = useDatabase()
  const rows = await db.select().from(products).leftJoin(productVariants, eq(products.id, productVariants.productId)).where(and(eq(products.slug, slug), eq(products.active, 1), eq(products.archived, 0)))
  if (!rows.length) throw createError({ statusCode: 404, statusMessage: 'Produk tidak ditemukan' })
  const product = rows[0].products
  const variants = rows.flatMap((row) => row.product_variants ? [row.product_variants] : [])
  return { ...product, variants, colors: [...new Set(variants.map((variant) => variant.color))], sizes: [...new Set(variants.map((variant) => variant.size))], price: Math.min(...variants.map((variant) => variant.price)), soldOut: !variants.some((variant) => variant.stock > 0) }
})
