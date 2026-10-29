import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let database: ReturnType<typeof drizzle<typeof schema>> | undefined

export const useDatabase = () => {
  if (database) return database
  const databaseUrl = useRuntimeConfig().databaseUrl
  if (!databaseUrl) throw createError({ statusCode: 503, statusMessage: 'Database belum dikonfigurasi' })
  database = drizzle(postgres(databaseUrl, { max: 10 }), { schema })
  return database
}
