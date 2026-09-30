<template>
  <SiteHeader :con-hero="!$route.meta.sinHero" />
  <router-view />
</template>

<script setup>
import SiteHeader from './components/SiteHeader.vue'
</script>
