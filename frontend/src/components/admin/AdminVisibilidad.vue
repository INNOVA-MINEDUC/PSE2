<template>
  <div class="adm-encabezado">
    <div>
      <h2>Visibilidad</h2>
      <p class="adm-ayuda">Oculte páginas, secciones de Inicio o cifras sin borrar su contenido. Puede volver a mostrarlas cuando quiera.</p>
    </div>
  </div>

  <form v-if="form" class="pse-wide-card adm-form" @submit.prevent="guardar">
    <h3 class="adm-subtitulo">Páginas</h3>
    <p class="adm-ayuda">Una página oculta sale del menú y de los accesos de Inicio; si alguien entra por su dirección, vuelve a Inicio.</p>
    <div class="adm-form-grid">
      <label v-for="(nombre, id) in PAGINAS" :key="id" class="adm-check">
        <input v-model="form.paginas[id]" type="checkbox">
        {{ nombre }}
      </label>
    </div>

    <h3 class="adm-subtitulo">Secciones de Inicio</h3>
    <div class="adm-form-grid">
      <label v-for="(nombre, id) in SECCIONES" :key="id" class="adm-check">
        <input v-model="form.secciones[id]" type="checkbox">
        {{ nombre }}
      </label>
    </div>

    <h3 class="adm-subtitulo">Cifras del programa (Inicio)</h3>
    <p class="adm-ayuda">El número sale de "Cifras del programa → Año en curso". Aquí solo se cambia el texto o se oculta la tarjeta.</p>
    <div class="adm-form-grid">
      <div v-for="(defecto, id) in CIFRAS" :key="id" class="adm-campo">
        <label class="adm-check">
          <input v-model="form.cifras[id].visible" type="checkbox">
          Mostrar
        </label>
        <input v-model="form.cifras[id].texto" type="text" maxlength="100" :placeholder="defecto" :aria-label="`Texto de la cifra: ${defecto}`">
        <small>Vacío = "{{ defecto }}"</small>
      </div>
    </div>

    <p v-if="error" class="adm-error" role="alert">{{ error }}</p>
    <p v-if="mensaje" class="adm-ok" role="status">{{ mensaje }}</p>

    <div class="adm-acciones">
      <button type="submit" class="pse-btn pse-btn-green" :disabled="guardando">
        {{ guardando ? 'Guardando…' : 'Guardar' }}
      </button>
    </div>
  </form>
  <p v-else-if="error" class="adm-error" role="alert">{{ error }}</p>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getJson } from '../../api'
import { useAdmin } from '../../composables/useAdmin'
import { fijarVisibilidad } from '../../composables/useVisibilidad'

// Mismas claves que VISIBILIDAD en backend/colecciones.js
const PAGINAS = {
  resultados: 'Resultados del Programa',
  multianual: 'Análisis Multianual',
  geografico: 'Análisis Geográfico',
  promocion: 'Promoción de la salud y noticias',
  llamadas: 'Centro de llamadas 1528',
  'apoyo-funerario': 'Apoyo funerario',
  material: 'Material Educativo'
}

const SECCIONES = {
  acceso: 'Acceso rápido',
  cifras: 'Cifras del programa',
  beneficios: 'Beneficios gratuitos',
  noticias: 'Noticias',
  pasos: 'Pasos para el aporte económico',
  normativa: 'Normativa legal',
  contacto: 'Contacto'
}

const CIFRAS = {
  estudiantes_atendidos: 'Estudiantes atendidos',
  medicamentos_dispensados: 'Medicamentos entregados',
  atenciones: 'Casos atendidos',
  establecimientos_beneficiados: 'Centros educativos beneficiados'
}

const { admin } = useAdmin()

const form = ref(null)
const error = ref('')
const mensaje = ref('')
const guardando = ref(false)

// El texto por defecto se muestra como placeholder: el campo queda vacío si no se ha cambiado
function aFormulario(datos) {
  const cifras = {}
  for (const [id, defecto] of Object.entries(CIFRAS)) {
    const c = datos.cifras?.[id] || {}
    cifras[id] = { visible: c.visible !== false, texto: c.texto && c.texto !== defecto ? c.texto : '' }
  }
  return { paginas: { ...datos.paginas }, secciones: { ...datos.secciones }, cifras }
}

async function guardar() {
  error.value = ''
  mensaje.value = ''
  guardando.value = true
  try {
    const { data } = await admin('/visibilidad', { metodo: 'PUT', cuerpo: form.value })
    fijarVisibilidad(data)
    mensaje.value = 'Visibilidad guardada.'
  } catch (e) {
    error.value = e.message
  } finally {
    guardando.value = false
  }
}

onMounted(async () => {
  try {
    form.value = aFormulario((await getJson('/api/visibilidad')).data)
  } catch (e) {
    error.value = e.message
  }
})
</script>
