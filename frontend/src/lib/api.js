export const API_BASE = "http://localhost/internship-management/backend";

export async function apiFetch(endpoint, options = {}) {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        "X-Role": user.role || "",
        ...options.headers,
      },
      ...options,
    });
    return await res.json();
  } catch {
    return null;
  }
}
