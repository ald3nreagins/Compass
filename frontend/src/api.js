const API_BASE = 'http://localhost:8080/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  signup: (email, password, name) =>
    request('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, name }) }),

  analyzeUrl: (url) =>
    request('/transcribe/url', { method: 'POST', body: JSON.stringify({ url }) }),

  analyzePortfolioImpact: (url, portfolioCompanies) =>
    request('/transcribe/url/portfolio-impact', {
      method: 'POST',
      body: JSON.stringify({ url, portfolioCompanies }),
    }),

  getHistory: () => request('/transcribe/history'),
};

export function saveToken(token) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
}

export function isLoggedIn() {
  return !!getToken();
}