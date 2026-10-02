import { createRouter, createWebHistory } from 'vue-router'
import Inicio from './views/Inicio.vue'
import Resultados from './views/Resultados.vue'
import Multianual from './views/Multianual.vue'
import Geografico from './views/Geografico.vue'
import Material from './views/Material.vue'
import Llamadas from './views/Llamadas.vue'
import ApoyoFunerario from './views/ApoyoFunerario.vue'
import Promocion from './views/Promocion.vue'
import NoticiaDetalle from './views/NoticiaDetalle.vue'
import { useAuth } from './composables/useAuth'
import { cargarVisibilidad, paginaVisible } from './composables/useVisibilidad'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Inicio },
    { path: '/resultados', component: Resultados },
    { path: '/multianual', component: Multianual },
    { path: '/geografico', component: Geografico },
    { path: '/material', component: Material },
    { path: '/llamadas', component: Llamadas },
    { path: '/apoyo-funerario', component: ApoyoFunerario },
    { path: '/promocion', component: Promocion },
    { path: '/noticias/:id', component: NoticiaDetalle },
    // Panel de administración (se carga aparte: no pesa en el portal público)
    { path: '/login', component: () => import('./views/Login.vue'), meta: { sinHero: true, soloInvitados: true } },
    { path: '/admin', component: () => import('./views/Admin.vue'), meta: { sinHero: true, requiereSesion: true } },
    // Enlaces del sitio anterior (PHP, ya retirado): se conservan para no romper marcadores ni enlaces externos
    { path: '/index.php', redirect: '/' },
    { path: '/nav_3.php', redirect: '/resultados' },
    { path: '/nav_2.php', redirect: '/multianual' },
    { path: '/nav_5.php', redirect: to => ({ path: '/geografico', query: to.query }) },
    { path: '/nav_4.php', redirect: '/material' },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
  // Cada navegación inicia arriba de la página
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach(async to => {
  // Páginas ocultas desde el panel: también por URL directa
  await cargarVisibilidad()
  if (!paginaVisible(to.path)) return '/'

  if (!to.meta.requiereSesion && !to.meta.soloInvitados) return true

  const { cargarSesion } = useAuth()
  const usuario = await cargarSesion()

  if (to.meta.requiereSesion && !usuario) return { path: '/login', query: { redirect: to.fullPath } }
  if (to.meta.soloInvitados && usuario) return '/admin'
  return true
})

export default router
