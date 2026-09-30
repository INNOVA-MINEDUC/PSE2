import { useRouter, useRoute } from 'vue-router'
import { solicitar } from '../api'
import { useAuth } from './useAuth'

// Llamadas a /api/admin: si la sesión venció (401) se vuelve al login
export function useAdmin() {
  const router = useRouter()
  const route = useRoute()
  const { sesionVencida } = useAuth()

  async function admin(ruta, opciones) {
    try {
      return await solicitar(`/api/admin${ruta}`, opciones)
    } catch (e) {
      if (e.status === 401) {
        sesionVencida()
        router.replace({ path: '/login', query: { redirect: route.fullPath } })
      }
      throw e
    }
  }

  // Sube un archivo (tipo: 'imagen' | 'pdf') y devuelve su URL
  async function subir(tipo, archivo) {
    const datos = new FormData()
    datos.append('archivo', archivo)
    return (await admin(`/uploads/${tipo}`, { metodo: 'POST', cuerpo: datos })).data.url
  }

  return { admin, subir }
}
