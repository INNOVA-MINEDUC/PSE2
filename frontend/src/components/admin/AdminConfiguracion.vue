<template>
  <div class="adm-encabezado">
    <div>
      <h2>Datos generales</h2>
      <p class="adm-ayuda">Datos usados en varias páginas del portal.</p>
    </div>
  </div>

  <form v-if="form" class="pse-wide-card adm-form" @submit.prevent="guardar">
    <div class="adm-form-grid">
      <label class="adm-campo">
        <span>Año en curso</span>
        <input v-model="form.anio_actual" type="number" min="2000" step="1" required>
        <small>Año de las cifras de "Cifras del año en curso". Se muestra después de los años anteriores en el Análisis Multianual.</small>
      </label>

      <label class="adm-campo">
        <span>Correo de contacto</span>
        <input v-model.trim="form.correo_contacto" type="email" required>
        <small>Aparece en la barra de contacto de Inicio, Centro 1528 y Apoyo funerario.</small>
      </label>
    </div>

    <p v-if="error" class="adm-error" role="alert">{{ error }}</p>
    <p v-if="mensaje" class="adm-ok" role="status">{{ mensaje }}</p>

    <div class="adm-acciones">
      <button type="submit" class="pse-btn pse-btn-green" :disabled="guardando">
        {{ guardando ? 'Guardando…' : 'Guardar' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getJson } from '../../api'
import { useAdmin } from '../../composables/useAdmin'
import { limpiarCacheContenido } from '../../composables/useContenido'

const { admin } = useAdmin()

const form = ref(null)
const error = ref('')
const mensaje = ref('')
const guardando = ref(false)

async function guardar() {
  error.value = ''
  mensaje.value = ''
  guardando.value = true
  try {
    await admin('/configuracion', { metodo: 'PUT', cuerpo: form.value })
    limpiarCacheContenido()
    mensaje.value = 'Datos generales guardados.'
  } catch (e) {
    error.value = e.message
  } finally {
    guardando.value = false
  }
}

onMounted(async () => {
  try {
    form.value = (await getJson('/api/configuracion')).data
  } catch (e) {
    error.value = e.message
  }
})
</script>
