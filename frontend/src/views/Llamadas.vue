<template>
  <main>

    <section class="pse-section">
      <div class="pse-container">

        <SectionTitle>Centro de llamadas 1528</SectionTitle>

        <p class="mod-intro">
          El 1528 es la línea gratuita de orientación médica para estudiantes del sistema educativo
          nacional. A través de este centro se realizan consultas, referencias a servicios de salud
          y coordinación en casos de emergencia.
        </p>

        <template v-if="datos && historico && config">
          <div class="geo-date-wrap">
            <span class="geo-date-badge">
              {{ r.periodo }}
            </span>
          </div>

          <div class="geo-bottom-grid">
            <div v-for="anio in anios" :key="anio.anio" class="geo-stat-card">
              <img src="/imagenes/icons/center.png" class="geo-icon">
              <div class="geo-label">
                Llamadas al 1528 — {{ anio.anio }}
              </div>
              <div class="geo-number">
                {{ anio.valor }}
              </div>
            </div>
          </div>

          <div class="geo-note">
            <center>* Cifras de {{ ANIO_ACTUAL }}: información preliminar sujeta a actualización.</center>
          </div>
        </template>

        <!-- ¿CÓMO FUNCIONA? -->
        <SectionTitle>¿Cómo funciona la línea 1528?</SectionTitle>

        <p class="mod-intro">
          Sigue estos pasos cuando necesites orientación por enfermedad o accidente.
        </p>

        <div class="pse-wide-card">
          <div class="pse-steps-row">
            <template v-for="(paso, i) in pasos" :key="paso.titulo">
              <div v-if="i" class="pse-step-arrow">›</div>
              <div class="pse-step">
                <div class="pse-step-icon">
                  <span class="pse-step-number">{{ i + 1 }}</span>
                  {{ paso.icono }}
                </div>
                <div>
                  <h3>{{ paso.titulo }}</h3>
                  <p>{{ paso.texto }}</p>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- PERSONAL -->
        <SectionTitle>Personal designado</SectionTitle>

        <p class="mod-intro">
          El personal está organizado en turnos fijos y rotativos para garantizar la atención
          continua durante todo el día.
        </p>

        <div class="mod-grid-4">
          <div v-for="p in personal" :key="p.id" class="geo-morb-card mod-card">
            <img v-if="p.imagen_url" :src="archivoUrl(p.imagen_url)" class="geo-icon" alt="">
            <div class="geo-number">{{ p.cantidad }}</div>
            <h3>{{ p.titulo }}</h3>
            <p>{{ p.texto }}</p>
          </div>
        </div>

        <!-- VIDEO -->
        <template v-if="recursos.video_url">
          <SectionTitle>¿Cuándo llamar al 1528?</SectionTitle>

          <VideoRecurso :url="recursos.video_url" titulo="Video institucional Centro de llamadas 1528" />
        </template>

        <!-- TIPOS DE CASOS -->
        <SectionTitle>¿Qué tipo de casos se atienden?</SectionTitle>

        <p class="mod-intro">
          La línea 1528 brinda orientación médica y referencias en distintos tipos de situaciones
          relacionadas con la salud de las y los estudiantes.
        </p>

        <div class="mod-grid-4">
          <div v-for="c in casos" :key="c.titulo" class="geo-morb-card mod-card">
            <img :src="`/imagenes/icons/${c.icono}`" class="geo-icon">
            <h3>{{ c.titulo }}</h3>
            <p>{{ c.texto }}</p>
          </div>
        </div>

        <!-- FLUJO BÁSICO -->
        <SectionTitle>Flujo básico de atención</SectionTitle>

        <div class="pse-wide-card">
          <ol class="mod-list">
            <li v-for="f in flujo" :key="f.titulo">
              <div><strong>{{ f.titulo }}:</strong> {{ f.texto }}</div>
            </li>
          </ol>
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
import ContactoBar from '../components/ContactoBar.vue'
import FooterLogo from '../components/FooterLogo.vue'
import VideoRecurso from '../components/VideoRecurso.vue'
import { archivoUrl } from '../api'
import { useRecursos } from '../composables/useRecursos'
import { usePse } from '../composables/usePse'
import { nf } from '../format'
import { useContenido, useConfiguracion } from '../composables/useContenido'

const { datos } = usePse(99)
const { recursos } = useRecursos('llamadas')
const r = computed(() => datos.value?.resumen || {})

const historico = useContenido('historico')
const config = useConfiguracion()
const personal = useContenido('personal')
const ANIO_ACTUAL = computed(() => config.value?.anio_actual || '')

// Últimos dos años cerrados + año en curso
const anios = computed(() => [
  ...(historico.value || []).slice(-2).map(h => ({ anio: h.anio, valor: nf(h.llamadas) })),
  { anio: ANIO_ACTUAL.value, valor: nf(r.value.llamadas) }
])

const pasos = [
  {
    icono: '☎',
    titulo: 'Llama gratis al 1528',
    texto: 'Marca desde cualquier teléfono para iniciar una consulta personalizada sobre la salud del estudiante.'
  },
  {
    icono: '🩺',
    titulo: 'Habla con el médico',
    texto: 'Si el caso lo requiere, la llamada se traslada a un médico, quien realiza preguntas y evalúa la situación.'
  },
  {
    icono: '🏥',
    titulo: 'Recibe indicaciones y referencia',
    texto: 'Se indica qué hacer, a qué servicio acudir y, en emergencias, se coordina con el servicio de salud más cercano.'
  }
]

const casos = [
  {
    icono: 'stethoscope.png',
    titulo: 'Enfermedades agudas',
    texto: 'Síntomas como fiebre, dolor abdominal, problemas respiratorios, alergias y otros malestares que requieren orientación médica.'
  },
  {
    icono: 'accident.png',
    titulo: 'Accidentes y golpes',
    texto: 'Caídas, golpes y otras lesiones ocurridas en la escuela, el hogar o en el camino, para determinar el nivel de urgencia.'
  },
  {
    icono: 'phone.png',
    titulo: 'Emergencias',
    texto: 'Situaciones que ponen en riesgo la vida o integridad del estudiante, donde se coordina directamente con el servicio de salud más cercano.'
  },
  {
    icono: 'centro.png',
    titulo: 'Dudas sobre a dónde acudir',
    texto: 'Orientación sobre el servicio de salud adecuado según el lugar de residencia y la naturaleza del problema.'
  }
]

const flujo = [
  {
    titulo: 'Llamada inicial',
    texto: 'El padre, madre, tutor o personal educativo llama gratis al 1528 para solicitar orientación por enfermedad o accidente.'
  },
  {
    titulo: 'Evaluación médica',
    texto: 'Un médico escucha el caso, realiza preguntas para identificar la gravedad e indica las acciones inmediatas a seguir.'
  },
  {
    titulo: 'Referencia al servicio de salud',
    texto: 'Se orienta a qué puesto, centro de salud, CAP u hospital acudir, según la situación del estudiante.'
  },
  {
    titulo: 'Coordinación en emergencias',
    texto: 'En casos de emergencia, el personal del 1528 coordina directamente con el servicio de salud más cercano para agilizar la atención.'
  }
]
</script>
