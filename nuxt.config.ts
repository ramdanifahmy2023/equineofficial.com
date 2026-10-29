export default defineNuxtConfig({
  compatibilityDate: '2026-09-04',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    pakasirProjectSlug: process.env.NUXT_PAKASIR_PROJECT_SLUG || process.env.PAKASIR_PROJECT_SLUG,
    pakasirApiKey: process.env.NUXT_PAKASIR_API_KEY || process.env.PAKASIR_API_KEY,
    pakasirWebhookSecret: process.env.NUXT_PAKASIR_WEBHOOK_SECRET || process.env.PAKASIR_WEBHOOK_SECRET,
    rajaOngkirApiKey: process.env.NUXT_RAJA_ONGKIR_API_KEY || process.env.RAJAONGKIR_API_KEY,
    rajaOngkirOriginId: process.env.NUXT_RAJA_ONGKIR_ORIGIN_ID || process.env.RAJAONGKIR_ORIGIN_ID,
    quoteSigningSecret: process.env.NUXT_QUOTE_SIGNING_SECRET || process.env.QUOTE_SIGNING_SECRET,
    schedulerSecret: process.env.NUXT_SCHEDULER_SECRET || process.env.SCHEDULER_SECRET,
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || 'http://127.0.0.1:3020',
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'id' },
      title: 'EQUINE | Workwear Pants',
      meta: [
        {
          name: 'description',
          content: 'Celana workwear Equine untuk kerja lapangan dan pemakaian harian.',
        },
      ],
    },
  },
})
