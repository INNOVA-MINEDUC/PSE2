<template>
  <main>

    <section class="pse-section">
      <div class="pse-container">

        <SectionTitle>Resultados del Programa</SectionTitle>

        <GeoBtn>Ir al Análisis Geográfico</GeoBtn>

        <p class="parrafo_alternativo_1">Objetivo del Programa:</p>
        <p class="parrafo_alternativo_1">El programa de Salud Escolar tiene por objeto favorecer la salud y la permanencia de los educandos inscritos en el sistema de educación pública, así como servir de incentivo para incrementar la matrícula escolar a través de la promoción de la salud, Prevención y atención de enfermedades comunes, afecciones derivadas de accidentes, suministro de medicamentos y servicios funerarios.</p>
        <p class="parrafo_alternativo_1">Con ese propósito, los educandos inscritos en el sistema de educación pública son atendidos por personal designado por el Ministerio de Salud Pública y Asistencia Social, según el nivel resolutivo en que presenten servicios de manera integral, de acuerdo con la normativa de salud vigente.</p>

        <br>
        <!-- TABLA DE RESULTADOS PSE -->
        <section v-if="datos" class="pse_resumen" id="reporte_pse">

          <ResumenPse :datos="datos" titulo-sexo="Distribución por sexo." />

          <div class="geo-btn-container">

            <button @click="imprimir" class="geo-btn-pdf">

              <i class="fas fa-file-pdf"></i>

              <span>Descargar Reporte PDF</span>

              <i class="fas fa-download"></i>

            </button>

          </div>

          <GeoBtn>Ir al Análisis Geográfico</GeoBtn>

        </section>

      </div>
    </section>

  </main>

  <FooterLogo />
</template>

<script setup>
import SectionTitle from '../components/SectionTitle.vue'
import GeoBtn from '../components/GeoBtn.vue'
import ResumenPse from '../components/ResumenPse.vue'
import FooterLogo from '../components/FooterLogo.vue'
import { usePse } from '../composables/usePse'

const { datos } = usePse(99)
const imprimir = () => window.print()
</script>
