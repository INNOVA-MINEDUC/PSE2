# Datos iniciales

| Archivo | Contenido |
|---|---|
| `01_datos_pse.sql` | Cifras del programa: `resumen_ejecutivo_pse` (23 filas: 22 departamentos + total nacional, código 99), `diagnosticos_pse` y `medicamentos_pse` (10 por departamento). Exportado de la base original del portal. |

El resto de tablas (noticias, usuarios, contenido del portal, etc.) las crea el backend con `npm run migrate` (`backend/sql/`), que además convierte estas tablas a InnoDB/utf8mb4 y les agrega llave primaria.

En desarrollo, `docker compose --profile local up -d db` carga este directorio automáticamente la primera vez que se crea el volumen `pse-db`. Para empezar de cero:

```bash
docker compose --profile local down -v
docker compose --profile local up -d db
```
