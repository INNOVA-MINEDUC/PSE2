<template>
  <div class="pse-wide-card adm-form">
    <h2 class="adm-subtitulo">Carga masiva: {{ def.titulo }}</h2>
    <p class="adm-ayuda">{{ def.importar }}</p>

    <!-- PASOS -->
    <ol class="mod-list adm-pasos">
      <li>
        <div>
          <strong>Descargue la plantilla</strong> con los datos actuales.
          <div class="adm-acciones adm-descargas">
            <button type="button" class="adm-accion" :disabled="Boolean(descargando)" @click="descargar('xlsx')">
              {{ descargando === 'xlsx' ? 'Preparando…' : '⬇ Excel (.xlsx)' }}
            </button>
            <button type="button" class="adm-accion" :disabled="Boolean(descargando)" @click="descargar('csv')">
              {{ descargando === 'csv' ? 'Preparando…' : '⬇ CSV' }}
            </button>
          </div>
        </div>
      </li>
      <li>
        <div>
          <strong>Edite los datos en Excel.</strong> No cambie los nombres de la primera fila; la hoja
          "Instrucciones" explica cada columna.
        </div>
      </li>
      <li>
        <div>
          <strong>Suba el archivo</strong> (Excel o CSV, máximo 5 MB). Primero verá una vista previa; nada se guarda hasta que presione "Aplicar cambios".
          <div class="adm-acciones adm-descargas">
            <label class="pse-btn pse-btn-primary adm-archivo">
              {{ analizando ? 'Revisando…' : archivo ? 'Elegir otro archivo' : 'Elegir archivo' }}
              <input
                type="file"
                accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                :disabled="analizando || aplicando"
                @change="elegir"
              >
            </label>
            <span v-if="archivo" class="adm-archivo-nombre">{{ archivo.name }}</span>
          </div>
        </div>
      </li>
    </ol>

    <p v-if="error" class="adm-error" role="alert">{{ error }}</p>

    <!-- VISTA PREVIA -->
    <template v-if="resultado">
      <div class="adm-resumen-carga">
        <div>
          <strong>{{ nf(resultado.filas) }}</strong>
          <span>Filas leídas</span>
        </div>
        <div v-if="resultado.cambios.actualizar">
          <strong>{{ nf(resultado.cambios.actualizar) }}</strong>
          <span>Se actualizarán</span>
        </div>
        <div v-if="resultado.cambios.insertar">
          <strong>{{ nf(resultado.cambios.insertar) }}</strong>
          <span>{{ resultado.cambios.eliminar ? 'Filas nuevas' : 'Se agregarán' }}</span>
        </div>
        <div v-if="resultado.cambios.eliminar">
          <strong>{{ nf(resultado.cambios.eliminar) }}</strong>
          <span>Filas actuales reemplazadas</span>
        </div>
        <div :class="resultado.errores.length ? 'con-errores' : 'sin-errores'">
          <strong>{{ nf(resultado.errores.length) }}{{ resultado.errores.length >= 100 ? '+' : '' }}</strong>
          <span>Errores</span>
        </div>
      </div>

      <p v-for="a in resultado.avisos" :key="a" class="adm-aviso">{{ a }}</p>

      <div v-if="resultado.errores.length" class="geo-table-card adm-tabla">
        <div class="geo-table-title">Corrija estos errores en el archivo y vuelva a subirlo</div>
        <div class="geo-table-scroll adm-errores">
          <table>
            <thead>
              <tr>
                <th>Fila</th>
                <th>Problema</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(e, i) in resultado.errores" :key="i">
                <td class="adm-principal">{{ e.fila ?? '—' }}</td>
                <td>{{ conEtiquetas(e.mensaje) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p v-if="resultado.aplicado" class="adm-ok" role="status">
        Carga aplicada: los datos del portal ya están actualizados.
      </p>
      <p v-else-if="!resultado.errores.length" class="adm-ok" role="status">
        El archivo no tiene errores. Revise el resumen y presione "Aplicar cambios".
      </p>
    </template>

    <div class="adm-acciones">
      <button
        v-if="resultado && !resultado.aplicado"
        type="button"
        class="pse-btn pse-btn-green"
        :disabled="aplicando || resultado.errores.length > 0"
        @click="aplicar"
      >
        {{ aplicando ? 'Aplicando…' : 'Aplicar cambios' }}
      </button>
      <button type="button" class="pse-btn pse-btn-primary" @click="$emit('cerrar')">
        {{ resultado?.aplicado ? 'Volver al listado' : 'Cancelar' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { apiUrl } from '../../api'
import { nf } from '../../format'
import { useAdmin } from '../../composables/useAdmin'

const props = defineProps({
  coleccion: { type: String, required: true },
  def: { type: Object, required: true }
})
const emit = defineEmits(['cerrar', 'aplicado'])

const { admin } = useAdmin()

const archivo = ref(null)
const resultado = ref(null)
const error = ref('')
const descargando = ref('')
const analizando = ref(false)
const aplicando = ref(false)

// Los mensajes del backend nombran columnas ("cantidad"); se muestran con su etiqueta
function conEtiquetas(mensaje) {
  return mensaje.replace(/"(\w+)"/g, (m, nombre) => {
    const campo = props.def.campos.find(c => c.nombre === nombre)
    return campo ? `"${campo.etiqueta}"` : m
  })
}

async function descargar(formato) {
  error.value = ''
  descargando.value = formato
  try {
    const r = await fetch(apiUrl(`/api/admin/c/${props.coleccion}/plantilla?formato=${formato}`), { credentials: 'include' })
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Error ${r.status}`)
    const nombre = /filename="([^"]+)"/.exec(r.headers.get('Content-Disposition') || '')?.[1] || `${props.coleccion}.${formato}`
    const enlace = document.createElement('a')
    enlace.href = URL.createObjectURL(await r.blob())
    enlace.download = nombre
    enlace.click()
    setTimeout(() => URL.revokeObjectURL(enlace.href), 1000)
  } catch (e) {
    error.value = e.message
  } finally {
    descargando.value = ''
  }
}

async function enviar(confirmar) {
  const datos = new FormData()
  datos.append('archivo', archivo.value)
  return (await admin(`/c/${props.coleccion}/importar${confirmar ? '?confirmar=1' : ''}`, { metodo: 'POST', cuerpo: datos })).data
}

async function elegir(evento) {
  const elegido = evento.target.files[0]
  evento.target.value = ''
  if (!elegido) return
  archivo.value = elegido
  resultado.value = null
  error.value = ''
  analizando.value = true
  try {
    resultado.value = await enviar(false)
  } catch (e) {
    error.value = e.message
  } finally {
    analizando.value = false
  }
}

async function aplicar() {
  error.value = ''
  aplicando.value = true
  try {
    resultado.value = await enviar(true)
    if (resultado.value.aplicado) emit('aplicado')
  } catch (e) {
    error.value = e.message
  } finally {
    aplicando.value = false
  }
}
</script>
