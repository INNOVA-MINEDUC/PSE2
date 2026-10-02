<template>
  <!-- ACCESO RÁPIDO -->
  <section v-if="seccionVisible('acceso') && accesos.length" class="pse-section">
    <div class="pse-container">
      <h2 class="pse-title">Acceso rápido</h2>

      <div class="pse-quick-grid" :style="columnasAcceso">
        <router-link v-for="a in accesos" :key="a.to" class="pse-quick-card" :class="a.clase" :to="a.to">
          <div class="pse-quick-icon">{{ a.icono }}</div>
          <div>
            <h3>{{ a.titulo }}</h3>
            <p>{{ a.texto }}</p>
            <span class="pse-arrow">→</span>
          </div>
        </router-link>
      </div>
    </div>
  </section>

  <!-- CIFRAS DEL PROGRAMA -->
  <section v-if="seccionVisible('cifras') && cifras.length" class="pse-section">
    <div class="pse-container">
      <div class="pse-stats-wrap">
        <h2 class="pse-title">Cifras del programa</h2>

        <div class="pse-stats-grid" :style="columnasCifras">
          <div v-for="c in cifras" :key="c.id" class="pse-stat-card">
            <strong>{{ nf(r[c.id]) }}</strong>
            <span>{{ c.texto }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- BENEFICIOS -->
  <section v-if="seccionVisible('beneficios')" class="pse-section">
    <div class="pse-container">
      <h2 class="pse-title">Beneficios gratuitos para los estudiantes</h2>

      <div class="pse-benefits-grid">
        <component
          :is="enlace(b.to) ? RouterLink : 'div'"
          v-for="b in beneficios"
          :key="b.img"
          :to="enlace(b.to)"
          class="pse-benefit-card"
        >
          <img :src="`/imagenes/${b.img}`" :alt="b.alt">
          <h3>{{ b.titulo }}</h3>
        </component>
      </div>
    </div>
  </section>

  <!-- NOTICIAS -->
  <section v-if="seccionVisible('noticias')" class="pse-section">
    <div class="pse-container">
      <NoticiasSeccion :limite="3" :ver-todas="enlace('/promocion')" estilo-inicio />
    </div>
  </section>

  <!-- PASOS PARA APORTE ECONÓMICO -->
  <section v-if="seccionVisible('pasos')" class="pse-section">
    <div class="pse-container">
      <h2 class="pse-title">Pasos para recibir el aporte económico por fallecimiento</h2>

      <PasosAporte />
    </div>
  </section>

  <!-- NORMATIVA LEGAL -->
  <section v-if="seccionVisible('normativa')" class="pse-section">
    <div class="pse-container">
      <NormativaLegal />
    </div>
  </section>

  <!-- CONTACTO -->
  <section v-if="seccionVisible('contacto')">
    <div class="pse-container">
      <ContactoBar />
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="pse-footer">
    <div class="pse-container">
      <p>© 2026 Ministerio de Educación. Todos los derechos reservados.</p>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import PasosAporte from '../components/PasosAporte.vue'
import NormativaLegal from '../components/NormativaLegal.vue'
import ContactoBar from '../components/ContactoBar.vue'
import NoticiasSeccion from '../components/NoticiasSeccion.vue'
import { usePse } from '../composables/usePse'
import { useVisibilidad } from '../composables/useVisibilidad'
import { nf } from '../format'

const { datos } = usePse(99)
const r = computed(() => datos.value?.resumen || {})

// Lo que se oculta o renombra desde el panel (Contenido del portal → Visibilidad)
const { paginaVisible, seccionVisible, cifraVisible, cifraTexto } = useVisibilidad()
const enlace = to => to && paginaVisible(to) ? to : undefined

const ACCESOS = [
  { to: '/resultados', clase: 'pse-quick-blue', icono: '▥', titulo: 'Resultados del programa', texto: 'Consulta los resultados y estadísticas del PSE.' },
  { to: '/geografico', clase: 'pse-quick-cyan', icono: '🏫', titulo: 'Análisis Geográfico', texto: 'Busca información por departamento.' },
  { to: '/multianual', clase: 'pse-quick-green', icono: '▤', titulo: 'Reportes y análisis multianual', texto: 'Explora los análisis y tendencias del programa.' },
  { to: '/material', clase: 'pse-quick-yellow', icono: '⬇', titulo: 'Material Educativo', texto: 'Accede a documentos, guías e informes importantes.' }
]
const accesos = computed(() => ACCESOS.filter(a => paginaVisible(a.to)))
// 4 → 4 (2 en tablet), 3 → 3, 2 → 2, 1 → 1: siempre una fila completa
const columnasAcceso = computed(() => {
  const n = accesos.value.length
  return { '--cols': n, '--cols-md': n === 3 ? 3 : Math.min(n, 2) }
})

const CIFRAS = [
  { id: 'estudiantes_atendidos', texto: 'Estudiantes atendidos' },
  { id: 'medicamentos_dispensados', texto: 'Medicamentos entregados' },
  { id: 'atenciones', texto: 'Casos atendidos' },
  { id: 'establecimientos_beneficiados', texto: 'Centros educativos beneficiados' }
]
const cifras = computed(() => CIFRAS
  .filter(c => cifraVisible(c.id))
  .map(c => ({ id: c.id, texto: cifraTexto(c.id, c.texto) })))
// 4 → 2×2; 3, 2 o 1 → una sola fila centrada
const columnasCifras = computed(() => ({ '--cols': cifras.value.length === 4 ? 2 : cifras.value.length }))

const beneficios = [
  { img: 'beneficio-salud.png', alt: 'Promoción de la salud', titulo: 'Promoción de la salud y prevención de enfermedades', to: '/promocion' },
  { img: 'beneficio-medicamentos.png', alt: 'Suministro de medicamentos', titulo: 'Suministro de medicamentos', to: '/resultados' },
  { img: 'beneficio-llamadas.png', alt: 'Centro de llamadas', titulo: 'Centro de llamadas 1528', to: '/llamadas' },
  { img: 'beneficio-atencion.png', alt: 'Atención médica', titulo: 'Atención médica en centros educativos', to: '/resultados' },
  { img: 'beneficio-apoyo.png', alt: 'Apoyo económico', titulo: 'Apoyo económico para gastos funerarios', to: '/apoyo-funerario' }
]
</script>
