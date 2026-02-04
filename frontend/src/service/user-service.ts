import _ from "~/cypress/types/lodash";
import _kc from "../keycloak";
import config from "@/config";

export const AUTH_TOKEN = "__auth_token";

/**
 * Initializes Keycloak instance and calls the provided callback function if successfully authenticated.
 *
 * @param onAuthenticatedCallback
 */
let refreshTimer: NodeJS.Timeout | null = null;

const initKeycloak = async (
  route: string,
  onAuthenticatedCallback: (authenticated: boolean) => void,
) => {
  try {
    const authenticated = await _kc.init({
      onLoad: "check-sso",
      pkceMethod: "S256",
      checkLoginIframe: false,
    });
    if (!authenticated) {
      console.log("User is not authenticated.");
      if (route.startsWith("/unsubscribe/")) {
        onAuthenticatedCallback(true);
      } else {
        window.location.href = await _kc.createLoginUrl();
      }
    } else {
      console.log("User is authenticated.");
      localStorage.setItem(AUTH_TOKEN, `${_kc.token}`);
    }
    onAuthenticatedCallback(authenticated);

    if (refreshTimer) {
      clearInterval(refreshTimer);
    }
    refreshTimer = setInterval(() => {
      console.log("Polling to refresh token...");
      const expiresIn = _kc.tokenParsed?.exp
        ? (_kc.tokenParsed.exp * 1000 - Date.now()) / 1000
        : null;
      if (expiresIn !== null) {
        console.log(`Token expires in ${Math.round(expiresIn)} seconds.`);
        if (expiresIn <= 60) {
          console.log(
            "Token is about to expire (<= 60s), attempting to refresh...",
          );
        }
      }
      _kc.updateToken(60).then((refreshed) => {
        if (refreshed) {
          console.log("Token was refreshed by timer.");
          localStorage.setItem(AUTH_TOKEN, `${_kc.token}`);
        }
      });
    }, 30000);

    _kc.onTokenExpired = () => {
      console.log(
        "Token is expiring (onTokenExpired event fired), attempting to refresh...",
      );
      _kc.updateToken(5).then((refreshed) => {
        if (refreshed) {
          console.log("Token was refreshed by onTokenExpired handler.");
          localStorage.setItem(AUTH_TOKEN, `${_kc.token}`);
        }
      });
    };
  } catch (error) {
    console.error("keycloak error", error);
  }
};

const doLogin = _kc.login;

/**
 * Enhanced logout to clear tokens and use id_token_hint and post_logout_redirect_uri
 */
const doLogout = () => {
  localStorage.removeItem(AUTH_TOKEN);

  // Clear all cookies
  document.cookie.split(";").forEach((c) => {
    const eqPos = c.indexOf("=");
    const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; Secure; SameSite=Strict`;
  });
 
  // Redirect to Keycloak logout
  const appLogoutUrl = `${_kc.authServerUrl}/realms/${_kc.realm}/protocol/openid-connect/logout?id_token_hint=${_kc.idToken}&post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`;

  const smLogoutUrl = `${config.SMT_URL}/clp-cgi/logoff.cgi?retnow=1&returl=${encodeURIComponent(appLogoutUrl)}`;

  console.log("Redirecting to logout URL:", smLogoutUrl);
  console.log("App logout URL:", appLogoutUrl);

  window.location.href = smLogoutUrl;
};

const getToken = () => _kc.token;

const isLoggedIn = () => !!_kc.token;

const updateToken = (
  successCallback:
    | ((value: boolean) => boolean | PromiseLike<boolean>)
    | null
    | undefined,
) => _kc.updateToken(60).then(successCallback).catch(doLogin);

const getUsername = () => _kc.tokenParsed?.display_name;

/**
 * Determines if a user's role(s) overlap with the role on the private route.  The user's role is determined via jwt.client_roles
 * @param roles
 * @returns True or false, inidicating if the user has the role or not.
 */
const hasRole = (roles: any) => {
  const jwt = _kc.tokenParsed;
  const userroles = jwt?.client_roles;
  const includesRoles =
    typeof roles === "string"
      ? userroles?.includes(roles)
      : roles.some((r: any) => userroles?.includes(r));
  return includesRoles;
};

const UserService = {
  initKeycloak,
  doLogin,
  doLogout,
  isLoggedIn,
  getToken,
  updateToken,
  getUsername,
  hasRole,
};

export default UserService;
