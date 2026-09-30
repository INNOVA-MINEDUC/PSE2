<template>
  <!-- NAVBAR -->
  <header class="pse-navbar">
    <div class="pse-container pse-navbar-inner">
      <img class="pse-mineduc-logo" src="/imagenes/logo-Mineduc.png" alt="Ministerio de Educación">

      <SiteNav />
    </div>
  </header>

  <!-- HERO -->
  <section v-if="conHero" class="pse-hero">
    <div class="pse-container pse-hero-wrap">

      <div class="pse-hero-content">
        <img class="pse-logo" src="/imagenes/logo_pse_fondoazul.png" alt="PSE Programa de Salud Escolar">

        <p>
          Promovemos la salud y el bienestar integral de los estudiantes para apoyar su desarrollo y aprendizaje.
        </p>

        <div class="pse-hero-actions">
          <router-link class="pse-btn pse-btn-primary" to="/resultados">▣ Ver resultados del programa</router-link>
          <router-link class="pse-btn pse-btn-green" to="/multianual">▰ Ver análisis multianual</router-link>
        </div>
      </div>

      <div class="pse-hero-visual">
        <router-link to="/llamadas" class="pse-hero-stat" aria-label="Centro de llamadas 1528">

          <div class="pse-phone-row">
            <div class="pse-stat-icon">☎</div>
            <h2 class="pse-hero-number">1528</h2>
          </div>

          <p class="pse-hero-label">Llamadas y consultas</p>

        </router-link>
      </div>

    </div>
  </section>
</template>

<script setup>
import SiteNav from './SiteNav.vue'

defineProps({ conHero: { type: Boolean, default: true } })
</script>
