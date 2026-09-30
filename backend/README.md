# Sitio PSE — backend Node

API Express + MySQL (estructura tomada de PSE-FINAL), con login propio para el panel de administración.

## Endpoints públicos

| Endpoint | Descripción |
|---|---|
| `GET /api/pse?departamento=N` | Resumen, diagnósticos y medicamentos (sin parámetro o 99 = nacional) |
| `GET /api/noticias?modulo=&limite=` | Noticias publicadas |
| `GET /api/noticias/:id` | Detalle de una noticia publicada |
| `GET /api/recursos/:modulo` | Enlaces del módulo: `{ video_url, folleto_url, formulario_url }` |
| `GET /api/contenido/:coleccion` | `historico`, `actividades`, `personal`, `materiales`, `normativa` (solo visibles) |
| `GET /api/configuracion` | `{ anio_actual, correo_contacto }` |
| `GET /api/health` | Estado de la API y la base de datos |
| `/uploads/...` | Imágenes y documentos subidos |

## Autenticación y panel (`/admin` en el frontend)

| Endpoint | Descripción |
|---|---|
| `POST /api/auth/login` `{ correo, clave }` | Inicia sesión (cookie `pse_sesion`) |
| `POST /api/auth/logout` | Cierra la sesión y la invalida en BD |
| `GET /api/auth/me` | Usuario de la sesión actual |
| `GET/POST /api/admin/noticias`, `PUT/DELETE /api/admin/noticias/:id` | Noticias (incluye no publicadas) |
| `GET /api/admin/recursos`, `PUT /api/admin/recursos/:modulo/:clave` `{ url }` | Videos y documentos (`url` vacía = quitar) |
| `POST /api/admin/uploads/imagen` | Imagen (campo `archivo`) → WebP, máx. 8 MB |
| `POST /api/admin/uploads/pdf` | PDF (campo `archivo`), máx. 20 MB |
| `POST /api/admin/uploads/audio` | MP3/WAV/OGG (campo `archivo`), máx. 40 MB |
| `GET/POST /api/admin/c/:coleccion`, `PUT/DELETE /api/admin/c/:coleccion/:id` | CRUD genérico (ver abajo) |
| `PUT /api/admin/configuracion` | Datos generales |
| `GET/POST /api/admin/usuarios`, `PUT/DELETE /api/admin/usuarios/:id`, `PUT /api/admin/usuarios/:id/clave` | Usuarios del panel |
| `PUT /api/auth/clave` `{ actual, nueva }` | Cambiar la contraseña propia |

Seguridad:

- Contraseñas con `scrypt` + sal (módulo `crypto` de Node). Mínimo 10 caracteres.
- Sesión en cookie `HttpOnly`, `SameSite=Strict`, `Secure` (salvo `COOKIE_SECURE=false`), 8 horas. En BD solo se guarda el SHA-256 del token; cerrar sesión o cambiar la contraseña la invalida.
- Peticiones que modifican datos rechazan un `Origin` distinto al host.
- Login: 10 intentos fallidos por IP cada 15 minutos; el mensaje de error no revela si el correo existe.
- Subidas: la imagen se reprocesa con `sharp` (un archivo que no es imagen falla); el PDF se valida por su firma `%PDF-`. Nombres de archivo generados por el servidor.
- Al reemplazar o eliminar una imagen/PDF, el archivo anterior se borra de `uploads/`.

### Usuarios administradores

No hay registro desde la web. Se crean (o se les cambia la contraseña) por consola:

```bash
npm run crear-admin -- correo@mineduc.gob.gt "Nombre Apellido"
# En Docker:
docker compose exec pse-backend node scripts/crear-admin.js correo@mineduc.gob.gt "Nombre Apellido"
```

Para desactivar a alguien: `UPDATE usuarios SET activo = 0 WHERE correo = '...'; DELETE FROM sesiones WHERE usuario_id = ...;`

## CRUD genérico

`colecciones.js` define cada colección editable (tabla, llave, campos y sus reglas). El controlador `crud.controller.js` solo lee y escribe lo que está declarado ahí.

| Colección | Tabla | Notas |
|---|---|---|
| `resumen` | `resumen_ejecutivo_pse` | Solo edición (filas por departamento fijas) |
| `diagnosticos`, `medicamentos` | `diagnosticos_pse`, `medicamentos_pse` | Filtro `?filtro=<cod_departamento>` |
| `historico` | `historico_anual` | Años cerrados (Multianual, Centro 1528) |
| `actividades`, `personal`, `materiales`, `normativa` | tablas homónimas | Contenido del portal |

Para agregar otra colección: crear la tabla en `sql/`, declararla en `colecciones.js` y en `frontend/src/components/admin/colecciones.js`.

### Carga masiva (Excel / CSV)

| Endpoint | Descripción |
|---|---|
| `GET /api/admin/c/:coleccion/plantilla?formato=xlsx|csv` | Plantilla con los datos actuales (hoja "Datos" + hoja "Instrucciones") |
| `POST /api/admin/c/:coleccion/importar` (campo `archivo`) | Vista previa: filas, cambios, errores por fila. No guarda nada |
| `POST /api/admin/c/:coleccion/importar?confirmar=1` | Aplica en una transacción (todo o nada) si no hay errores |

| Colección | Modo | Efecto |
|---|---|---|
| `resumen` | actualizar | Modifica los departamentos del archivo; columnas ausentes no se tocan |
| `diagnosticos`, `medicamentos` | reemplazar | Por cada departamento del archivo, reemplaza su listado completo |
| `historico` | upsert | Actualiza años existentes y agrega nuevos |

- Encabezados: nombre técnico de la columna o su etiqueta (sin importar tildes ni mayúsculas).
- CSV: UTF-8, separador `;`, `,` o tabulador (se detecta). La exportación usa `;` con BOM para Excel en español y protege textos tipo fórmula.
- Límites: 5 MB y 5,000 filas. Mismas validaciones que el formulario.

Reglas del panel de usuarios: nadie puede desactivarse ni eliminarse a sí mismo y siempre queda al menos un usuario activo.

## Almacenamiento de archivos (bucket)

Las imágenes, PDF y audios que se suben desde el panel se guardan en el **bucketService** (el mismo microservicio que usa PSE-FINAL) o, en desarrollo, en la carpeta `uploads/`.

| Variable | Valor |
|---|---|
| `STORAGE_DRIVER` | `bucket` o `local`. Vacío: `bucket` si hay `STORAGE_SERVICE_URL` |
| `STORAGE_SERVICE_URL` | URL del bucketService (ej. `https://bucket.dominio/api/files`) |
| `STORAGE_API_KEY` | Llave enviada en la cabecera `X-API-Key` |

- Antes de enviar al bucket se valida el archivo: imágenes reprocesadas a WebP, PDF y audio por su firma.
- En BD se guarda `/api/archivos/<uuid>.<ext>`. El backend hace de proxy (`GET /api/archivos/:key`): el navegador nunca habla con el bucket ni ve la API key.
- El proxy solo acepta llaves con forma `uuid.ext` y solo sirve en línea imágenes, PDF y audio; cualquier otro tipo se descarga como archivo.
- Al reemplazar o eliminar un registro, su archivo anterior se borra del bucket.
- `GET /api/health` informa el estado del almacenamiento. Si el bucket no responde, el portal sigue funcionando (solo fallan subidas y archivos del bucket).

**Pasar archivos existentes al bucket** (los de `uploads/` referenciados en la BD):

```bash
npm run migrar-archivos             # muestra qué se migraría
npm run migrar-archivos -- --aplicar # sube y actualiza la BD (los archivos locales no se borran)
```

**Probar sin el servicio real:** `npm run bucket-simulado` levanta en el puerto 4100 un servicio con la misma API (solo desarrollo; guarda en `.bucket-simulado/`). Luego `STORAGE_DRIVER=bucket`, `STORAGE_SERVICE_URL=http://127.0.0.1:4100`, `STORAGE_API_KEY=clave-local`.

## Base de datos

- Tablas de cifras (`resumen_ejecutivo_pse`, `diagnosticos_pse`, `medicamentos_pse`): se cargan desde `../database/01_datos_pse.sql`.
- `sql/004_datos_administrables.sql` convierte esas tablas a InnoDB/utf8mb4 y les agrega llave primaria.
- Tablas propias del portal (`noticias`, `recursos_modulo`, `usuarios`, `sesiones`, `historico_anual`, `configuracion`, `actividades`, `personal_1528`, `materiales`, `normativa`): `sql/*.sql`, aplicadas con `npm run migrate` (registro en `schema_migrations`).

`sql/002_noticias_ejemplo.sql` crea 3 noticias **de ejemplo**. Antes de producción, bórrelas desde el panel o con:

```sql
DELETE FROM noticias WHERE autor = 'Contenido de ejemplo';
```

## Desarrollo local

Ver el README principal (base de datos con `docker compose --profile local up -d db`, valores de `.env`).

```bash
npm install
npm run migrate
npm run crear-admin -- admin@prueba.local "Admin local"
npm run dev
```
