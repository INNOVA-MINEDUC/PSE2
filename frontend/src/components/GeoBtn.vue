<template>
  <div class="geo-btn-container">

    <router-link :to="to" class="geo-btn">
      <i class="fas fa-map-marked-alt"></i>

      <span><slot /></span>

      <i class="fas fa-chevron-right"></i>
    </router-link>

  </div>
</template>

<script setup>
defineProps({ to: { type: String, default: '/geografico' } })
</script>
