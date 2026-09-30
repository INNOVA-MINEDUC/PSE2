<template>
  <!-- CARGA MASIVA -->
  <AdminImportar
    v-if="importando"
    :coleccion="coleccion"
    :def="def"
    @aplicado="refrescarPortal"
    @cerrar="cerrarImportar"
  />

  <!-- FORMULARIO -->
  <form v-else-if="form" class="pse-wide-card adm-form" @submit.prevent="guardar">
    <h2 class="adm-subtitulo">{{ editando ? `Editar: ${etiquetaFila(form)}` : `Agregar en ${def.titulo}` }}</h2>

    <div class="adm-form-grid">
      <template v-for="c in def.campos" :key="c.nombre">

        <!-- Casilla -->
        <label v-if="c.tipo === 'bool'" class="adm-check" :class="{ completo: c.ancho === 'completo' }">
          <input v-model="form[c.nombre]" type="checkbox" :true-value="1" :false-value="0">
          <span>{{ c.etiqueta }}</span>
        </label>

        <!-- Archivo (imagen, pdf, audio) -->
        <div v-else-if="tipoArchivo(c)" class="adm-campo" :class="{ completo: c.ancho === 'completo' }">
          <span>{{ c.etiqueta }}</span>
          <div class="adm-imagen">
            <img v-if="tipoArchivo(c) === 'imagen' && form[c.nombre]" :src="archivoUrl(form[c.nombre])" alt="Vista previa">
            <div class="adm-archivo-datos">
              <input v-model.trim="form[c.nombre]" type="text" placeholder="Suba un archivo o pegue un enlace https://">
              <div class="adm-acciones">
                <label class="pse-btn pse-btn-primary adm-archivo">
                  {{ subiendo === c.nombre ? 'Subiendo…' : ETIQUETA_SUBIR[tipoArchivo(c)] }}
                  <input type="file" :accept="ACEPTA[tipoArchivo(c)]" :disabled="Boolean(subiendo)" @change="subirArchivo($event, c)">
                </label>
                <a v-if="form[c.nombre] && tipoArchivo(c) !== 'imagen'" :href="archivoUrl(form[c.nombre])" target="_blank" rel="noopener" class="adm-link">Abrir</a>
              </div>
              <small>{{ AYUDA_ARCHIVO[tipoArchivo(c)] }}</small>
            </div>
          </div>
        </div>

        <!-- Resto de campos -->
        <label v-else class="adm-campo" :class="{ completo: c.ancho === 'completo' }">
          <span>{{ c.etiqueta }}</span>

          <textarea v-if="c.tipo === 'textarea'" v-model="form[c.nombre]" rows="3"></textarea>

          <select v-else-if="c.tipo === 'opcion'" v-model="form[c.nombre]">
            <option v-for="o in c.opciones" :key="o.valor" :value="o.valor">{{ o.texto }}</option>
          </select>

          <select v-else-if="c.tipo === 'departamento'" v-model.number="form[c.nombre]">
            <option v-for="o in OPCIONES_DEPARTAMENTO" :key="o.valor" :value="o.valor">{{ o.texto }}</option>
          </select>

          <input
            v-else-if="c.tipo === 'entero'"
            v-model="form[c.nombre]"
            type="number"
            step="1"
            :disabled="editando && c.nombre === def.pk"
          >

          <input v-else v-model="form[c.nombre]" type="text">

          <small v-if="c.ayuda">{{ c.ayuda }}</small>
        </label>

      </template>
    </div>

    <p v-if="error" class="adm-error" role="alert">{{ error }}</p>

    <div class="adm-acciones">
      <button type="submit" class="pse-btn pse-btn-green" :disabled="guardando || Boolean(subiendo)">
        {{ guardando ? 'Guardando…' : 'Guardar' }}
      </button>
      <button type="button" class="pse-btn pse-btn-primary" @click="cerrarForm">Cancelar</button>
    </div>
  </form>

  <!-- LISTADO -->
  <template v-else>
    <div class="adm-encabezado">
      <div>
        <h2>{{ def.titulo }}</h2>
        <p class="adm-ayuda">{{ def.descripcion }}</p>
      </div>

      <div class="adm-encabezado-acciones">
        <label v-if="def.filtro" class="adm-campo adm-filtro">
          <span>{{ def.filtro.etiqueta }}</span>
          <select v-model.number="filtro" @change="cargar">
            <option v-for="o in def.filtro.opciones" :key="o.valor" :value="o.valor">{{ o.texto }}</option>
          </select>
        </label>

        <button v-if="def.importar" type="button" class="pse-btn pse-btn-primary" @click="abrirImportar">⇪ Carga masiva</button>
        <button v-if="def.crear !== false" type="button" class="pse-btn pse-btn-green" @click="nuevo">+ Agregar</button>
      </div>
    </div>

    <p v-if="mensaje" class="adm-ok" role="status">{{ mensaje }}</p>
    <p v-if="error" class="adm-error" role="alert">{{ error }}</p>

    <div class="geo-table-card adm-tabla">
      <div class="geo-table-scroll">
        <table>
          <thead>
            <tr>
              <th v-for="col in def.columnas" :key="col.campo">{{ col.etiqueta }}</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="cargando">
              <td :colspan="def.columnas.length + 1" class="adm-vacio">Cargando…</td>
            </tr>
            <tr v-else-if="!filas.length">
              <td :colspan="def.columnas.length + 1" class="adm-vacio">No hay registros.</td>
            </tr>
            <tr v-for="fila in filas" :key="fila[def.pk]">
              <td v-for="col in def.columnas" :key="col.campo" :class="{ 'adm-principal': col.campo === principal }">
                <img v-if="col.formato === 'imagen' && fila[col.campo]" :src="archivoUrl(fila[col.campo])" alt="" class="adm-miniatura">
                <span v-else-if="col.formato === 'bool'" class="adm-estado" :class="fila[col.campo] ? 'on' : 'off'">
                  {{ fila[col.campo] ? 'Visible' : 'Oculto' }}
                </span>
                <template v-else-if="col.formato === 'numero'">{{ nf(fila[col.campo]) }}</template>
                <template v-else>{{ fila[col.campo] }}</template>
              </td>
              <td class="adm-nowrap">
                <template v-if="porEliminar === fila[def.pk]">
                  <span class="adm-confirmar">¿Eliminar?</span>
                  <button type="button" class="adm-accion peligro confirmar" @click="eliminar(fila)">Sí</button>
                  <button type="button" class="adm-accion" @click="porEliminar = null">No</button>
                </template>
                <template v-else>
                  <button type="button" class="adm-accion" @click="editar(fila)">Editar</button>
                  <button v-if="def.eliminar !== false" type="button" class="adm-accion peligro" @click="porEliminar = fila[def.pk]">Eliminar</button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { archivoUrl } from '../../api'
import { nf } from '../../format'
import { useAdmin } from '../../composables/useAdmin'
import { limpiarCacheContenido } from '../../composables/useContenido'
import { limpiarCachePse } from '../../composables/usePse'
import { COLECCIONES, OPCIONES_DEPARTAMENTO } from './colecciones'
import AdminImportar from './AdminImportar.vue'

const props = defineProps({ coleccion: { type: String, required: true } })
const def = computed(() => COLECCIONES[props.coleccion])

const ACEPTA = { imagen: 'image/*', pdf: 'application/pdf', audio: 'audio/mpeg,audio/wav,audio/x-wav,audio/ogg' }
const ETIQUETA_SUBIR = { imagen: 'Subir imagen', pdf: 'Subir PDF', audio: 'Subir audio' }
const AYUDA_ARCHIVO = {
  imagen: 'JPG, PNG o WebP de hasta 8 MB. Se convierte a WebP automáticamente.',
  pdf: 'PDF de hasta 20 MB.',
  audio: 'MP3, WAV u OGG de hasta 40 MB.'
}

const { admin, subir } = useAdmin()

const filas = ref([])
const cargando = ref(true)
const filtro = ref(def.value.filtro?.inicial ?? '')
const form = ref(null)
const editando = ref(false)
const error = ref('')
const mensaje = ref('')
const guardando = ref(false)
const subiendo = ref('')
const porEliminar = ref(null)
const importando = ref(false)

// 'imagen' | 'pdf' | 'audio' si el campo es de archivo; null en otro caso
function tipoArchivo(c) {
  if (c.tipo === 'archivo') return form.value?.[c.segun] === 'audio' ? 'audio' : 'pdf'
  return ['imagen', 'pdf', 'audio'].includes(c.tipo) ? c.tipo : null
}

// Columna de texto que identifica el registro (se resalta en la tabla)
const principal = computed(() => (def.value.columnas.find(col => col.principal) || def.value.columnas.find(col => !col.formato) || def.value.columnas[0]).campo)

function etiquetaFila(fila) {
  return fila[principal.value] ?? fila[def.value.pk]
}

async function cargar() {
  cargando.value = true
  limpiarAvisos()
  try {
    const q = def.value.filtro ? `?filtro=${encodeURIComponent(filtro.value)}` : ''
    filas.value = (await admin(`/c/${props.coleccion}${q}`)).data
  } catch (e) {
    error.value = e.message
  } finally {
    cargando.value = false
  }
}

function limpiarAvisos() {
  error.value = ''
  mensaje.value = ''
  porEliminar.value = null
}

function vacio() {
  const base = {}
  for (const c of def.value.campos) base[c.nombre] = c.tipo === 'entero' ? 0 : c.tipo === 'bool' ? 1 : ''
  return base
}

function nuevo() {
  limpiarAvisos()
  editando.value = false
  form.value = { ...vacio(), ...(def.value.nuevo?.(filtro.value, filas.value) || {}) }
}

function editar(fila) {
  limpiarAvisos()
  editando.value = true
  form.value = { ...vacio(), ...fila }
}

function cerrarForm() {
  form.value = null
  error.value = ''
}

async function subirArchivo(evento, campo) {
  const archivo = evento.target.files[0]
  evento.target.value = ''
  if (!archivo) return
  error.value = ''
  subiendo.value = campo.nombre
  try {
    form.value[campo.nombre] = await subir(tipoArchivo(campo), archivo)
  } catch (e) {
    error.value = e.message
  } finally {
    subiendo.value = ''
  }
}

// El backend nombra los campos por su columna ("titulo"); se muestran con su etiqueta
function mensajeError(e) {
  return e.message.replace(/"(w+)"/g, (m, nombre) => {
    const campo = def.value.campos.find(c => c.nombre === nombre)
    return campo ? `"${campo.etiqueta}"` : m
  })
}

function abrirImportar() {
  limpiarAvisos()
  importando.value = true
}

// Al volver de la carga masiva se recarga el listado (pudo haber cambiado)
function cerrarImportar() {
  importando.value = false
  cargar()
}

function refrescarPortal() {
  limpiarCacheContenido()
  limpiarCachePse()
}

async function guardar() {
  error.value = ''
  guardando.value = true
  const id = form.value[def.value.pk]
  try {
    if (editando.value) {
      await admin(`/c/${props.coleccion}/${encodeURIComponent(id)}`, { metodo: 'PUT', cuerpo: form.value })
    } else {
      await admin(`/c/${props.coleccion}`, { metodo: 'POST', cuerpo: form.value })
    }
    refrescarPortal()
    form.value = null
    await cargar()
    mensaje.value = editando.value ? 'Cambios guardados.' : 'Registro agregado.'
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    guardando.value = false
  }
}

async function eliminar(fila) {
  limpiarAvisos()
  try {
    await admin(`/c/${props.coleccion}/${encodeURIComponent(fila[def.value.pk])}`, { metodo: 'DELETE' })
    refrescarPortal()
    await cargar()
    mensaje.value = 'Registro eliminado.'
  } catch (e) {
    error.value = e.message
  }
}

onMounted(cargar)
</script>
