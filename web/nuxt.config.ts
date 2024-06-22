// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // ssr: false,

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  modules: [
    "nuxt-headlessui",
    "@nuxtjs/tailwindcss",
    "nuxt-graphql-request",
  ],

  build: {
    transpile: ['@popperjs/core', 'nuxt-graphql-request', '@venegrad/vue3-click-outside'],
  },

  alias: {
    "cross-fetch": "cross-fetch/dist/browser-ponyfill.js",
  },

  runtimeConfig: {
    public: {
      CG_KEY: process.env.CG_KEY,
      CG_URL: process.env.CG_URL || "https://api.coingecko.com/api/v3",
      API_URL: process.env.API_URL,
    },
  },

  graphql: {
    /**
     * An Object of your GraphQL clients
     */
    clients: {
      default: {
        /**
         * The client endpoint url
         */
        endpoint: process.env.API_URL || 'localhost:3000',

        options: {
          method: 'POST', // Default to `POST`
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        },
      },
    },
  },

  headlessui: {
    prefix: '',
  },
})
