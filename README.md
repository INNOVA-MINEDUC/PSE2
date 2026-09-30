# Portal del Programa de Salud Escolar (PSE)

Portal público del PSE (Ministerio de Educación) con panel de administración.

```
.
├── frontend/          Vue 3 + Vite: portal público y panel (/admin). Se sirve con nginx.
├── backend/           API Node (Express + MySQL): datos, login, CRUD, carga masiva, archivos.
├── database/          Datos iniciales (dump de cifras del programa).
└── docker-compose.yml Despliegue (frontend + backend) y MySQL para desarrollo.
```

## Páginas

| Ruta | Contenido |
|---|---|
| `/` | Inicio: accesos, cifras, beneficios, noticias, pasos del aporte, normativa |
| `/resultados` | Resultados del programa (cifras nacionales, diagnósticos, medicamentos) |
| `/multianual` | Análisis multianual (años anteriores + año en curso) |
| `/geografico?departamento=N` | Mapa y cifras por departamento |
| `/promocion` | Promoción de la salud: noticias y actividades |
| `/llamadas` | Centro de llamadas 1528 |
| `/apoyo-funerario` | Apoyo funerario |
| `/material` | Material educativo |
| `/noticias/:id` | Detalle de noticia |
| `/login`, `/admin` | Panel de administración |

Todo el contenido (cifras, noticias, actividades, personal, material, normativa, videos, usuarios) se administra desde `/admin`. Ver `backend/README.md` para el detalle de la API.

## Desarrollo local

Requisitos: Node 22+, Docker.

```bash
# 1. Base de datos (MySQL en 127.0.0.1:3317 con los datos de database/)
docker compose --profile local up -d db

# 2. Backend (http://127.0.0.1:3100)
cd backend
cp .env.example .env          # ver valores de desarrollo abajo
npm install
npm run migrate
npm run crear-admin -- admin@prueba.local "Admin local"
npm run dev

# 3. Frontend (http://127.0.0.1:5173; /api y /uploads se redirigen al backend)
cd ../frontend
npm install
npm run dev
```

Valores de `backend/.env` para desarrollo:

```
PORT=3100
DB_HOST=127.0.0.1
DB_PORT=3317
DB_USER=root
DB_PASSWORD=root
DB_NAME=pse
COOKIE_SECURE=false
STORAGE_DRIVER=local
```

## Producción

1. MySQL externo con los datos de `database/` cargados (o la base existente).
2. `backend/.env` con las credenciales reales, `COOKIE_SECURE=true` y el bucket (`STORAGE_SERVICE_URL`, `STORAGE_API_KEY`).
3. `docker compose up -d --build`
4. `docker compose exec pse-backend node scripts/migrate.js`
5. Crear los usuarios del panel: `docker compose exec pse-backend node scripts/crear-admin.js correo "Nombre"`
6. Publicar el puerto 8089 detrás de HTTPS.

Antes de publicar, borrar las noticias de ejemplo desde el panel (autor "Contenido de ejemplo").
