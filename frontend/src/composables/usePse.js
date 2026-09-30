import { ref, watch, isRef } from 'vue'
import { apiUrl } from '../api'

const cache = new Map()

function cargar(departamento) {
  const clave = departamento || 99
  if (!cache.has(clave)) {
    const peticion = fetch(apiUrl(`/api/pse?departamento=${clave}`))
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .catch(err => {
        cache.delete(clave)
        throw err
      })
    cache.set(clave, peticion)
  }
  return cache.get(clave)
}

// Datos de resumen_ejecutivo_pse + diagnosticos_pse + medicamentos_pse
export function usePse(departamento = 99) {
  const datos = ref(null)
  const error = ref(null)

  const obtener = async dep => {
    error.value = null
    try {
      const resultado = await cargar(dep)
      datos.value = {
        ...resultado,
        resumen: resultado.resumen || {}
      }
    } catch (e) {
      error.value = e
    }
  }

  if (isRef(departamento)) {
    watch(departamento, obtener, { immediate: true })
  } else {
    obtener(departamento)
  }

  return { datos, error }
}

// Tras editar cifras en el panel
export function limpiarCachePse() {
  cache.clear()
}
