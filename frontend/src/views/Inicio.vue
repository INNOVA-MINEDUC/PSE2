<template>
  <!-- ACCESO RÁPIDO -->
  <section class="pse-section">
    <div class="pse-container">
      <h2 class="pse-title">Acceso rápido</h2>

      <div class="pse-quick-grid">
        <router-link class="pse-quick-card pse-quick-blue" to="/resultados">
          <div class="pse-quick-icon">▥</div>
          <div>
            <h3>Resultados del programa</h3>
            <p>Consulta los resultados y estadísticas del PSE.</p>
            <span class="pse-arrow">→</span>
          </div>
        </router-link>

        <router-link class="pse-quick-card pse-quick-cyan" to="/geografico">
          <div class="pse-quick-icon">🏫</div>
          <div>
            <h3>Análisis Geográfico</h3>
            <p>Busca información por departamento.</p>
            <span class="pse-arrow">→</span>
          </div>
        </router-link>

        <router-link class="pse-quick-card pse-quick-green" to="/multianual">
          <div class="pse-quick-icon">▤</div>
          <div>
            <h3>Reportes y análisis multianual</h3>
            <p>Explora los análisis y tendencias del programa.</p>
            <span class="pse-arrow">→</span>
          </div>
        </router-link>

        <router-link class="pse-quick-card pse-quick-yellow" to="/material">
          <div class="pse-quick-icon">⬇</div>
          <div>
            <h3>Material Educativo</h3>
            <p>Accede a documentos, guías e informes importantes.</p>
            <span class="pse-arrow">→</span>
          </div>
        </router-link>
      </div>
    </div>
  </section>

  <!-- CIFRAS DEL PROGRAMA -->
  <section class="pse-section">
    <div class="pse-container">
      <div class="pse-stats-wrap">
        <h2 class="pse-title">Cifras del programa</h2>

        <div class="pse-stats-grid">
          <div class="pse-stat-card">
            <strong>{{ nf(r.estudiantes_atendidos) }}</strong>
            <span>Estudiantes atendidos</span>
          </div>

          <div class="pse-stat-card">
            <strong>{{ nf(r.medicamentos_dispensados) }}</strong>
            <span>Medicamentos entregados</span>
          </div>

          <div class="pse-stat-card">
            <strong>{{ nf(r.atenciones) }}</strong>
            <span>Casos atendidos</span>
          </div>

          <div class="pse-stat-card">
            <strong>{{ nf(r.establecimientos_beneficiados) }}</strong>
            <span>Centros educativos beneficiados</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- BENEFICIOS -->
  <section class="pse-section">
    <div class="pse-container">
      <h2 class="pse-title">Beneficios gratuitos para los estudiantes</h2>

      <div class="pse-benefits-grid">
        <component
          :is="b.to ? RouterLink : 'div'"
          v-for="b in beneficios"
          :key="b.img"
          :to="b.to"
          class="pse-benefit-card"
        >
          <img :src="`/imagenes/${b.img}`" :alt="b.alt">
          <h3>{{ b.titulo }}</h3>
        </component>
      </div>
    </div>
  </section>

  <!-- NOTICIAS -->
  <section class="pse-section">
    <div class="pse-container">
      <NoticiasSeccion :limite="3" ver-todas="/promocion" estilo-inicio />
    </div>
  </section>

  <!-- PASOS PARA APORTE ECONÓMICO -->
  <section class="pse-section">
    <div class="pse-container">
      <h2 class="pse-title">Pasos para recibir el aporte económico por fallecimiento</h2>

      <PasosAporte />
    </div>
  </section>

  <!-- NORMATIVA LEGAL -->
  <section class="pse-section">
    <div class="pse-container">
      <NormativaLegal />
    </div>
  </section>

  <!-- CONTACTO -->
  <section>
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
import { nf } from '../format'

const { datos } = usePse(99)
const r = computed(() => datos.value?.resumen || {})

const beneficios = [
  { img: 'beneficio-salud.png', alt: 'Promoción de la salud', titulo: 'Promoción de la salud y prevención de enfermedades', to: '/promocion' },
  { img: 'beneficio-medicamentos.png', alt: 'Suministro de medicamentos', titulo: 'Suministro de medicamentos', to: '/resultados' },
  { img: 'beneficio-llamadas.png', alt: 'Centro de llamadas', titulo: 'Centro de llamadas 1528', to: '/llamadas' },
  { img: 'beneficio-atencion.png', alt: 'Atención médica', titulo: 'Atención médica en centros educativos', to: '/resultados' },
  { img: 'beneficio-apoyo.png', alt: 'Apoyo económico', titulo: 'Apoyo económico para gastos funerarios', to: '/apoyo-funerario' }
]
</script>
