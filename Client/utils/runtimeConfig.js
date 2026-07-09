const DEFAULT_API_ORIGIN = "http://localhost:5000";

const normalizeUrl = (value) => value.replace(/\/+$/, "");

export const getApiOrigin = () => {
  const rawApiUrl = import.meta.env.VITE_API_URL?.trim() || DEFAULT_API_ORIGIN;
  return normalizeUrl(rawApiUrl);
};

export const getApiBaseUrl = () => {
  const apiOrigin = getApiOrigin();
  return apiOrigin.endsWith("/api") ? apiOrigin : `${apiOrigin}/api`;
};

export const getGoogleAuthUrl = () => `${getApiOrigin()}/api/auth/google`;
