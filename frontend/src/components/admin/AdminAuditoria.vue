<template>
  <div class="adm-encabezado">
    <div>
      <h2>Auditoría</h2>
      <p class="adm-ayuda">Registro de inicios de sesión y de cada cambio hecho desde el panel: quién, qué y cuándo.</p>
    </div>

    <div class="adm-encabezado-acciones">
      <label class="adm-campo">
        <span>Usuario</span>
        <select v-model="filtros.usuario" @change="buscar">
          <option value="">Todos</option>
          <option v-for="u in opciones.usuarios" :key="u" :value="u">{{ u }}</option>
        </select>
      </label>
      <label class="adm-campo">
        <span>Acción</span>
        <select v-model="filtros.accion" @change="buscar">
          <option value="">Todas</option>
          <option v-for="(texto, valor) in ACCIONES" :key="valor" :value="valor">{{ texto }}</option>
        </select>
      </label>
      <label class="adm-campo">
        <span>Sección</span>
        <select v-model="filtros.entidad" @change="buscar">
          <option value="">Todas</option>
          <option v-for="e in opciones.entidades" :key="e" :value="e">{{ nombreEntidad(e) }}</option>
        </select>
      </label>
      <label class="adm-campo">
        <span>Desde</span>
        <input v-model="filtros.desde" type="date" @change="buscar">
      </label>
      <label class="adm-campo">
        <span>Hasta</span>
        <input v-model="filtros.hasta" type="date" @change="buscar">
      </label>
    </div>
  </div>

  <p v-if="error" class="adm-error" role="alert">{{ error }}</p>

  <div class="geo-table-card adm-tabla">
    <div class="geo-table-scroll">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Usuario</th>
            <th>Acción</th>
            <th>Sección</th>
            <th>Registro</th>
            <th>Detalle</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cargando">
            <td colspan="6" class="adm-vacio">Cargando…</td>
          </tr>
          <tr v-else-if="!filas.length">
            <td colspan="6" class="adm-vacio">No hay eventos.</td>
          </tr>
          <tr v-for="f in filas" :key="f.id">
            <td class="adm-nowrap">{{ f.fecha }}</td>
            <td>{{ f.usuario_correo || '—' }}</td>
            <td class="adm-nowrap">
              <span class="adm-estado" :class="f.accion === 'login_fallido' || f.accion === 'eliminar' ? 'off' : 'on'">
                {{ ACCIONES[f.accion] || f.accion }}
              </span>
            </td>
            <td>{{ nombreEntidad(f.entidad) }}</td>
            <td>{{ f.entidad_id ?? '—' }}</td>
            <td class="adm-auditoria-detalle">
              <ul v-if="lineas(f).length">
                <li v-for="(l, i) in lineas(f)" :key="i"><strong>{{ l.campo }}:</strong> {{ l.texto }}</li>
              </ul>
              <small v-if="f.ip" :title="f.user_agent">IP {{ f.ip }}</small>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div v-if="paginas > 1" class="adm-acciones">
    <button type="button" class="pse-btn pse-btn-primary" :disabled="pagina <= 1" @click="ir(pagina - 1)">‹ Anterior</button>
    <span class="adm-ayuda">Página {{ pagina }} de {{ paginas }} · {{ nf(total) }} eventos</span>
    <button type="button" class="pse-btn pse-btn-primary" :disabled="pagina >= paginas" @click="ir(pagina + 1)">Siguiente ›</button>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { useAdmin } from '../../composables/useAdmin'
import { COLECCIONES } from './colecciones'
import { nf } from '../../format'

const ACCIONES = {
  crear: 'Crear',
  actualizar: 'Modificar',
  eliminar: 'Eliminar',
  importar: 'Carga masiva',
  clave: 'Contraseña',
  login: 'Inicio de sesión',
  login_fallido: 'Acceso fallido',
  logout: 'Cierre de sesión'
}

const ENTIDADES = {
  noticias: 'Noticias',
  recursos: 'Videos y documentos',
  configuracion: 'Datos generales',
  visibilidad: 'Visibilidad',
  usuarios: 'Usuarios',
  sesion: 'Sesión'
}

const { admin } = useAdmin()

const filas = ref([])
const total = ref(0)
const pagina = ref(1)
const porPagina = ref(50)
const cargando = ref(false)
const error = ref('')
const filtros = reactive({ usuario: '', accion: '', entidad: '', desde: '', hasta: '' })
const opciones = reactive({ usuarios: [], entidades: [] })

const paginas = computed(() => Math.max(1, Math.ceil(total.value / porPagina.value)))

const nombreEntidad = e => ENTIDADES[e] || COLECCIONES[e]?.titulo || e

const valor = v => (v === null || v === undefined || v === '' ? '(vacío)' : String(v))

// Detalle legible: cambios campo por campo, o los datos creados/eliminados
function lineas(f) {
  const d = f.detalle
  if (!d) return []
  if (d.cambios) return Object.entries(d.cambios).map(([campo, [a, b]]) => ({ campo, texto: `${valor(a)} → ${valor(b)}` }))
  const datos = d.despues || d.antes
  if (datos) return Object.entries(datos).map(([campo, v]) => ({ campo, texto: valor(v) }))
  return Object.entries(d).map(([campo, v]) => ({ campo, texto: typeof v === 'object' ? JSON.stringify(v) : valor(v) }))
}

async function cargar() {
  cargando.value = true
  error.value = ''
  const query = new URLSearchParams({ pagina: pagina.value })
  for (const [k, v] of Object.entries(filtros)) if (v) query.set(k, v)
  try {
    const r = await admin(`/auditoria?${query}`)
    filas.value = r.data
    total.value = r.total
    porPagina.value = r.porPagina
    Object.assign(opciones, r.filtros)
  } catch (e) {
    error.value = e.message
  } finally {
    cargando.value = false
  }
}

function buscar() {
  pagina.value = 1
  cargar()
}

function ir(p) {
  pagina.value = p
  cargar()
}

onMounted(cargar)
</script>
