import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { products, productVariants, staffUsers } from './schema'
import { hashPassword } from '../utils/auth'
import { products as catalog } from '../../data/products'

const databaseUrl = process.env.DATABASE_URL
const adminPassword = process.env.ADMIN_PASSWORD
if (!databaseUrl || !adminPassword) throw new Error('DATABASE_URL dan ADMIN_PASSWORD wajib diisi')

const sql = postgres(databaseUrl)
const db = drizzle(sql)

const main = async () => {
try {
  const seededUsers = await db.insert(staffUsers).values([
    { email: 'superadmin@equineofficial.com', name: 'Super Admin', passwordHash: hashPassword(adminPassword), role: 'super_admin' },
    { email: 'admin@equineofficial.com', name: 'Admin', passwordHash: hashPassword(adminPassword), role: 'admin' },
  ]).onConflictDoNothing({ target: staffUsers.email }).returning({ email: staffUsers.email })

  for (const product of catalog) {
    const [created] = await db.insert(products).values({ slug: product.slug, name: product.name, category: product.category, description: product.description, material: product.material, fit: product.fit, image: product.image }).onConflictDoNothing({ target: products.slug }).returning({ id: products.id })
    if (!created) continue
    await db.insert(productVariants).values(product.colors.flatMap((color) => product.sizes.map((size) => ({ productId: created.id, color, size, sku: `${product.slug}-${color}-${size}`.toLowerCase().replaceAll(' ', '-'), price: product.price, compareAtPrice: product.originalPrice || null, stock: 0, weightGrams: 500 }))))
  }
  console.log(`Seed selesai: ${seededUsers.length} akun baru`)
} finally {
  await sql.end()
}
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
