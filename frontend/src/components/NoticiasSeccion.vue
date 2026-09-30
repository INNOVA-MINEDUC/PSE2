<template>
  <!-- Se oculta completa mientras no haya noticias publicadas -->
  <template v-if="noticias.length">
    <h2 v-if="estiloInicio" class="pse-title">{{ titulo }}</h2>
    <SectionTitle v-else>{{ titulo }}</SectionTitle>

    <div class="mod-noticias-grid">
      <NoticiaCard v-for="n in noticias" :key="n.id" :noticia="n" />
    </div>

    <GeoBtn v-if="verTodas" :to="verTodas">Ver todas las noticias</GeoBtn>
  </template>
</template>

<script setup>
import SectionTitle from './SectionTitle.vue'
import GeoBtn from './GeoBtn.vue'
import NoticiaCard from './NoticiaCard.vue'
import { useNoticias } from '../composables/useNoticias'

const props = defineProps({
  titulo: { type: String, default: 'Noticias y actividades' },
  modulo: { type: String, default: '' },
  limite: { type: Number, default: 0 },
  verTodas: { type: String, default: '' },
  // En Inicio los títulos usan .pse-title en lugar de .geo-section-title
  estiloInicio: { type: Boolean, default: false }
})

const { noticias } = useNoticias({ modulo: props.modulo, limite: props.limite })
</script>
