// environment variable handling in production build images
// require runtime placement of vars to prevent rebuilding the image
// this application is destined to be run via a caddy file server.
// caddy file server has the https://caddyserver.com/docs/caddyfile/directives/templates
// templates directive to easily handle runtime variables

const config = {
  KEYCLOAK_CLIENT_ID: window.KEYCLOAK_CLIENT_ID || process.env.KEYCLOAK_CLIENT_ID,

  API_BASE_URL: window.API_URL || process.env.API_URL,

  KEYCLOAK_URL: window.KEYCLOAK_URL || process.env.KEYCLOAK_URL,

  KEYCLOAK_REALM: window.KEYCLOAK_REALM || process.env.KEYCLOAK_REALM,

  COMS_URL: window.REACT_APP_COMS_URL || process.env.REACT_APP_COMS_URL,

  COMS_BUCKET: window.REACT_APP_COMS_BUCKET || process.env.REACT_APP_COMS_BUCKET,
}

export default config
