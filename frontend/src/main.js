// Estilos del sitio (Vite les agrega huella de versión: sin caché vieja tras cada despliegue)
import './estilos/portal_pse.css'
import './estilos/botones_portal_pse.css'
import './estilos/modulos_pse.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
