<template>
  <div v-if="url" class="mod-video">
    <iframe
      :src="urlEmbed(url)"
      :title="titulo"
      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
      loading="lazy"
    ></iframe>
  </div>
</template>

<script setup>
import { urlEmbed } from '../composables/useRecursos'

defineProps({
  url: { type: String, default: '' },
  titulo: { type: String, default: 'Video institucional' }
})
</script>
