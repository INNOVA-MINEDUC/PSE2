<template>
  <div class="pse-legal-box">
    <h2 class="pse-legal-title">Normativa legal</h2>

    <p>
      El Programa de Salud Escolar fue creado para beneficiar a los estudiantes del sector público,
      según los acuerdos emitidos por el Ministerio de Educación.
    </p>

    <div class="pse-legal-grid">
      <!-- Colores alternados como en el diseño original -->
      <div
        v-for="(doc, i) in documentos"
        :key="doc.id"
        class="pse-legal-card"
        :class="i % 2 ? 'pse-legal-teal' : 'pse-legal-blue'"
      >
        <div class="pse-pdf-icon">PDF</div>
        <div>
          <h3>{{ doc.titulo }}</h3>
          <p>{{ doc.subtitulo }}</p>
          <a class="pse-download" :href="archivoUrl(doc.archivo_url)">Descargar PDF ⬇</a>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { archivoUrl } from '../api'
import { useContenido } from '../composables/useContenido'

const documentos = useContenido('normativa')
</script>
