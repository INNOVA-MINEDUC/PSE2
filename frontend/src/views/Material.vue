<template>
  <main>

    <section class="pse-section">
      <div class="pse-container">

        <SectionTitle>Material Educativo</SectionTitle>

        <div class="material-grid">

          <article v-for="m in materiales" :key="m.id" class="material-card">

            <img v-if="m.imagen_url"
                 :src="archivoUrl(m.imagen_url)"
                 :alt="m.titulo"
                 class="material-img">

            <h3>{{ m.titulo }}</h3>

            <p>
              {{ m.descripcion }}
            </p>

            <div class="material-acciones">

              <!-- Audio: un botón para escuchar -->
              <a v-if="m.tipo === 'audio'"
                 :href="archivoUrl(m.archivo_url)"
                 target="_blank"
                 class="pse-btn pse-btn-primary">
                🎧 {{ m.etiqueta_boton || 'Escuchar' }}
              </a>

              <!-- PDF: ver y descargar -->
              <template v-else>
                <a :href="archivoUrl(m.archivo_url)"
                   target="_blank"
                   class="pse-btn pse-btn-primary">
                  👁 {{ m.etiqueta_boton || 'Ver documento' }}
                </a>

                <a :href="archivoUrl(m.archivo_url)"
                   :download="nombreArchivo(m.archivo_url)"
                   class="pse-btn pse-btn-green">
                  ⬇ Descargar
                </a>
              </template>

            </div>

          </article>

        </div>

      </div>
    </section>

  </main>

  <FooterLogo />
</template>

<script setup>
import SectionTitle from '../components/SectionTitle.vue'
import FooterLogo from '../components/FooterLogo.vue'
import { archivoUrl } from '../api'
import { useContenido } from '../composables/useContenido'

const materiales = useContenido('materiales')

const nombreArchivo = url => decodeURIComponent(String(url).split('/').pop())
</script>
