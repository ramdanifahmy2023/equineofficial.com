export type CartItem = { slug: string; name: string; price: number; color: string; size: string; quantity: number; variantId?: string; sku?: string; availableStock?: number }
export type PaymentState = 'pending' | 'success' | 'failed' | 'expired'
export type PreviewOrder = {
  id: string
  createdAt: string
  items: CartItem[]
  contact: { email: string; phone: string; name: string; address: string; destination: string; postalCode: string }
  shipping: { id: string; courier: string; service: string; etd: string; price: number }
  paymentMethod: string
  subtotal: number
  total: number
  state: PaymentState
}
