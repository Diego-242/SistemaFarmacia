// fetch con timeout para las llamadas server-side (SSR) del frontend.
// Evita que una página quede cargando para siempre si el backend está dormido (free tier de Render).
export async function apiFetch(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}