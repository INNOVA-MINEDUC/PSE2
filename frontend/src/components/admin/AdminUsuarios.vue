<template>
  <!-- FORMULARIO: nuevo usuario / editar / restablecer contraseña -->
  <form v-if="form" class="pse-wide-card adm-form" @submit.prevent="guardar">
    <h2 class="adm-subtitulo">{{ TITULOS[form.modo] }}</h2>

    <div class="adm-form-grid">
      <label v-if="form.modo === 'nuevo'" class="adm-campo">
        <span>Correo electrónico</span>
        <input v-model.trim="form.correo" type="email" autocomplete="off" required>
      </label>
      <p v-else class="adm-campo">
        <span>Correo electrónico</span>
        {{ form.correo }}
      </p>

      <label v-if="form.modo !== 'clave'" class="adm-campo">
        <span>Nombre</span>
        <input v-model.trim="form.nombre" type="text" required>
      </label>

      <label v-if="form.modo !== 'editar'" class="adm-campo">
        <span>{{ form.modo === 'clave' ? 'Nueva contraseña' : 'Contraseña' }}</span>
        <input v-model="form.clave" type="password" autocomplete="new-password" :minlength="CLAVE_MINIMA" required>
        <small>Mínimo {{ CLAVE_MINIMA }} caracteres. Compártala con la persona por un medio seguro.</small>
      </label>

      <label v-if="form.modo === 'editar'" class="adm-check">
        <input v-model="form.activo" type="checkbox" :true-value="1" :false-value="0" :disabled="form.id === usuario?.id">
        <span>Activo (puede iniciar sesión)</span>
      </label>
    </div>

    <p v-if="error" class="adm-error" role="alert">{{ error }}</p>

    <div class="adm-acciones">
      <button type="submit" class="pse-btn pse-btn-green" :disabled="guardando">
        {{ guardando ? 'Guardando…' : 'Guardar' }}
      </button>
      <button type="button" class="pse-btn pse-btn-primary" @click="cerrarForm">Cancelar</button>
    </div>
  </form>

  <template v-else>
    <!-- LISTADO -->
    <div class="adm-encabezado">
      <div>
        <h2>Usuarios</h2>
        <p class="adm-ayuda">Personas que pueden entrar al panel. Todas tienen los mismos permisos.</p>
      </div>
      <button type="button" class="pse-btn pse-btn-green" @click="abrir('nuevo')">+ Nuevo usuario</button>
    </div>

    <p v-if="mensaje" class="adm-ok" role="status">{{ mensaje }}</p>
    <p v-if="error" class="adm-error" role="alert">{{ error }}</p>

    <div class="geo-table-card adm-tabla">
      <div class="geo-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Estado</th>
              <th>Último acceso</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in usuarios" :key="u.id">
              <td class="adm-principal">{{ u.nombre }} <span v-if="u.id === usuario?.id">(usted)</span></td>
              <td>{{ u.correo }}</td>
              <td>
                <span class="adm-estado" :class="u.activo ? 'on' : 'off'">{{ u.activo ? 'Activo' : 'Inactivo' }}</span>
              </td>
              <td class="adm-nowrap">{{ u.ultimo_acceso || '—' }}</td>
              <td class="adm-nowrap">
                <template v-if="porEliminar === u.id">
                  <span class="adm-confirmar">¿Eliminar?</span>
                  <button type="button" class="adm-accion peligro confirmar" @click="eliminar(u)">Sí</button>
                  <button type="button" class="adm-accion" @click="porEliminar = null">No</button>
                </template>
                <template v-else>
                  <button type="button" class="adm-accion" @click="abrir('editar', u)">Editar</button>
                  <button v-if="u.id !== usuario?.id" type="button" class="adm-accion" @click="abrir('clave', u)">Contraseña</button>
                  <button v-if="u.id !== usuario?.id" type="button" class="adm-accion peligro" @click="porEliminar = u.id">Eliminar</button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MI CONTRASEÑA -->
    <form class="pse-wide-card adm-form adm-mi-clave" @submit.prevent="cambiarMiClave">
      <h2 class="adm-subtitulo">Cambiar mi contraseña</h2>

      <div class="adm-form-grid">
        <label class="adm-campo">
          <span>Contraseña actual</span>
          <input v-model="miClave.actual" type="password" autocomplete="current-password" required>
        </label>
        <label class="adm-campo">
          <span>Nueva contraseña</span>
          <input v-model="miClave.nueva" type="password" autocomplete="new-password" :minlength="CLAVE_MINIMA" required>
        </label>
        <label class="adm-campo">
          <span>Repetir nueva contraseña</span>
          <input v-model="miClave.repetir" type="password" autocomplete="new-password" required>
        </label>
      </div>

      <p v-if="miClave.error" class="adm-error" role="alert">{{ miClave.error }}</p>
      <p v-if="miClave.ok" class="adm-ok" role="status">Contraseña actualizada. Se cerraron sus otras sesiones abiertas.</p>

      <div class="adm-acciones">
        <button type="submit" class="pse-btn pse-btn-green">Cambiar contraseña</button>
      </div>
    </form>
  </template>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { solicitar } from '../../api'
import { useAdmin } from '../../composables/useAdmin'
import { useAuth } from '../../composables/useAuth'

const CLAVE_MINIMA = 10
const TITULOS = { nuevo: 'Nuevo usuario', editar: 'Editar usuario', clave: 'Restablecer contraseña' }

const { admin } = useAdmin()
const { usuario } = useAuth()

const usuarios = ref([])
const form = ref(null)
const error = ref('')
const mensaje = ref('')
const guardando = ref(false)
const porEliminar = ref(null)
const miClave = reactive({ actual: '', nueva: '', repetir: '', error: '', ok: false })

async function cargar() {
  try {
    usuarios.value = (await admin('/usuarios')).data
  } catch (e) {
    error.value = e.message
  }
}

function abrir(modo, u = {}) {
  error.value = ''
  mensaje.value = ''
  porEliminar.value = null
  form.value = { modo, id: u.id, correo: u.correo || '', nombre: u.nombre || '', activo: u.activo ?? 1, clave: '' }
}

function cerrarForm() {
  form.value = null
  error.value = ''
}

async function guardar() {
  error.value = ''
  guardando.value = true
  const { modo, id, correo, nombre, activo, clave } = form.value
  try {
    if (modo === 'nuevo') await admin('/usuarios', { metodo: 'POST', cuerpo: { correo, nombre, clave } })
    else if (modo === 'editar') await admin(`/usuarios/${id}`, { metodo: 'PUT', cuerpo: { nombre, activo } })
    else await admin(`/usuarios/${id}/clave`, { metodo: 'PUT', cuerpo: { clave } })
    form.value = null
    mensaje.value = { nuevo: 'Usuario creado.', editar: 'Usuario actualizado.', clave: 'Contraseña restablecida; sus sesiones abiertas se cerraron.' }[modo]
    await cargar()
  } catch (e) {
    error.value = e.message
  } finally {
    guardando.value = false
  }
}

async function eliminar(u) {
  error.value = ''
  mensaje.value = ''
  try {
    await admin(`/usuarios/${u.id}`, { metodo: 'DELETE' })
    porEliminar.value = null
    mensaje.value = 'Usuario eliminado.'
    await cargar()
  } catch (e) {
    error.value = e.message
  }
}

async function cambiarMiClave() {
  miClave.error = ''
  miClave.ok = false
  if (miClave.nueva !== miClave.repetir) {
    miClave.error = 'Las contraseñas nuevas no coinciden.'
    return
  }
  try {
    await solicitar('/api/auth/clave', { metodo: 'PUT', cuerpo: { actual: miClave.actual, nueva: miClave.nueva } })
    Object.assign(miClave, { actual: '', nueva: '', repetir: '', ok: true })
  } catch (e) {
    miClave.error = e.message
  }
}

onMounted(cargar)
</script>
