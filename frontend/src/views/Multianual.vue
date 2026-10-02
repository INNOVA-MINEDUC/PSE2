<template>
  <main>

    <section class="pse-section">
      <div class="pse-container">

        <SectionTitle>Comparativo Multianual</SectionTitle>

        <GeoBtn>Ir al Análisis Geográfico</GeoBtn>

        <br>

        <!-- COMPARATIVO MULTIANUAL PSE -->
        <section v-if="datos && historico && config" class="pse_resumen" id="reporte_pse">

          <!-- ENCABEZADO -->
          <section class="multi-header">

            <span class="multi-badge">
              Comparativo Multianual {{ primerAnio }}-{{ anioActual }}
            </span>

            <h2>Análisis Comparativo {{ primerAnio }}–{{ anioActual }}</h2>

            <p class="multi-texto">
              Evolución de los principales indicadores del Programa de Salud Escolar durante los años {{ listaAnios }}.
            </p>

            <div class="multi-periodos">

              <div v-for="h in historico" :key="h.anio" class="multi-periodo">
                <h3>{{ h.anio }}</h3>
                <span>{{ h.periodo_inicio }}</span>
                <small>{{ h.periodo_fin }}</small>
              </div>

              <div class="multi-periodo">
                <h3>{{ anioActual }}</h3>
                <span>Datos preliminares</span>
                <small> {{ r.periodo_corto }}</small>
              </div>

            </div>

            <p class="multi-nota">
              * Información preliminar sujeta a actualización.
            </p>

          </section>

          <!-- INDICADORES GENERALES -->
          <div class="multi-grid">
            <MultiCard v-for="c in indicadores" :key="c.titulo.join()" v-bind="c" />
          </div>

          <!-- GRÁFICA ESTUDIANTES ATENDIDOS -->
          <div class="grafica-estudiantes">

            <div class="grafica-header">
              <span class="grafica-badge">Indicador multianual</span>

              <h2>Estudiantes Atendidos por Año</h2>

              <p>
                Comparativo de estudiantes atendidos por el Programa de Salud Escolar.
              </p>
            </div>

            <div class="grafica-contenedor">
              <canvas id="graficaEstudiantes" ref="canvas"></canvas>
            </div>

          </div>

          <!-- MORBILIDADES -->
          <div class="multi-section">
            <h2>Morbilidades Atendidas</h2>
          </div>

          <div class="multi-grid_f">
            <MultiCard v-for="c in morbilidades" :key="c.titulo.join()" v-bind="c" />
          </div>

          <!-- DEFUNCIONES Y APORTES -->
          <div class="multi-section">
            <h2>Aportes Económicos</h2>
          </div>

          <div class="multi-grid">

            <MultiCard v-for="c in aportes" :key="c.titulo.join()" v-bind="c" />

            <article class="multi-card">

              <div class="multi-card-header">

                <img src="/imagenes/icons/ribbon_black.png">

                <h3>Distribución <br>por sexo</h3>

              </div>

              <div class="multi-card-body">

                <table class="multi-table multi-table-sexo">

                  <thead>
                    <tr>
                      <th>Año</th>
                      <th>♀</th>
                      <th>♂</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr v-for="fila in sexo" :key="fila[0]">
                      <td>{{ fila[0] }}</td>
                      <td class="sexo-f">{{ fila[1] }}</td>
                      <td class="sexo-m">{{ fila[2] }}</td>
                    </tr>
                  </tbody>

                </table>

              </div>

            </article>

          </div>

        </section>

        <GeoBtn>Ir al Análisis Geográfico</GeoBtn>

      </div>
    </section>

  </main>

  <FooterLogo />
</template>

<script setup>
import { computed, ref, watch, onBeforeUnmount, nextTick } from 'vue'
import Chart from 'chart.js/auto'
import SectionTitle from '../components/SectionTitle.vue'
import GeoBtn from '../components/GeoBtn.vue'
import MultiCard from '../components/MultiCard.vue'
import FooterLogo from '../components/FooterLogo.vue'
import { usePse } from '../composables/usePse'
import { nf } from '../format'
import { useContenido, useConfiguracion } from '../composables/useContenido'

const { datos } = usePse(99)
const r = computed(() => datos.value?.resumen || {})

// Años cerrados (historico_anual) + año en curso (resumen_ejecutivo_pse)
const historico = useContenido('historico')
const config = useConfiguracion()

const anioActual = computed(() => config.value?.anio_actual || '')
const anios = computed(() => [...(historico.value || []).map(h => String(h.anio)), String(anioActual.value)])
const primerAnio = computed(() => anios.value[0])
const listaAnios = computed(() => anios.value.slice(0, -1).join(', ') + ' y ' + anios.value.at(-1))

// campoHistorico: columna de historico_anual; actual: valor del año en curso ya formateado
const card = (icono, titulo, campoHistorico, actual, prefijo = '') => ({
  icono,
  titulo,
  valores: [
    ...(historico.value || []).map(h => [String(h.anio), prefijo + nf(h[campoHistorico])]),
    [String(anioActual.value), prefijo + nf(actual)]
  ]
})

const indicadores = computed(() => [
  card('stethoscope.png', ['Atenciones'], 'consultas', r.value.atenciones),
  card('students.png', ['Estudiantes', 'Atendidos'], 'estudiantes', r.value.estudiantes_atendidos),
  card('center.png', ['Llamadas', 'al 1528'], 'llamadas', r.value.llamadas)
])

const morbilidades = computed(() => [
  card('lungs.png', ['Infecciones', 'Respiratorias'], 'infecciones_respiratorias', r.value.infecciones_respiratorias),
  card('stomach.png', ['Enfermedades', 'Gastrointestinales'], 'enfermedades_gastrointestinales', r.value.enfermedades_gastrointestinales),
  card('accident.png', ['Accidentes'], 'accidentes', r.value.accidentes),
  card('clipboard.png', ['Medicamentos', 'Dispensados'], 'medicamentos_dispensados', r.value.medicamentos_dispensados)
])

const aportes = computed(() => [
  card('ribbon_black.png', ['Aportes económicos', 'brindados a familias de estudiantes fallecidos'], 'aportes', r.value.fallecidos),
  card('ribbon_black.png', ['Total de aportes Económicos', 'a Familias'], 'monto_aportes', r.value.monto, 'Q')
])

const sexo = computed(() => [
  ...(historico.value || []).map(h => [String(h.anio), nf(h.aportes_f), nf(h.aportes_m)]),
  [String(anioActual.value), nf(r.value.fallecidos_f), nf(r.value.fallecidos_m)]
])

// ---------- Gráfica de estudiantes atendidos por año ----------
const canvas = ref(null)
let grafica = null

const mostrarValores = {
  id: 'mostrarValores',
  afterDatasetsDraw(chart) {
    const { ctx } = chart
    ctx.save()
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex)
      meta.data.forEach((bar, index) => {
        const valor = dataset.data[index]
        ctx.fillStyle = '#0B2D5C'
        ctx.font = '800 22px Montserrat'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText(valor.toLocaleString('en-US'), bar.x, bar.y - 8)
      })
    })
    ctx.restore()
  }
}

function dibujarGrafica() {
  grafica?.destroy()
  grafica = new Chart(canvas.value, {
    type: 'bar',
    data: {
      labels: anios.value,
      datasets: [{
        label: 'Estudiantes atendidos',
        data: [
          ...historico.value.map(h => Number(h.estudiantes) || 0),
          parseInt(r.value.estudiantes_atendidos, 10) || 0
        ],
        backgroundColor: '#1B3A6F',
        borderColor: '#1B3A6F',
        borderWidth: 0,
        borderRadius: 10,
        borderSkipped: false,
        categoryPercentage: 0.65,
        barPercentage: 0.75
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 800, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0B2D5C',
          titleFont: { family: 'Montserrat', size: 14, weight: '700' },
          bodyFont: { family: 'Montserrat', size: 13 },
          padding: 12,
          callbacks: {
            label: context => ' ' + context.raw.toLocaleString('en-US') + ' estudiantes'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 1300000,
          border: { display: false },
          grid: { color: '#E8EDF3', drawTicks: false, lineWidth: 1 },
          ticks: {
            color: '#64748B',
            font: { family: 'Montserrat', size: 12, weight: '600' },
            padding: 10,
            callback: value => {
              if (value >= 1000000) return (value / 1000000).toFixed(1) + ' M'
              if (value >= 1000) return (value / 1000).toFixed(0) + ' mil'
              return value
            }
          }
        },
        x: {
          border: { display: false },
          grid: { display: false },
          ticks: {
            color: '#0B2D5C',
            font: { family: 'Montserrat', size: 14, weight: '800' },
            padding: 10
          }
        }
      }
    },
    plugins: [mostrarValores]
  })
}

watch([datos, historico, config], async ([valor, hist, conf]) => {
  if (!valor || !hist || !conf) return
  await nextTick()
  dibujarGrafica()
}, { immediate: true })

onBeforeUnmount(() => grafica?.destroy())
</script>

<style>
/* =========================================
   GRÁFICA ESTUDIANTES ATENDIDOS
   ========================================= */

.grafica-estudiantes {
    background: #ffffff;
    border-radius: 20px;
    padding: 32px 38px 35px;
    margin: 35px 0 45px;
    box-shadow:
        0 10px 30px rgba(0, 0, 0, 0.07);
    border: 1px solid #eef1f5;
}

.grafica-header {
    text-align: center;
    margin-bottom: 15px;
}

.grafica-badge {
    display: inline-block;
    background: #eef4fb;
    color: #1B3A6F;
    font-size: 12px;
    font-weight: 700;
    padding: 7px 16px;
    border-radius: 20px;
    margin-bottom: 8px;
    letter-spacing: 0.2px;
}

.grafica-header h2 {
    color: #0B2D5C;
    font-size: 24px;
    font-weight: 800;
    margin: 5px 0 6px;
}

.grafica-header p {
    color: #64748B;
    font-size: 14px;
    margin: 0;
}

.grafica-contenedor {
    position: relative;
    width: 100%;
    height: 380px;
    margin-top: 15px;
}

#graficaEstudiantes {
    width: 100% !important;
    height: 100% !important;
}
</style>
