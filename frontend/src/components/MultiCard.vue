<template>
  <article class="multi-card">

    <div class="multi-card-header">

      <img :src="`/imagenes/icons/${icono}`">

      <h3><template v-for="(linea, i) in titulo" :key="i"><br v-if="i">{{ linea }}</template></h3>

    </div>

    <div class="multi-card-body">

      <table class="multi-table">
        <tbody>
          <tr v-for="[anio, valor] in valores" :key="anio">
            <td class="multi-anio">{{ anio }}</td>
            <td class="multi-valor">{{ valor }}</td>
          </tr>
        </tbody>
      </table>

    </div>

  </article>
</template>

<script setup>
defineProps({
  icono: { type: String, required: true },
  titulo: { type: Array, required: true },
  valores: { type: Array, required: true }
})
</script>
