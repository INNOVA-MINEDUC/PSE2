# Frontend (Vue 3 + Vite)

Portal público y panel de administración. Rutas en `src/router.js`; ver el README principal.

```
src/
├── main.js, App.vue, router.js
├── api.js                  Llamadas a la API y URL de archivos subidos
├── format.js               Formato de números y fechas
├── departamentos.js        Códigos de departamento
├── estilos/                CSS del sitio (portal_pse.css es el diseño original; modulos_pse.css, lo agregado)
├── composables/            Datos: cifras (usePse), contenido, noticias, recursos, sesión, panel
├── components/             Piezas del portal (encabezado, menú, mapa, tarjetas…)
│   └── admin/              Panel: CRUD genérico (colecciones.js), noticias, carga masiva, usuarios…
└── views/                  Una vista por página
public/                     Imágenes, audio y PDF fijos del sitio
```

- Los CSS se importan desde `main.js` para que Vite les ponga huella de versión (sin caché vieja tras desplegar).
- El panel (`/login`, `/admin`) se carga en un archivo aparte: no pesa en el portal público.
- Los enlaces del sitio anterior (`index.php`, `nav_*.php`) redirigen a las rutas nuevas.

## Desarrollo

```bash
npm install
npm run dev        # http://127.0.0.1:5173
```

Vite redirige `/api` y `/uploads` a `http://127.0.0.1:3100` (backend). Otro destino: `API_PROXY=http://host:puerto npm run dev`.
Si en producción la API vive en otro dominio: `VITE_API_URL=https://api.dominio npm run build`.

## Producción

`Dockerfile` + `nginx.conf`: nginx sirve el build y hace proxy de `/api` y `/uploads` al contenedor `pse-backend`.
