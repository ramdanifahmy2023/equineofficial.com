export type Product = {
  slug: string
  name: string
  category: 'Cargo' | 'Carpenter' | 'Cargo Loreng'
  price: number
  originalPrice?: number
  discount?: number
  rating: number
  soldLabel: string
  monthlySold?: number
  material: string
  fit: string
  colors: string[]
  sizes: string[]
  description: string
  tone: string
  image: string
  soldOut?: boolean
}

export const products: Product[] = [
  {
    slug: 'carpenter-king-marsoto',
    name: 'Carpenter Pants King Marsoto',
    category: 'Carpenter',
    price: 257500,
    originalPrice: 280000,
    discount: 8,
    rating: 4.9,
    soldLabel: '1RB+ terjual',
    monthlySold: 124,
    material: 'Katun Marsoto',
    fit: 'Mid waist',
    colors: ['Hitam', 'Mocca', 'Olive'],
    sizes: ['28', '30', '32', '34', '36'],
    description: 'Carpenter pants dengan bahan Katun Marsoto yang tebal dan halus. Kantong tambahan menjaga barang kecil tetap dekat saat bekerja.',
    tone: 'marsoto',
    image: '/product-images/carpenter-king-marsoto.jpg',
  },
  {
    slug: 'cargo-pants-premium',
    name: 'Cargo Pants Premium',
    category: 'Cargo',
    price: 291424,
    originalPrice: 502000,
    discount: 42,
    rating: 4.9,
    soldLabel: '1RB+ terjual',
    monthlySold: 91,
    material: 'Bahan premium',
    fit: 'Mid waist',
    colors: ['Hitam', 'Army'],
    sizes: ['28', '30', '32', '34', '36', '38'],
    description: 'Cargo panjang dengan kantong fungsional dan potongan yang rapi untuk kerja lapangan maupun pemakaian harian.',
    tone: 'cargo',
    image: '/product-images/cargo-premium.jpg',
  },
  {
    slug: 'cargo-pants-lapangan',
    name: 'Cargo Pants Kerja Lapangan',
    category: 'Cargo',
    price: 285238,
    originalPrice: 500000,
    discount: 43,
    rating: 4.8,
    soldLabel: '952 terjual',
    monthlySold: 77,
    material: 'Bahan premium',
    fit: 'Reguler',
    colors: ['Hitam', 'Army'],
    sizes: ['28', '30', '32', '34', '36'],
    description: 'Cargo panjang untuk aktivitas lapangan dengan ruang simpan yang mudah dijangkau dan siluet reguler.',
    tone: 'cargo-lapangan',
    image: '/product-images/cargo-lapangan.jpg',
  },
  {
    slug: 'cargo-army-ripstop',
    name: 'Cargo Army Ripstop',
    category: 'Cargo',
    price: 197500,
    originalPrice: 500000,
    discount: 61,
    rating: 4.9,
    soldLabel: '1RB+ terjual',
    monthlySold: 58,
    material: 'Katun Ripstop Premium',
    fit: 'Reguler',
    colors: ['Army', 'Hitam'],
    sizes: ['28', '30', '32', '34', '36'],
    description: 'Cargo berbahan ripstop dengan tampilan army dan ruang simpan yang mengikuti kebutuhan kerja lapangan.',
    tone: 'ripstop',
    image: '/product-images/cargo-army-ripstop.jpg',
  },
  {
    slug: 'cargo-camo-loreng',
    name: 'Cargo Camo Loreng Army',
    category: 'Cargo Loreng',
    price: 197500,
    originalPrice: 500000,
    discount: 61,
    rating: 5,
    soldLabel: '65 terjual',
    monthlySold: 24,
    material: 'Katun Ripstop Premium',
    fit: 'Reguler',
    colors: ['Loreng D'],
    sizes: ['28', '30', '32', '34', '36'],
    description: 'Cargo camo dengan bahan ripstop dan motif Loreng Army untuk paduan kerja lapangan dan gaya santai.',
    tone: 'camo',
    image: '/product-images/cargo-camo-loreng.jpg',
  },
  {
    slug: 'cargo-long-pants-black',
    name: 'Cargo Long Pants Black',
    category: 'Cargo',
    price: 297400,
    originalPrice: 500000,
    discount: 41,
    rating: 4.9,
    soldLabel: '76 terjual',
    monthlySold: 0,
    material: 'Bahan premium',
    fit: 'Reguler',
    colors: ['Hitam', 'Army'],
    sizes: ['28', '30', '32', '34', '36'],
    description: 'Cargo long pants warna hitam dengan siluet reguler dan kantong yang mudah dijangkau.',
    tone: 'camel',
    image: '/product-images/long-cargo-black.jpg',
  },
  {
    slug: 'carpenter-pants-kerja',
    name: 'Carpenter Pants Celana Kerja',
    category: 'Carpenter',
    price: 244550,
    originalPrice: 260000,
    discount: 6,
    rating: 4.9,
    soldLabel: '166 terjual',
    monthlySold: 0,
    material: 'Bahan carpenter',
    fit: 'Mid waist',
    colors: ['Olive', 'Hitam'],
    sizes: ['28', '30', '32', '34', '36'],
    description: 'Carpenter pants untuk kerja lapangan dengan detail kantong dan konstruksi yang praktis.',
    tone: 'double-knee',
    image: '/product-images/carpenter-work.jpg',
  },
  {
    slug: 'carpenter-semi-baggy',
    name: 'Carpenter Pants Semi Baggy',
    category: 'Carpenter',
    price: 257500,
    originalPrice: 500000,
    discount: 49,
    rating: 4.9,
    soldLabel: '61 terjual',
    monthlySold: 0,
    material: 'Bahan carpenter',
    fit: 'Semi baggy',
    colors: ['Hitam', 'Olive'],
    sizes: ['28', '30', '32', '34', '36'],
    description: 'Potongan semi baggy dengan karakter carpenter yang lebih longgar untuk pemakaian harian.',
    tone: 'double-knee',
    image: '/product-images/carpenter-semi-baggy.jpg',
  },
]

export const categories = [
  { name: 'Semua produk', value: 'Semua' },
  { name: 'Cargo', value: 'Cargo' },
  { name: 'Carpenter', value: 'Carpenter' },
  { name: 'Cargo Loreng', value: 'Cargo Loreng' },
]

export const findProduct = (slug: string) => products.find((product) => product.slug === slug)
