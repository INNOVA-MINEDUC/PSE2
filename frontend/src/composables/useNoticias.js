import { ref, watch, isRef, unref } from 'vue'
import { getJson } from '../api'

// Lista de noticias activas: useNoticias({ modulo: 'promocion', limite: 3 })
export function useNoticias(filtros = {}) {
  const noticias = ref([])
  const cargando = ref(true)

  const cargar = async () => {
    const params = new URLSearchParams()
    const { modulo, limite } = filtros
    if (modulo) params.set('modulo', modulo)
    if (limite) params.set('limite', limite)
    cargando.value = true
    try {
      noticias.value = (await getJson(`/api/noticias?${params}`)).data
    } catch (e) {
      console.error('Error cargando noticias:', e)
      noticias.value = []
    } finally {
      cargando.value = false
    }
  }

  cargar()
  return { noticias, cargando }
}

// Una noticia por id (acepta ref para reaccionar al cambio de ruta)
export function useNoticia(id) {
  const noticia = ref(null)
  const error = ref(false)

  const cargar = async valor => {
    noticia.value = null
    error.value = false
    try {
      noticia.value = (await getJson(`/api/noticias/${encodeURIComponent(valor)}`)).data
    } catch {
      error.value = true
    }
  }

  if (isRef(id)) watch(id, cargar, { immediate: true })
  else cargar(unref(id))

  return { noticia, error }
}
