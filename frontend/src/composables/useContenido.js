import { ref } from 'vue'
import { getJson } from '../api'

const cache = new Map()

function cargar(ruta) {
  if (!cache.has(ruta)) {
    cache.set(ruta, getJson(ruta).then(r => r.data).catch(e => {
      cache.delete(ruta)
      throw e
    }))
  }
  return cache.get(ruta)
}

// Registros activos de una colección pública: historico, actividades, personal, materiales, normativa
export function useContenido(coleccion) {
  const items = ref(null)
  cargar(`/api/contenido/${coleccion}`)
    .then(d => { items.value = d })
    .catch(e => {
      console.error(`Error cargando ${coleccion}:`, e)
      items.value = []
    })
  return items
}

// Datos generales: { anio_actual, correo_contacto }
export function useConfiguracion() {
  const config = ref(null)
  cargar('/api/configuracion')
    .then(d => { config.value = d })
    .catch(e => {
      console.error('Error cargando configuración:', e)
      config.value = {}
    })
  return config
}

// Tras guardar en el panel, para que el portal muestre los datos nuevos sin recargar
export function limpiarCacheContenido() {
  cache.clear()
}
