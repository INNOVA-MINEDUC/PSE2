// Base de la API. Vacía = mismo dominio (nginx en producción, proxy de Vite en desarrollo).
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export const apiUrl = ruta => `${BASE}${ruta}`

// Archivos subidos ("/uploads/..." en disco o "/api/archivos/..." en el bucket) se sirven desde el backend
export const archivoUrl = ruta =>
  ruta && (ruta.startsWith('/uploads/') || ruta.startsWith('/api/archivos/')) ? apiUrl(ruta) : ruta

export class ApiError extends Error {
  constructor(mensaje, status) {
    super(mensaje)
    this.status = status
  }
}

// Petición JSON (o FormData para subir archivos). Envía la cookie de sesión.
export async function solicitar(ruta, { metodo = 'GET', cuerpo } = {}) {
  const opciones = { method: metodo, credentials: 'include', headers: {} }
  if (cuerpo instanceof FormData) {
    opciones.body = cuerpo
  } else if (cuerpo !== undefined) {
    opciones.headers['Content-Type'] = 'application/json'
    opciones.body = JSON.stringify(cuerpo)
  }

  const r = await fetch(apiUrl(ruta), opciones)
  const datos = await r.json().catch(() => ({}))
  if (!r.ok) throw new ApiError(datos.error || `Error ${r.status}`, r.status)
  return datos
}

export const getJson = ruta => solicitar(ruta)
