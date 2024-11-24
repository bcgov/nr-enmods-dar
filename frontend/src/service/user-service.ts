import _kc from '../keycloak'

export const AUTH_TOKEN = '__auth_token'

/**
 * Initializes Keycloak instance and calls the provided callback function if successfully authenticated.
 *
 * @param onAuthenticatedCallback
 */
const initKeycloak = (
  route: string,
  onAuthenticatedCallback: (authenticated: boolean) => void,
) => {
  _kc
    .init({
      onLoad: 'check-sso',
      pkceMethod: 'S256',
    })
    .then((authenticated) => {
      if (!authenticated) {
        console.log('User is not authenticated.')
        if (route.startsWith('/unsubscribe/')) {
          onAuthenticatedCallback(true)
        } else {
          console.log("User is not authenticated");
        }
      } else {
        localStorage.setItem(AUTH_TOKEN, `${_kc.token}`)
      }
      onAuthenticatedCallback(authenticated)
    })
    .catch(console.error)

  _kc.onTokenExpired = () => {
    _kc.updateToken(5).then((refreshed) => {
      if (refreshed) {
        localStorage.setItem(AUTH_TOKEN, `${_kc.token}`)
      }
    })
  }
}

const doLogin = _kc.login

const doLogout = _kc.logout

const getToken = () => _kc.token

const isLoggedIn = () => !!_kc.token

const updateToken = (
  successCallback:
    | ((value: boolean) => boolean | PromiseLike<boolean>)
    | null
    | undefined,
) => _kc.updateToken(5).then(successCallback).catch(doLogin)

const getUsername = () => _kc.tokenParsed?.display_name

/**
 * Determines if a user's role(s) overlap with the role on the private route.  The user's role is determined via jwt.client_roles
 * @param roles
 * @returns True or false, inidicating if the user has the role or not.
 */
const hasRole = (roles: any) => {
  const jwt = _kc.tokenParsed
  const userroles = jwt?.client_roles
  const includesRoles =
    typeof roles === 'string'
      ? userroles?.includes(roles)
      : roles.some((r: any) => userroles?.includes(r))
  return includesRoles
}

const UserService = {
  initKeycloak,
  doLogin,
  doLogout,
  isLoggedIn,
  getToken,
  updateToken,
  getUsername,
  hasRole,
}

export default UserService
