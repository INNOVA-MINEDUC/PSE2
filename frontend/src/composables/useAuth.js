import { ref } from 'vue'
import { solicitar } from '../api'

// Estado de sesión compartido por toda la app
const usuario = ref(null)
let verificada = false

export function useAuth() {
  // Consulta /api/auth/me una sola vez (o de nuevo con forzar = true)
  async function cargarSesion(forzar = false) {
    if (verificada && !forzar) return usuario.value
    try {
      usuario.value = (await solicitar('/api/auth/me')).data
    } catch {
      usuario.value = null
    }
    verificada = true
    return usuario.value
  }

  async function iniciarSesion(correo, clave) {
    usuario.value = (await solicitar('/api/auth/login', { metodo: 'POST', cuerpo: { correo, clave } })).data
    verificada = true
  }

  async function cerrarSesion() {
    try {
      await solicitar('/api/auth/logout', { metodo: 'POST' })
    } finally {
      usuario.value = null
    }
  }

  // Tras un 401 en el panel (sesión vencida)
  function sesionVencida() {
    usuario.value = null
  }

  return { usuario, cargarSesion, iniciarSesion, cerrarSesion, sesionVencida }
}
