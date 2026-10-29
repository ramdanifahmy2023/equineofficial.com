export type ProductInput = { name: string; category: string; description?: string; material?: string; fit?: string; image?: string; active?: boolean; variants: Array<{ id?: string; color: string; size: string; sku: string; price: number; costPrice?: number; stock: number }> }

export const validateProductInput = (value: unknown): ProductInput => {
  const body = value as Partial<ProductInput>
  if (!body.name?.trim() || !body.category?.trim() || !Array.isArray(body.variants) || !body.variants.length) throw createError({ statusCode: 400, statusMessage: 'Data produk tidak lengkap' })
  if (body.variants.some((variant) => !variant.color?.trim() || !variant.size?.trim() || !variant.sku?.trim() || !Number.isInteger(variant.price) || variant.price < 0 || (variant.costPrice !== undefined && (!Number.isInteger(variant.costPrice) || variant.costPrice < 0)) || !Number.isInteger(variant.stock) || variant.stock < 0)) throw createError({ statusCode: 400, statusMessage: 'Varian tidak valid' })
  if (new Set(body.variants.map((variant) => variant.sku.trim().toLowerCase())).size !== body.variants.length) throw createError({ statusCode: 400, statusMessage: 'SKU harus unik' })
  return body as ProductInput
}

export const slugify = (value: string) => value.toLowerCase().trim().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
