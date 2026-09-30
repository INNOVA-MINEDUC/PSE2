<template>
  <main>

    <section class="pse-section">
      <div class="pse-container">

        <SectionTitle>Acceso administrativo</SectionTitle>

        <form class="pse-wide-card adm-login" @submit.prevent="entrar">
          <label class="adm-campo">
            <span>Correo electrónico</span>
            <input v-model.trim="correo" type="email" autocomplete="username" required autofocus>
          </label>

          <label class="adm-campo">
            <span>Contraseña</span>
            <input v-model="clave" type="password" autocomplete="current-password" required>
          </label>

          <p v-if="error" class="adm-error" role="alert">{{ error }}</p>

          <button type="submit" class="pse-btn pse-btn-primary adm-btn-bloque" :disabled="enviando">
            {{ enviando ? 'Ingresando…' : 'Ingresar' }}
          </button>
        </form>

      </div>
    </section>

  </main>

  <FooterLogo />
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SectionTitle from '../components/SectionTitle.vue'
import FooterLogo from '../components/FooterLogo.vue'
import { useAuth } from '../composables/useAuth'

const route = useRoute()
const router = useRouter()
const { iniciarSesion } = useAuth()

const correo = ref('')
const clave = ref('')
const error = ref('')
const enviando = ref(false)

async function entrar() {
  error.value = ''
  enviando.value = true
  try {
    await iniciarSesion(correo.value, clave.value)
    // Solo se redirige a rutas internas del panel
    const destino = String(route.query.redirect || '')
    router.replace(destino.startsWith('/admin') ? destino : '/admin')
  } catch (e) {
    error.value = e.message
    clave.value = ''
  } finally {
    enviando.value = false
  }
}
</script>
