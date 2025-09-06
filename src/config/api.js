// API設定
const API_CONFIG = {
  // 本番環境のAPI URL
  production: {
    baseURL:
      process.env.VUE_APP_API_BASE_URL ||
      "https://fastapi-service-658417983475.us-central1.run.app",
  },
  // 開発環境のAPI URL
  development: {
    baseURL: process.env.VUE_APP_API_BASE_URL || "http://127.0.0.1:8000",
  },
};

// 現在の環境を取得
const getCurrentEnvironment = () => {
  // NODE_ENVが設定されている場合はそれを使用
  if (process.env.NODE_ENV) {
    return process.env.NODE_ENV;
  }

  // ホスト名で判定（localhostまたは127.0.0.1の場合は開発環境）
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "development";
    }
  }

  // デフォルトは本番環境
  return "production";
};

// 現在の環境に応じたAPI設定を取得
export const getApiConfig = () => {
  const environment = getCurrentEnvironment();
  return API_CONFIG[environment] || API_CONFIG.production;
};

// API URLを構築するヘルパー関数
export const buildApiUrl = (endpoint) => {
  const config = getApiConfig();
  const baseURL = config.baseURL.endsWith("/")
    ? config.baseURL.slice(0, -1)
    : config.baseURL;
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  return `${baseURL}${cleanEndpoint}`;
};

// デバッグ用：現在の設定を表示
export const logApiConfig = () => {
  const environment = getCurrentEnvironment();
  const config = getApiConfig();
  console.log("API Configuration:", {
    environment,
    baseURL: config.baseURL,
  });
};
