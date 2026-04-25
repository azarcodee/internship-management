export const API_BASE = "http://localhost/internship-management/backend";

export async function apiFetch(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
    return await res.json();
  } catch {
    return null;
  }
}
