import { ref } from 'vue'
import { getJson } from '../api'

// Enlaces configurables del módulo: { video_url, folleto_url, formulario_url }
export function useRecursos(modulo) {
  const recursos = ref({})
  getJson(`/api/recursos/${modulo}`)
    .then(r => { recursos.value = r.data || {} })
    .catch(e => console.error('Error cargando recursos:', e))
  return { recursos }
}

// Convierte enlaces de YouTube (watch, youtu.be, shorts) a formato embed
export function urlEmbed(url) {
  if (!url) return ''
  const id = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/)
  if (id) return `https://www.youtube-nocookie.com/embed/${id[1]}`
  return url.startsWith('https://') ? url : ''
}
