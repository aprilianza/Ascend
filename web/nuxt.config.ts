export default defineNuxtConfig({
  compatibilityDate: '2025-02-01',
  devtools: { enabled: false },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/eslint',
  ],

  css: [
    '~/assets/css/main.css',
  ],

  runtimeConfig: {
    public: {
      apiBase: '',
    },
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
        class: 'dark scroll-smooth',
      },
      title: 'Ascend · Opportunity Map',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Find where your first shop still has room, from a count of shops against what local demand typically supports, not a busy-street hunch.',
        },
        { name: 'theme-color', content: '#0F1115' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'Ascend · Opportunity Map' },
        {
          property: 'og:description',
          content:
            'Free open-data business opportunity map showing where a new shop still has room vs local demand.',
        },
        { property: 'og:image', content: '/og-card.png' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Ascend · Opportunity Map' },
        { name: 'twitter:image', content: '/og-card.png' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'shortcut icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Josefin+Sans:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Manrope:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Unbounded:wght@600;700;800&display=swap',
        },
      ],
    },
  },

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.ts',
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },
})
