<template>
  <main>

    <section class="pse-section">
      <div class="pse-container">

        <div class="adm-barra">
          <div>
            <h1 class="adm-titulo">Panel de administración</h1>
            <p class="adm-usuario">{{ usuario?.nombre }} · {{ usuario?.correo }}</p>
          </div>
          <button type="button" class="pse-btn pse-btn-primary" @click="salir">Cerrar sesión</button>
        </div>

        <!-- Secciones -->
        <div class="adm-tabs" role="tablist">
          <button
            v-for="s in SECCIONES"
            :key="s.id"
            type="button"
            role="tab"
            class="adm-tab"
            :class="{ activa: seccion.id === s.id }"
            :aria-selected="seccion.id === s.id"
            @click="irA(s.id)"
          >
            {{ s.nombre }}
          </button>
        </div>

        <!-- Apartados de la sección -->
        <div v-if="seccion.apartados" class="adm-subtabs">
          <button
            v-for="a in seccion.apartados"
            :key="a.id"
            type="button"
            class="adm-subtab"
            :class="{ activa: apartado.id === a.id }"
            @click="irA(seccion.id, a.id)"
          >
            {{ a.nombre }}
          </button>
        </div>

        <AdminNoticias v-if="apartado.id === 'noticias'" />
        <AdminRecursos v-else-if="apartado.id === 'recursos'" />
        <AdminConfiguracion v-else-if="apartado.id === 'configuracion'" />
        <AdminVisibilidad v-else-if="apartado.id === 'visibilidad'" />
        <AdminUsuarios v-else-if="apartado.id === 'usuarios'" />
        <AdminCrud v-else :key="apartado.id" :coleccion="apartado.id" />

      </div>
    </section>

  </main>

  <FooterLogo />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FooterLogo from '../components/FooterLogo.vue'
import AdminNoticias from '../components/admin/AdminNoticias.vue'
import AdminRecursos from '../components/admin/AdminRecursos.vue'
import AdminConfiguracion from '../components/admin/AdminConfiguracion.vue'
import AdminVisibilidad from '../components/admin/AdminVisibilidad.vue'
import AdminUsuarios from '../components/admin/AdminUsuarios.vue'
import AdminCrud from '../components/admin/AdminCrud.vue'
import { useAuth } from '../composables/useAuth'

// Los id de apartado que no tienen componente propio son colecciones del CRUD genérico
const SECCIONES = [
  { id: 'noticias', nombre: 'Noticias' },
  {
    id: 'cifras',
    nombre: 'Cifras del programa',
    apartados: [
      { id: 'resumen', nombre: 'Año en curso' },
      { id: 'diagnosticos', nombre: 'Diagnósticos' },
      { id: 'medicamentos', nombre: 'Medicamentos' },
      { id: 'historico', nombre: 'Años anteriores' }
    ]
  },
  {
    id: 'contenido',
    nombre: 'Contenido del portal',
    apartados: [
      { id: 'actividades', nombre: 'Actividades de promoción' },
      { id: 'personal', nombre: 'Personal 1528' },
      { id: 'materiales', nombre: 'Material educativo' },
      { id: 'normativa', nombre: 'Normativa legal' },
      { id: 'recursos', nombre: 'Videos y documentos' },
      { id: 'configuracion', nombre: 'Datos generales' },
      { id: 'visibilidad', nombre: 'Visibilidad' }
    ]
  },
  { id: 'usuarios', nombre: 'Usuarios' }
]

const route = useRoute()
const router = useRouter()
const { usuario, cerrarSesion } = useAuth()

// La sección y el apartado viven en la URL (/admin?s=cifras&a=diagnosticos) para poder recargar o compartir
const seccion = computed(() => SECCIONES.find(s => s.id === route.query.s) || SECCIONES[0])
const apartado = computed(() => {
  const lista = seccion.value.apartados
  if (!lista) return seccion.value
  return lista.find(a => a.id === route.query.a) || lista[0]
})

function irA(s, a) {
  router.replace({ query: a ? { s, a } : { s } })
}

async function salir() {
  await cerrarSesion()
  router.replace('/login')
}
</script>
