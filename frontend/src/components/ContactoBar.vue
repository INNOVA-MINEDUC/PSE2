<template>
  <div class="pse-contact-bar">

    <div class="pse-contact-item">
      <div class="pse-contact-icon">☎</div>
      <div>
        <strong>Línea 1528</strong>
        <span>Atención gratuita</span>
      </div>
    </div>

    <div class="pse-contact-item">
      <div class="pse-contact-icon">✉</div>
      <div>
        <strong>{{ config?.correo_contacto }}</strong>
        <span>Correo electrónico</span>
      </div>
    </div>

  </div>
</template>

<script setup>
import { useConfiguracion } from '../composables/useContenido'

const config = useConfiguracion()
</script>
