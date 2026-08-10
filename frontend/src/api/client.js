import axios from "axios";

const TOKEN_KEY = "sms_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// baseURL vazio: em dev o proxy do Vite (vite.config.js) encaminha /api pro
// backend; em produção o build é servido atrás do mesmo domínio/reverse proxy.
const apiClient = axios.create({ baseURL: "/api" });

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 em qualquer chamada = sessão inválida/expirada. Limpa e manda pro login,
// preservando a rota atual pra voltar depois de logar de novo.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setToken(null);
      const next = encodeURIComponent(window.location.pathname);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = `/login?next=${next}`;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
