<template>
  <main>

    <section class="pse-section">
      <div class="pse-container">

        <SectionTitle>Promoción de la salud y prevención de enfermedades</SectionTitle>

        <p class="mod-intro">
          El PSE refuerza las acciones de prevención y promoción de la salud dentro de los centros
          educativos, con el objetivo de mejorar el bienestar de la comunidad estudiantil.
        </p>

        <!-- NOTICIAS -->
        <NoticiasSeccion />

        <!-- ACTIVIDADES -->
        <SectionTitle>Actividades realizadas en los centros educativos</SectionTitle>

        <p class="mod-intro">
          Acciones desarrolladas en centros educativos para fortalecer la prevención, la salud
          integral y el acompañamiento a estudiantes.
        </p>

        <div class="mod-grid-4">
          <article v-for="a in actividades" :key="a.id" class="mod-photo-card">
            <img :src="archivoUrl(a.imagen_url)" :alt="a.titulo" loading="lazy">
            <h3>{{ a.titulo }}</h3>
            <p v-if="a.descripcion" class="mod-photo-texto">{{ a.descripcion }}</p>
          </article>
        </div>

      </div>
    </section>

  </main>

  <FooterLogo />
</template>

<script setup>
import SectionTitle from '../components/SectionTitle.vue'
import FooterLogo from '../components/FooterLogo.vue'
import NoticiasSeccion from '../components/NoticiasSeccion.vue'

import { archivoUrl } from '../api'
import { useContenido } from '../composables/useContenido'

const actividades = useContenido('actividades')
</script>
