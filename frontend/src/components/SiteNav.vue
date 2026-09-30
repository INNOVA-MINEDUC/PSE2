<template>
  <nav ref="nav" class="pse-nav-links" aria-label="Navegación principal">
    <template v-for="item in MENU" :key="item.nombre">

      <!-- Submenú -->
      <div v-if="item.hijos" class="pse-nav-grupo" :class="{ abierto: abierto === item.nombre }">
        <button
          type="button"
          class="pse-nav-toggle"
          :class="{ 'router-link-active': item.hijos.some(h => route.path.startsWith(h.to)) }"
          :aria-expanded="abierto === item.nombre"
          @click="alternar(item.nombre)"
        >
          {{ item.nombre }} <span aria-hidden="true">▾</span>
        </button>

        <div class="pse-nav-submenu">
          <router-link v-for="h in item.hijos" :key="h.to" :to="h.to">{{ h.nombre }}</router-link>
        </div>
      </div>

      <router-link v-else :to="item.to" :exact-active-class="item.to === '/' ? 'router-link-active' : ''" :active-class="item.to === '/' ? '' : 'router-link-active'">
        {{ item.nombre }}
      </router-link>
    </template>

    <router-link
      :to="usuario ? '/admin' : '/login'"
      class="pse-nav-login"
      :title="usuario ? 'Panel de administración' : 'Iniciar sesión'"
      :aria-label="usuario ? 'Panel de administración' : 'Iniciar sesión'"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </svg>
      <span class="pse-nav-login-texto">{{ usuario ? 'Panel' : 'Iniciar sesión' }}</span>
    </router-link>
  </nav>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const MENU = [
  { nombre: 'Inicio', to: '/' },
  {
    nombre: 'Resultados',
    hijos: [
      { nombre: 'Resultados del Programa', to: '/resultados' },
      { nombre: 'Análisis Multianual', to: '/multianual' },
      { nombre: 'Análisis Geográfico', to: '/geografico' }
    ]
  },
  {
    nombre: 'Beneficios',
    hijos: [
      { nombre: 'Promoción de la salud y noticias', to: '/promocion' },
      { nombre: 'Centro de llamadas 1528', to: '/llamadas' },
      { nombre: 'Apoyo funerario', to: '/apoyo-funerario' }
    ]
  },
  { nombre: 'Material Educativo', to: '/material' }
]

const route = useRoute()
const { usuario } = useAuth()

const nav = ref(null)
const abierto = ref('')

const alternar = nombre => {
  abierto.value = abierto.value === nombre ? '' : nombre
}

// Cierra el submenú al navegar, al hacer clic fuera o con Escape
watch(() => route.fullPath, () => { abierto.value = '' })

const clicFuera = e => {
  if (nav.value && !nav.value.contains(e.target)) abierto.value = ''
}
const tecla = e => {
  if (e.key === 'Escape') abierto.value = ''
}

onMounted(() => {
  document.addEventListener('click', clicFuera)
  document.addEventListener('keydown', tecla)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', clicFuera)
  document.removeEventListener('keydown', tecla)
})
</script>
