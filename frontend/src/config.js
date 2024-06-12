// environment variable handling in production build images
// require runtime placement of vars to prevent rebuilding the image
// this application is destined to be run via a caddy file server.
// caddy file server has the https://caddyserver.com/docs/caddyfile/directives/templates
// templates directive to easily handle runtime variables

const config = {
  KEYCLOAK_CLIENT_ID: window.VITE_APP_KEYCLOAK_CLIENT_ID || import.meta.env.VITE_APP_KEYCLOAK_CLIENT_ID,

  API_BASE_URL: window.VITE_APP_API_URL || import.meta.env.VITE_APP_API_URL,

  KEYCLOAK_URL: window.VITE_APP_KEYCLOAK_URL || import.meta.env.VITE_APP_KEYCLOAK_URL,

  KEYCLOAK_REALM: window.VITE_APP_KEYCLOAK_REALM || import.meta.env.VITE_APP_KEYCLOAK_REALM,

  COMS_URL: window.VITE_APP_COMS_URL || import.meta.env.VITE_APP_COMS_URL,

  COMS_BUCKET: window.VITE_APP_COMS_BUCKET || import.meta.env.VITE_APP_COMS_BUCKET,
}

export default config
