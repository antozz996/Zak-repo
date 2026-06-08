import { setAuthTokenGetter } from "@workspace/api-client-react";

const TOKEN_KEY = "zak.auth.token";
const EXPIRES_KEY = "zak.auth.expires_at";

export function getStoredAuthToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function saveAuthSession(token: string, expiresAt: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(EXPIRES_KEY, expiresAt);
}

export function clearAuthSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(EXPIRES_KEY);
}

export function isStoredSessionExpired() {
  const expiresAt = window.localStorage.getItem(EXPIRES_KEY);
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() <= Date.now();
}

export function configureAuthTokenGetter() {
  setAuthTokenGetter(() => {
    if (isStoredSessionExpired()) {
      clearAuthSession();
      return null;
    }
    return getStoredAuthToken();
  });
}
