<template>
  <main>

    <section class="pse-section">
      <div class="pse-container">

        <!-- Análisis Geográfico-->
        <div class="geo-section-title">

          <h2>Análisis Geográfico</h2>

        </div>

        <!-- MAPA GEOGRAFICO -->
        <MapaGuatemala />

        <div v-if="nombreDepartamento" class="geo-section-title">
          <span class="geo-line"></span>
          <h2>{{ nombreDepartamento }}</h2>
          <span class="geo-line"></span>
          <br>
        </div>

        <br>

        <template v-if="datos">
          <ResumenPse
            :datos="datos"
            :etiqueta-llamadas="departamento ? 'Llamadas válidas por persona enferma' : 'Total de llamadas'"
          />

          <GeoBtn v-if="paginaVisible('/material')" to="/material">Ir a Material Educativo</GeoBtn>
        </template>

      </div>
    </section>

  </main>

  <FooterLogo />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MapaGuatemala from '../components/MapaGuatemala.vue'
import { paginaVisible } from '../composables/useVisibilidad'
import ResumenPse from '../components/ResumenPse.vue'
import GeoBtn from '../components/GeoBtn.vue'
import FooterLogo from '../components/FooterLogo.vue'
import { usePse } from '../composables/usePse'
import { DEPARTAMENTOS } from '../departamentos'

const route = useRoute()

// ?departamento=N (código de departamento); cualquier otro valor muestra el total nacional
const departamento = computed(() => parseInt(route.query.departamento, 10) || 0)
const nombreDepartamento = computed(() => DEPARTAMENTOS[departamento.value])

const { datos } = usePse(computed(() => departamento.value || 99))
</script>
