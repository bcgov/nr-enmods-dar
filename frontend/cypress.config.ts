import { defineConfig } from 'cypress'
import * as dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  e2e: {
    baseUrl:
      'http://localhost:5173',
    setupNodeEvents(on, config) {
      config.env = {
        ...config.env,
          auth_base_url: process.env.VITE_APP_KEYCLOAK_URL,
          auth_realm: process.env.VITE_APP_KEYCLOAK_REALM,
          auth_client_id: process.env.VITE_APP_KEYCLOAK_CLIENT_ID,
          baseUrl: "http://localhost:5173",
          keycloak_user: process.env.VITE_APP_KEYCLOAK_USER,
          keycloak_password: process.env.VITE_APP_KEYCLOAK_PASSWORD,
          keycloak_login_url: process.env.VITE_APP_KEYCLOAK_URL,
          keycloak_login_url_2: process.env.VITE_APP_KEYCLOAK_URL_2
      }

      return config;
      // implement node event listeners here
    },
    experimentalStudio: true,
    experimentalWebKitSupport: true,
  },
})
