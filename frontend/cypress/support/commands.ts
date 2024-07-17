const base64url = (source) => {
  let encodedSource = btoa(source)
  encodedSource = encodedSource
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  return encodedSource
}

Cypress.Commands.add('kcLogin', () => {
  Cypress.log({ name: 'Login to Keycloak' })

  cy.log('Keyloak Login').then(async () => {
    const authBaseUrl = Cypress.env('auth_base_url')
    const realm = Cypress.env('auth_realm')
    const client_id = Cypress.env('auth_client_id')
    const redirect_uri = Cypress.config('baseUrl')

    const scope = 'openid'
    const code_challenge_method = 'S256'
    const kc_idp_hint = 'idir'

    // Make the initial request to the authentication endpoint.
    cy.request({
      method: 'GET',
      url: `${authBaseUrl}/realms/${realm}/protocol/openid-connect/auth`,
      qs: {
        client_id,
        redirect_uri,
        code_challenge_method,
        response_type: 'code',
        scope,
        kc_idp_hint,
      },
      followRedirect: false, // Don't follow the redirect automatically.
    }).then((response) => {
      // Extract the location header from the response to get the redirect URL.
      const redirectUrls = response.headers.location
      const url = Array.isArray(redirectUrls) ? redirectUrls[0] : redirectUrls

      // Visit redirect URL.
      const credentials = {
        username: Cypress.env('keycloak_user'),
        password: Cypress.env('keycloak_password'),
        url: url,
      }

      // depending on if we're running the cypress tests locally or not, we may or may not ge a CORS error.
      // If the keycloak login URL is the same as the application URL, then simply visit the URL;
      // otherwise, will need to use cy.origin to avoid any CORS errors.
      if (
        hasSameTopLevelDomain(
          Cypress.env('keycloak_login_url'),
          Cypress.env('baseUrl'),
        )
      ) {
        cy.visit(url)
        // Log in the user and obtain an authorization code.
        cy.get('[name="user"]').click()
        cy.get('[name="user"]').type(credentials.username)
        cy.get('[name="password"]').click()
        cy.get('[name="password"]').type(credentials.password, { log: false })
        cy.get('[name="btnSubmit"]').click()
      } else {
        // different origin, so handle CORS errors
        cy.origin(
          Cypress.env('keycloak_login_url'),
          { args: credentials },
          ({ username, password, url }) => {
            cy.visit(url)
            cy.get('#social-idir > .kc-social-title').click()
          },
        ).then(() => {
          cy.origin(
            Cypress.env('keycloak_login_url_2'),
            { args: credentials },
            ({ username, password, url }) => {
              cy.get('[name="user"]').click()
              cy.get('[name="user"]').type(Cypress.env('keycloak_user'))
              cy.get('[name="password"]').click()
              cy.get('[name="password"]').type(Cypress.env('keycloak_password'), {
                log: false,
              })
              cy.get('[name="btnSubmit"]').click()
            },
          )
        })
      }
    })
  })
})

function hasSameTopLevelDomain(url1: string, url2: string): boolean {
  const tld1 = extractTopLevelDomain(url1)
  const tld2 = extractTopLevelDomain(url2)

  return tld1 === tld2
}

function extractTopLevelDomain(url: string): string {
  const domain = new URL(url).hostname
  const parts = domain.split('.')
  const tld = parts.slice(-2).join('.')

  return tld
}

Cypress.Commands.add("kcLogout", () => {
  Cypress.log({ name: "Logout" });
  const authBaseUrl = Cypress.env("auth_base_url");
  const realm = Cypress.env("auth_realm");
  cy.request({
    url: `${authBaseUrl}/realms/${realm}/protocol/openid-connect/logout`,
  });
  cy.visit(Cypress.config().baseUrl);
  cy.on("uncaught:exception", (e) => {
    if (e.message.includes("Unexpected")) {
      // we expected this error, so let's ignore it
      // and let the test continue
      return false;
    }
  });
});
