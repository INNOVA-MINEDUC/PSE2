<template>
  <main>

    <section class="pse-section">
      <div class="pse-container">

        <template v-if="noticia">
          <SectionTitle>{{ noticia.titulo }}</SectionTitle>

          <div v-if="noticia.fecha_publicacion" class="geo-date-wrap">
            <span class="geo-date-badge">
              {{ fechaLarga(noticia.fecha_publicacion) }}
            </span>
          </div>

          <p v-if="noticia.descripcion_corta" class="mod-intro">
            {{ noticia.descripcion_corta }}
          </p>

          <div class="pse-wide-card mod-articulo">
            <img
              v-if="noticia.imagen_url"
              :src="archivoUrl(noticia.imagen_url)"
              :alt="noticia.titulo"
              class="mod-articulo-img"
            >

            <p v-for="(parrafo, i) in parrafos" :key="i">{{ parrafo }}</p>

            <p v-if="noticia.autor" class="mod-articulo-autor">Publicado por: {{ noticia.autor }}</p>
          </div>
        </template>

        <template v-else-if="error">
          <SectionTitle>Noticia no encontrada</SectionTitle>
          <p class="mod-intro">La noticia que busca no existe o ya no está disponible.</p>
        </template>

        <GeoBtn to="/promocion">Ver todas las noticias</GeoBtn>

      </div>
    </section>

  </main>

  <FooterLogo />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SectionTitle from '../components/SectionTitle.vue'
import GeoBtn from '../components/GeoBtn.vue'
import FooterLogo from '../components/FooterLogo.vue'
import { useNoticia } from '../composables/useNoticias'
import { archivoUrl } from '../api'
import { fechaLarga } from '../format'

const route = useRoute()
const { noticia, error } = useNoticia(computed(() => route.params.id))

// El contenido guarda los párrafos separados por una línea en blanco
const parrafos = computed(() =>
  (noticia.value?.contenido || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
)
</script>
