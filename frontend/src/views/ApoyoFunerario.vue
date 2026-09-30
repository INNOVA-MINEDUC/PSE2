<template>
  <main>

    <section class="pse-section">
      <div class="pse-container">

        <SectionTitle>Apoyo funerario</SectionTitle>

        <p class="mod-intro">
          En caso de fallecimiento de un estudiante inscrito en el sistema educativo público, el
          Programa de Salud Escolar (PSE) contempla un aporte económico de hasta
          <strong>Q7,500.00</strong> para apoyar a la familia en los gastos funerarios. Este apoyo
          busca acompañar y aliviar, en lo posible, a las familias en momentos difíciles.
        </p>

        <!-- PASOS -->
        <SectionTitle>Pasos para recibir el aporte económico</SectionTitle>

        <PasosAporte />

        <!-- VIDEO Y DOCUMENTOS -->
        <template v-if="recursos.video_url || recursos.folleto_url || recursos.formulario_url">
          <SectionTitle>Video informativo</SectionTitle>

          <VideoRecurso :url="recursos.video_url" titulo="Video informativo apoyo funerario" />

          <div class="material-acciones">
            <a v-if="recursos.folleto_url" :href="archivoUrl(recursos.folleto_url)" target="_blank" rel="noopener" class="pse-btn pse-btn-primary">
              ⬇ Descargar folleto PDF
            </a>
            <a v-if="recursos.formulario_url" :href="archivoUrl(recursos.formulario_url)" target="_blank" rel="noopener" class="pse-btn pse-btn-green">
              ⬇ Descargar formulario
            </a>
          </div>
        </template>

        <!-- REQUISITOS -->
        <SectionTitle>Flujo básico de atención</SectionTitle>

        <div class="pse-wide-card">
          <ol class="mod-list">
            <li v-for="req in requisitos" :key="req">
              <div>{{ req }}</div>
            </li>
          </ol>
        </div>

        <!-- RESUMEN -->
        <SectionTitle>Resumen del programa</SectionTitle>

        <div class="pse-wide-card">
          <ul class="mod-bullets">
            <li>El aporte económico puede ser de hasta <strong>Q7,500.00</strong> por estudiante.</li>
            <li>La familia elige la funeraria de su conveniencia, de acuerdo con las indicaciones del programa.</li>
            <li>El apoyo se otorga para contribuir a los gastos funerarios derivados del fallecimiento del estudiante.</li>
            <li>El PSE coordina con las Direcciones Departamentales para verificar la información y acompañar a la familia durante el proceso.</li>
          </ul>
        </div>

        <!-- CIFRAS -->
        <template v-if="datos">
          <SectionTitle>Aportes económicos a familias de estudiantes fallecidos</SectionTitle>

          <div class="geo-date-wrap">
            <span class="geo-date-badge">
              {{ r.periodo }}
            </span>
          </div>

          <div class="geo-bottom-grid">

            <div class="geo-stat-card">
              <img src="/imagenes/icons/ribbon_black.png" class="geo-icon">

              <div class="geo-label">
                Aportes económicos brindados a familias de estudiantes fallecidos
              </div>

              <div class="geo-number">
                {{ nf(r.fallecidos) }}
              </div>
            </div>

            <div class="geo-stat-card">
              <img src="/imagenes/icons/ribbon_black.png" class="geo-icon">

              <div class="geo-label">
                Aporte económico total
              </div>

              <div class="geo-number">
                Q{{ nf(r.monto) }}
              </div>
            </div>

            <div class="geo-stat-card">

              <div class="geo-label">
                Distribución por sexo
              </div>

              <div class="geo-sex-grid">

                <div>
                  <img src="/imagenes/icons/female.png" class="geo-icon-small">
                  <div class="geo-number">
                    {{ nf(r.fallecidos_f) }}
                  </div>
                  <div class="geo-label">
                    Femenino
                  </div>
                </div>

                <div>
                  <img src="/imagenes/icons/male.png" class="geo-icon-small">
                  <div class="geo-number">
                    {{ nf(r.fallecidos_m) }}
                  </div>
                  <div class="geo-label">
                    Masculino
                  </div>
                </div>

              </div>

            </div>

          </div>
        </template>

        <!-- NORMATIVA -->
        <div class="pse-section">
          <NormativaLegal />
        </div>

        <div class="mod-contacto">
          <ContactoBar />
        </div>

      </div>
    </section>

  </main>

  <FooterLogo />
</template>

<script setup>
import { computed } from 'vue'
import SectionTitle from '../components/SectionTitle.vue'
import PasosAporte from '../components/PasosAporte.vue'
import NormativaLegal from '../components/NormativaLegal.vue'
import ContactoBar from '../components/ContactoBar.vue'
import FooterLogo from '../components/FooterLogo.vue'
import VideoRecurso from '../components/VideoRecurso.vue'
import { useRecursos } from '../composables/useRecursos'
import { archivoUrl } from '../api'
import { usePse } from '../composables/usePse'
import { nf } from '../format'

const { datos } = usePse(99)
const { recursos } = useRecursos('funerario')
const r = computed(() => datos.value?.resumen || {})

const requisitos = [
  'El estudiante debe estar inscrito en el Sistema de Registros Educativos (SIRE).',
  'Presentar certificado de defunción del estudiante.',
  'Presentar DPI y NIT del padre, madre, tutor o encargado (o documento que lo acredite).',
  'Seguir las indicaciones de la Dirección Departamental de Educación para completar el trámite.'
]
</script>
