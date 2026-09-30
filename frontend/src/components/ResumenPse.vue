<template>
  <!-- ENCABEZADO -->
  <div class="geo-date-wrap">
    <span class="geo-date-badge">
      {{ r.periodo }}
    </span>
  </div>

  <div class="geo-stats-grid">

    <div class="geo-stat-card">
      <img src="/imagenes/icons/stethoscope.png" class="geo-icon">
      <div class="geo-number">
        {{ nf(r.atenciones) }}
      </div>
      <div class="geo-label">
        Consultas Atendidas
      </div>
    </div>

    <div class="geo-stat-card">
      <img src="/imagenes/icons/students.png" class="geo-icon">
      <div class="geo-number">
        {{ nf(r.estudiantes_atendidos) }}
      </div>
      <div class="geo-label">
        Estudiantes Atendidos
      </div>
    </div>

    <div class="geo-stat-card">
      <img src="/imagenes/icons/female.png" class="geo-icon">
      <div class="geo-number">{{ nf(porcentajeF, 2) }}%</div>
      <div class="geo-label">
        Femenino
      </div>
    </div>

    <div class="geo-stat-card">
      <img src="/imagenes/icons/male.png" class="geo-icon">
      <div class="geo-number">{{ nf(porcentajeM, 2) }}%</div>
      <div class="geo-label">
        Masculino
      </div>
    </div>

  </div>

  <!-- LEYENDA -->
  <div class="geo-note">
    <center><strong>*Consultas Atendidas: </strong> corresponde a la cantidad de veces
      que un mismo estudiante registra más de una atención en el período indicado.</center>
  </div>

  <!-- TÍTULO MORBILIDADES -->
  <SectionTitle>Morbilidades Atendidas</SectionTitle>

  <!-- MORBILIDADES -->
  <div class="geo-morb-grid">

    <div class="geo-morb-card">
      <img src="/imagenes/icons/lungs.png" class="geo-icon">
      <div class="geo-number">
        {{ nf(r.infecciones_respiratorias) }}
      </div>
      <div class="geo-label">
        Infecciones Respiratorias
      </div>
    </div>

    <div class="geo-morb-card">
      <img src="/imagenes/icons/stomach.png" class="geo-icon">
      <div class="geo-number">
        {{ nf(r.enfermedades_gastrointestinales) }}
      </div>
      <div class="geo-label">
        Enfermedades Gastrointestinales
      </div>
    </div>

    <div class="geo-morb-card">
      <img src="/imagenes/icons/accident.png" class="geo-icon">
      <div class="geo-number">
        {{ nf(r.accidentes) }}
      </div>
      <div class="geo-label">
        Accidentes
      </div>
    </div>

    <div class="geo-morb-card">
      <img src="/imagenes/icons/clipboard.png" class="geo-icon">
      <div class="geo-number">
        {{ nf(r.otros) }}
      </div>
      <div class="geo-label">
        Otros
      </div>
    </div>

  </div>

  <!-- DIAGNÓSTICOS Y MEDICAMENTOS -->
  <SectionTitle>Diagnósticos y Medicamentos</SectionTitle>

  <!-- TABLAS -->
  <div class="geo-tables">

    <div v-for="tabla in tablas" :key="tabla.titulo" class="geo-table-card">
      <div class="geo-table-title">
        {{ tabla.titulo }}
      </div>

      <div class="geo-table-scroll">
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>{{ tabla.columna }}</th>
              <th>Cantidad</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="fila in tabla.filas" :key="fila.numero">
              <td>{{ fila.numero }}</td>
              <td>{{ fila.descripcion }}</td>
              <td>{{ nf(fila.cantidad) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>

  <SectionTitle>Llamadas al 1528 y Aportes económicos</SectionTitle>

  <div class="geo-bottom-grid">

    <div class="geo-stat-card">
      <img src="/imagenes/icons/center.png" class="geo-icon">

      <div class="geo-label">
        Llamadas al 1528
      </div>
      <br>
      <div class="geo-number">
        {{ nf(r.llamadas) }}
      </div>
      <br>
      <div class="geo-label">
        {{ etiquetaLlamadas }}
      </div>
    </div>

    <div class="geo-stat-card">
      <img src="/imagenes/icons/ribbon_black.png" class="geo-icon">

      <div class="geo-label">
        Aportes económicos brindados a familias de estudiantes fallecidos
      </div>

      <div class="geo-number">
        {{ nf(r.fallecidos) }}
      </div>

      <hr>

      <div class="geo-label">
        Aporte económico total
      </div>

      <div class="geo-number">
        Q{{ nf(r.monto) }}
      </div>
    </div>

    <div class="geo-stat-card">

      <div class="geo-label">
        {{ tituloSexo }}
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

<script setup>
import { computed } from 'vue'
import SectionTitle from './SectionTitle.vue'
import { nf } from '../format'

const props = defineProps({
  datos: { type: Object, required: true },
  etiquetaLlamadas: { type: String, default: 'Total de llamadas' },
  tituloSexo: { type: String, default: 'Distribución por sexo' }
})

const r = computed(() => props.datos.resumen)

const porcentaje = campo => {
  const total = Number(r.value.estudiantes_atendidos)
  return total ? (Number(r.value[campo]) / total) * 100 : 0
}
const porcentajeF = computed(() => porcentaje('est_atendidos_f'))
const porcentajeM = computed(() => porcentaje('est_atendidos_m'))

const tablas = computed(() => [
  { titulo: 'Diagnósticos recurrentes', columna: 'Diagnóstico', filas: props.datos.diagnosticos },
  { titulo: 'Medicamentos recurrentes', columna: 'Medicamento', filas: props.datos.medicamentos }
])
</script>
