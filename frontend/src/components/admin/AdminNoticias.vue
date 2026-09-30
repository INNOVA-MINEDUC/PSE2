<template>
  <!-- FORMULARIO -->
  <form v-if="form" class="pse-wide-card adm-form" @submit.prevent="guardar">
    <h2 class="adm-subtitulo">{{ form.id ? 'Editar noticia' : 'Nueva noticia' }}</h2>

    <label class="adm-campo">
      <span>Título *</span>
      <input v-model="form.titulo" type="text" maxlength="255" required>
    </label>

    <label class="adm-campo">
      <span>Descripción corta</span>
      <textarea v-model="form.descripcion_corta" rows="2" maxlength="1000"></textarea>
      <small>Aparece en la tarjeta de la noticia.</small>
    </label>

    <label class="adm-campo">
      <span>Contenido</span>
      <textarea v-model="form.contenido" rows="10"></textarea>
      <small>Separe los párrafos con una línea en blanco.</small>
    </label>

    <div class="adm-fila">
      <label class="adm-campo">
        <span>Fecha de publicación</span>
        <input v-model="form.fecha_publicacion" type="date">
      </label>

      <label class="adm-campo">
        <span>Módulo</span>
        <select v-model="form.modulo">
          <option v-for="(nombre, id) in MODULOS" :key="id" :value="id">{{ nombre }}</option>
        </select>
      </label>

      <label class="adm-campo">
        <span>Autor</span>
        <input v-model="form.autor" type="text" maxlength="255">
      </label>
    </div>

    <div class="adm-campo">
      <span>Imagen</span>
      <div class="adm-imagen">
        <img v-if="form.imagen_url" :src="archivoUrl(form.imagen_url)" alt="Vista previa">
        <div>
          <label class="pse-btn pse-btn-primary adm-archivo">
            {{ subiendo ? 'Subiendo…' : form.imagen_url ? 'Cambiar imagen' : 'Subir imagen' }}
            <input type="file" accept="image/*" :disabled="subiendo" @change="subirImagen">
          </label>
          <button v-if="form.imagen_url" type="button" class="adm-link" @click="form.imagen_url = ''">Quitar imagen</button>
          <small>JPG, PNG o WebP de hasta 8 MB. Se convierte a WebP automáticamente.</small>
        </div>
      </div>
    </div>

    <label class="adm-check">
      <input v-model="form.activo" type="checkbox">
      <span>Publicada (visible en el portal)</span>
    </label>

    <p v-if="error" class="adm-error" role="alert">{{ error }}</p>

    <div class="adm-acciones">
      <button type="submit" class="pse-btn pse-btn-green" :disabled="guardando || subiendo">
        {{ guardando ? 'Guardando…' : 'Guardar' }}
      </button>
      <button type="button" class="pse-btn pse-btn-primary" @click="cerrarForm">Cancelar</button>
    </div>
  </form>

  <!-- LISTADO -->
  <template v-else>
    <div class="adm-encabezado">
      <div>
        <h2>Noticias</h2>
        <p class="adm-ayuda">{{ noticias.length }} noticia(s). Se muestran en Inicio y en Promoción de la salud; las ocultas no aparecen en el portal.</p>
      </div>
      <button type="button" class="pse-btn pse-btn-green" @click="nueva">+ Nueva noticia</button>
    </div>

    <p v-if="mensaje" class="adm-ok" role="status">{{ mensaje }}</p>
    <p v-if="error" class="adm-error" role="alert">{{ error }}</p>

    <div class="geo-table-card adm-tabla">
      <div class="geo-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Título</th>
              <th>Módulo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!cargando && !noticias.length">
              <td colspan="5" class="adm-vacio">Aún no hay noticias.</td>
            </tr>
            <tr v-for="n in noticias" :key="n.id">
              <td class="adm-nowrap">{{ n.fecha_publicacion || '—' }}</td>
              <td class="adm-principal">{{ n.titulo }}</td>
              <td>{{ MODULOS[n.modulo] || n.modulo }}</td>
              <td>
                <span class="adm-estado" :class="n.activo ? 'on' : 'off'">
                  {{ n.activo ? 'Publicada' : 'Oculta' }}
                </span>
              </td>
              <td class="adm-nowrap">
                <template v-if="porEliminar === n.id">
                  <span class="adm-confirmar">¿Eliminar?</span>
                  <button type="button" class="adm-accion peligro confirmar" @click="eliminar(n)">Sí</button>
                  <button type="button" class="adm-accion" @click="porEliminar = null">No</button>
                </template>
                <template v-else>
                  <button type="button" class="adm-accion" @click="editar(n)">Editar</button>
                  <router-link v-if="n.activo" :to="`/noticias/${n.id}`" class="adm-accion" target="_blank">Ver</router-link>
                  <button type="button" class="adm-accion peligro" @click="porEliminar = n.id">Eliminar</button>
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
import { ref, onMounted } from 'vue'
import { archivoUrl } from '../../api'
import { useAdmin } from '../../composables/useAdmin'

const MODULOS = {
  general: 'General',
  promocion: 'Promoción y prevención',
  atencion: 'Atención a enfermedades',
  medicamentos: 'Suministro de medicamentos',
  llamadas: 'Centro de llamadas 1528',
  funerario: 'Apoyo funerario'
}

const { admin, subir } = useAdmin()

const noticias = ref([])
const cargando = ref(true)
const form = ref(null)
const error = ref('')
const mensaje = ref('')
const guardando = ref(false)
const subiendo = ref(false)
const porEliminar = ref(null)

const hoy = () => new Date().toLocaleDateString('en-CA') // AAAA-MM-DD local

async function cargar() {
  cargando.value = true
  try {
    noticias.value = (await admin('/noticias')).data
  } catch (e) {
    error.value = e.message
  } finally {
    cargando.value = false
  }
}

function nueva() {
  limpiarAvisos()
  form.value = {
    titulo: '', descripcion_corta: '', contenido: '', imagen_url: '',
    fecha_publicacion: hoy(), modulo: 'promocion', autor: '', activo: true
  }
}

function editar(n) {
  limpiarAvisos()
  form.value = { ...n, activo: Boolean(n.activo), autor: n.autor || '', fecha_publicacion: n.fecha_publicacion || '' }
}

function cerrarForm() {
  form.value = null
  error.value = ''
}

function limpiarAvisos() {
  error.value = ''
  mensaje.value = ''
  porEliminar.value = null
}

async function subirImagen(evento) {
  const archivo = evento.target.files[0]
  evento.target.value = ''
  if (!archivo) return
  error.value = ''
  subiendo.value = true
  try {
    form.value.imagen_url = await subir('imagen', archivo)
  } catch (e) {
    error.value = e.message
  } finally {
    subiendo.value = false
  }
}

async function guardar() {
  error.value = ''
  guardando.value = true
  const { id, ...datos } = form.value
  try {
    if (id) await admin(`/noticias/${id}`, { metodo: 'PUT', cuerpo: datos })
    else await admin('/noticias', { metodo: 'POST', cuerpo: datos })
    form.value = null
    mensaje.value = id ? 'Noticia actualizada.' : 'Noticia creada.'
    await cargar()
  } catch (e) {
    error.value = e.message
  } finally {
    guardando.value = false
  }
}

async function eliminar(n) {
  limpiarAvisos()
  try {
    await admin(`/noticias/${n.id}`, { metodo: 'DELETE' })
    mensaje.value = 'Noticia eliminada.'
    await cargar()
  } catch (e) {
    error.value = e.message
  }
}

onMounted(cargar)
</script>
