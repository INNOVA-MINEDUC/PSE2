<template>
  <router-link :to="`/noticias/${noticia.id}`" class="mod-photo-card mod-noticia-card">
    <img v-if="noticia.imagen_url" :src="archivoUrl(noticia.imagen_url)" :alt="noticia.titulo" loading="lazy">
    <div class="mod-noticia-body">
      <span v-if="noticia.fecha_publicacion" class="mod-noticia-fecha">{{ fechaLarga(noticia.fecha_publicacion) }}</span>
      <h3>{{ noticia.titulo }}</h3>
      <p>{{ noticia.descripcion_corta }}</p>
      <span class="pse-arrow">Leer más →</span>
    </div>
  </router-link>
</template>

<script setup>
import { archivoUrl } from '../api'
import { fechaLarga } from '../format'

defineProps({ noticia: { type: Object, required: true } })
</script>
