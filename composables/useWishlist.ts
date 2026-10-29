export const useWishlist = () => {
  const wishlist = useState<string[]>('wishlist', () => [])
  const hydrated = useState<boolean>('wishlist-hydrated', () => false)

  if (import.meta.client) {
    onMounted(() => {
      if (hydrated.value) return
      const storedWishlist = localStorage.getItem('equine-wishlist')
      if (storedWishlist) {
        try {
          wishlist.value = JSON.parse(storedWishlist)
        } catch {
          localStorage.removeItem('equine-wishlist')
        }
      }
      hydrated.value = true
    })

    watch(wishlist, (value: string[]) => {
      if (hydrated.value) localStorage.setItem('equine-wishlist', JSON.stringify(value))
    }, { deep: true })
  }

  const isWished = (slug: string) => wishlist.value.includes(slug)
  const toggle = (slug: string) => {
    wishlist.value = isWished(slug)
      ? wishlist.value.filter((item) => item !== slug)
      : [...wishlist.value, slug]
  }
  const remove = (slug: string) => {
    wishlist.value = wishlist.value.filter((item) => item !== slug)
  }

  return {
    wishlist,
    count: computed(() => wishlist.value.length),
    isWished,
    toggle,
    remove,
  }
}
