import { ref } from 'vue'
import { getJson } from '../api'

// { paginas: { resultados: true, ... }, secciones: { cifras: true, ... }, cifras: { atenciones: { visible, texto }, ... } }
// Lo que no venga (o si falla la carga) se considera visible.
const visibilidad = ref(null)
let carga = null

// El router la espera antes de la primera navegación, así nada oculto aparece y luego desaparece
export function cargarVisibilidad() {
  carga ||= getJson('/api/visibilidad')
    .then(r => { visibilidad.value = r.data })
    .catch(e => {
      console.error('Error cargando visibilidad:', e)
      visibilidad.value = {}
      carga = null
    })
  return carga
}

// Tras guardar en el panel, para que el portal cambie sin recargar
export function fijarVisibilidad(datos) {
  visibilidad.value = datos
}

// '/resultados' o 'resultados'. Rutas que no son páginas ocultables (Inicio, noticias, admin) siempre visibles.
export const paginaVisible = ruta => visibilidad.value?.paginas?.[ruta.split(/[?#]/)[0].replace(/^\//, '')] !== false

export function useVisibilidad() {
  const seccionVisible = id => visibilidad.value?.secciones?.[id] !== false
  const cifraVisible = id => visibilidad.value?.cifras?.[id]?.visible !== false
  const cifraTexto = (id, defecto) => visibilidad.value?.cifras?.[id]?.texto || defecto

  return { visibilidad, paginaVisible, seccionVisible, cifraVisible, cifraTexto }
}
