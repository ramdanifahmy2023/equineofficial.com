export type CreateOrderBody = {
  items: Array<{ variantId: string; quantity: number }>
  contact: { email: string; phone: string; name: string; address: string; destination: string; postalCode: string }
  shipping: { id: string; courier: string; service: string; etd?: string; price: number; destinationId?: string; quoteToken?: string }
  voucherCode?: string
  paymentMethod?: 'online' | 'cod'
}

export const validateCreateOrder = (value: unknown): CreateOrderBody => {
  const body = value as Partial<CreateOrderBody>
  if (!body || !Array.isArray(body.items) || !body.items.length || body.items.length > 50) throw createError({ statusCode: 400, statusMessage: 'Keranjang tidak valid' })
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (body.items.some((item) => !item || typeof item.variantId !== 'string' || !uuid.test(item.variantId) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20)) throw createError({ statusCode: 400, statusMessage: 'Item pesanan tidak valid' })
  if (new Set(body.items.map((item) => item.variantId)).size !== body.items.length) throw createError({ statusCode: 400, statusMessage: 'Varian duplikat dalam keranjang' })
  const contact = body.contact
  if (!contact || !/^\S+@\S+\.\S+$/.test(contact.email || '') || !contact.phone?.trim() || !contact.name?.trim() || !contact.address?.trim() || !contact.destination?.trim() || !/^\d{5}$/.test(contact.postalCode || '') || [contact.email, contact.phone, contact.name, contact.address, contact.destination].some((value) => value.length > 300)) throw createError({ statusCode: 400, statusMessage: 'Data kontak atau alamat tidak valid' })
  const shipping = body.shipping
  if (!shipping || !shipping.id?.trim() || !shipping.courier?.trim() || !shipping.service?.trim() || !Number.isInteger(shipping.price) || shipping.price < 0) throw createError({ statusCode: 400, statusMessage: 'Pengiriman tidak valid' })
  if (body.paymentMethod && !['online', 'cod'].includes(body.paymentMethod)) throw createError({ statusCode: 400, statusMessage: 'Metode pembayaran tidak valid' })
  return body as CreateOrderBody
}
