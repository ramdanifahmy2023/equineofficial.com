const baseUrl = 'https://rajaongkir.komerce.id/api/v1'

const config = () => {
  const runtime = useRuntimeConfig()
  if (!runtime.rajaOngkirApiKey || !runtime.rajaOngkirOriginId) throw createError({ statusCode: 503, statusMessage: 'Shipping gateway belum dikonfigurasi' })
  return runtime
}

export const searchDestinations = async (query: string): Promise<unknown[]> => {
  const runtime = config()
  if (query.trim().length < 3) return []
  const response: any = await $fetch<any>(`${baseUrl}/destination/domestic-destination`, { query: { search: query.trim() }, headers: { key: runtime.rajaOngkirApiKey } })
  return response?.data || []
}

export const calculateShipping = async (destinationId: string, weight: number, courier: string) => {
  const runtime = config()
  if (!destinationId || !Number.isInteger(weight) || weight <= 0 || !courier) throw createError({ statusCode: 400, statusMessage: 'Parameter pengiriman tidak valid' })
  const response: any = await $fetch<any>(`${baseUrl}/calculate/domestic-cost`, { method: 'POST', headers: { key: runtime.rajaOngkirApiKey }, body: { origin: runtime.rajaOngkirOriginId, destination: destinationId, weight, courier, price: 'lowest' } })
  return response?.data || []
}
