<template>
  <div class="adm-encabezado">
    <div>
      <h2>Videos y documentos</h2>
      <p class="adm-ayuda">Enlaces que se muestran en las páginas de cada módulo. Si un campo queda vacío, esa sección no aparece.</p>
    </div>
  </div>

  <div v-for="m in MODULOS" :key="m.id" class="pse-wide-card adm-form">
    <h2 class="adm-subtitulo">
      {{ m.nombre }}
      <router-link :to="m.ruta" target="_blank" class="adm-link">Ver página</router-link>
    </h2>

    <form v-for="c in m.campos" :key="c.clave" class="adm-recurso" @submit.prevent="guardar(m.id, c.clave)">
      <label class="adm-campo">
        <span>{{ c.nombre }}</span>
        <input
          v-model.trim="valores[`${m.id}.${c.clave}`]"
          type="text"
          :placeholder="c.pdf ? 'https://… o suba un PDF' : 'https://www.youtube.com/watch?v=…'"
        >
      </label>

      <div class="adm-acciones">
        <label v-if="c.pdf" class="pse-btn pse-btn-primary adm-archivo">
          {{ subiendo === `${m.id}.${c.clave}` ? 'Subiendo…' : 'Subir PDF' }}
          <input type="file" accept="application/pdf" :disabled="Boolean(subiendo)" @change="subirPdf($event, m.id, c.clave)">
        </label>
        <button type="submit" class="pse-btn pse-btn-green">Guardar</button>
        <a v-if="guardados[`${m.id}.${c.clave}`]" :href="archivoUrl(guardados[`${m.id}.${c.clave}`])" target="_blank" rel="noopener" class="adm-link">Abrir actual</a>
      </div>

      <p v-if="avisos[`${m.id}.${c.clave}`]" :class="avisos[`${m.id}.${c.clave}`].error ? 'adm-error' : 'adm-ok'" role="status">
        {{ avisos[`${m.id}.${c.clave}`].texto }}
      </p>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { archivoUrl } from '../../api'
import { useAdmin } from '../../composables/useAdmin'

// Debe coincidir con RECURSOS en backend/validacion.js
const MODULOS = [
  {
    id: 'llamadas',
    nombre: 'Centro de llamadas 1528',
    ruta: '/llamadas',
    campos: [{ clave: 'video_url', nombre: 'Video institucional (YouTube)' }]
  },
  {
    id: 'funerario',
    nombre: 'Apoyo funerario',
    ruta: '/apoyo-funerario',
    campos: [
      { clave: 'video_url', nombre: 'Video informativo (YouTube)' },
      { clave: 'folleto_url', nombre: 'Folleto PDF', pdf: true },
      { clave: 'formulario_url', nombre: 'Formulario', pdf: true }
    ]
  }
]

const { admin, subir } = useAdmin()

const valores = reactive({})
const guardados = reactive({})
const avisos = reactive({})
const subiendo = ref('')

async function cargar() {
  const { data } = await admin('/recursos')
  for (const r of data) {
    valores[`${r.modulo}.${r.clave}`] = r.url
    guardados[`${r.modulo}.${r.clave}`] = r.url
  }
}

async function guardar(modulo, clave) {
  const k = `${modulo}.${clave}`
  const url = valores[k] || ''
  try {
    await admin(`/recursos/${modulo}/${clave}`, { metodo: 'PUT', cuerpo: { url } })
    guardados[k] = url
    avisos[k] = { texto: url ? 'Guardado.' : 'Eliminado: la sección ya no se mostrará.' }
  } catch (e) {
    avisos[k] = { texto: e.message, error: true }
  }
}

// Sube el PDF y lo guarda de inmediato
async function subirPdf(evento, modulo, clave) {
  const archivo = evento.target.files[0]
  evento.target.value = ''
  if (!archivo) return
  const k = `${modulo}.${clave}`
  subiendo.value = k
  try {
    valores[k] = await subir('pdf', archivo)
    await guardar(modulo, clave)
  } catch (e) {
    avisos[k] = { texto: e.message, error: true }
  } finally {
    subiendo.value = ''
  }
}

onMounted(() => cargar().catch(() => {}))
</script>
