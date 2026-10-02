import { pool } from "../db.js";
import { COLECCIONES, CONFIGURACION, VISIBILIDAD } from "../colecciones.js";
import { validarRegistro, validarCampo } from "../validacion.js";
import { borrarSubido } from "../middleware/upload.middleware.js";

const columnas = (c) => [c.pk, ...Object.keys(c.campos).filter((k) => k !== c.pk)].map((k) => `\`${k}\``).join(", ");

// Resuelve la colección de la URL; responde 404 si no existe
function coleccion(req, res, { soloPublica = false } = {}) {
  const c = Object.hasOwn(COLECCIONES, req.params.coleccion) ? COLECCIONES[req.params.coleccion] : null;
  if (!c || (soloPublica && !c.publico)) {
    res.status(404).json({ error: "Colección no encontrada." });
    return null;
  }
  return c;
}

// Borra los archivos subidos que dejaron de usarse
async function limpiarArchivos(c, anterior, nuevo = {}) {
  for (const [nombre, def] of Object.entries(c.campos)) {
    if (def.archivo && anterior[nombre] && anterior[nombre] !== nuevo[nombre]) {
      await borrarSubido(anterior[nombre]);
    }
  }
}

// ---------- Público ----------

// GET /api/contenido/:coleccion  (solo registros activos)
export const listarPublico = async (req, res) => {
  const c = coleccion(req, res, { soloPublica: true });
  if (!c) return;
  try {
    const activo = c.campos.activo ? "WHERE activo = 1" : "";
    const [rows] = await pool.query(`SELECT ${columnas(c)} FROM \`${c.tabla}\` ${activo} ORDER BY ${c.orden}`);
    res.json({ data: rows });
  } catch (err) {
    console.error("ERROR listarPublico:", err);
    res.status(500).json({ error: "Error obteniendo datos." });
  }
};

// GET /api/configuracion
export const leerConfiguracion = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT clave, valor FROM configuracion");
    res.json({ data: Object.fromEntries(rows.filter((r) => CONFIGURACION[r.clave]).map((r) => [r.clave, r.valor])) });
  } catch (err) {
    console.error("ERROR leerConfiguracion:", err);
    res.status(500).json({ error: "Error obteniendo la configuración." });
  }
};

// Completa con los valores por defecto y descarta claves desconocidas
function normalizarVisibilidad(v = {}) {
  const visible = (x) => x !== false && x !== 0 && x !== "0";
  const texto = (x, defecto) => String(x ?? "").trim().slice(0, 100) || defecto;
  return {
    paginas: Object.fromEntries(VISIBILIDAD.paginas.map((k) => [k, visible(v.paginas?.[k])])),
    secciones: Object.fromEntries(VISIBILIDAD.secciones.map((k) => [k, visible(v.secciones?.[k])])),
    cifras: Object.fromEntries(
      Object.entries(VISIBILIDAD.cifras).map(([k, defecto]) => [
        k,
        { visible: visible(v.cifras?.[k]?.visible), texto: texto(v.cifras?.[k]?.texto, defecto) },
      ])
    ),
  };
}

// GET /api/visibilidad
export const leerVisibilidad = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT valor FROM configuracion WHERE clave = 'visibilidad'");
    let guardado = {};
    try {
      guardado = rows.length ? JSON.parse(rows[0].valor) : {};
    } catch {
      console.error("ERROR leerVisibilidad: JSON inválido en configuracion.visibilidad");
    }
    res.json({ data: normalizarVisibilidad(guardado) });
  } catch (err) {
    console.error("ERROR leerVisibilidad:", err);
    res.status(500).json({ error: "Error obteniendo la visibilidad." });
  }
};

// ---------- Administración ----------

// GET /api/admin/c/:coleccion?filtro=valor
export const listar = async (req, res) => {
  const c = coleccion(req, res);
  if (!c) return;
  try {
    let where = "";
    const params = [];
    if (c.filtro && req.query.filtro !== undefined && req.query.filtro !== "") {
      where = `WHERE \`${c.filtro}\` = ?`;
      params.push(req.query.filtro);
    }
    const [rows] = await pool.query(`SELECT ${columnas(c)} FROM \`${c.tabla}\` ${where} ORDER BY ${c.orden}`, params);
    res.json({ data: rows });
  } catch (err) {
    console.error("ERROR listar:", err);
    res.status(500).json({ error: "Error obteniendo datos." });
  }
};

export const crear = async (req, res) => {
  const c = coleccion(req, res);
  if (!c) return;
  if (c.crear === false) return res.status(405).json({ error: "Esta colección no permite agregar registros." });

  const { datos, error } = validarRegistro(c.campos, req.body);
  if (error) return res.status(400).json({ error });

  try {
    const [r] = await pool.query(`INSERT INTO \`${c.tabla}\` SET ?`, [datos]);
    res.status(201).json({ data: { [c.pk]: c.pkEnCampos ? datos[c.pk] : r.insertId } });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Ya existe un registro con ese identificador." });
    console.error("ERROR crear:", err);
    res.status(500).json({ error: "Error guardando el registro." });
  }
};

export const actualizar = async (req, res) => {
  const c = coleccion(req, res);
  if (!c) return;

  // La llave primaria no se cambia al editar
  const campos = Object.fromEntries(Object.entries(c.campos).filter(([k]) => k !== c.pk));
  const { datos, error } = validarRegistro(campos, req.body);
  if (error) return res.status(400).json({ error });

  try {
    const [[anterior]] = await pool.query(
      `SELECT ${columnas(c)} FROM \`${c.tabla}\` WHERE \`${c.pk}\` = ?`,
      [req.params.id]
    );
    if (!anterior) return res.status(404).json({ error: "Registro no encontrado." });

    await pool.query(`UPDATE \`${c.tabla}\` SET ? WHERE \`${c.pk}\` = ?`, [datos, req.params.id]);
    await limpiarArchivos(c, anterior, datos);
    res.json({ ok: true });
  } catch (err) {
    console.error("ERROR actualizar:", err);
    res.status(500).json({ error: "Error guardando el registro." });
  }
};

export const eliminar = async (req, res) => {
  const c = coleccion(req, res);
  if (!c) return;
  if (c.eliminar === false) return res.status(405).json({ error: "Esta colección no permite eliminar registros." });

  try {
    const [[anterior]] = await pool.query(
      `SELECT ${columnas(c)} FROM \`${c.tabla}\` WHERE \`${c.pk}\` = ?`,
      [req.params.id]
    );
    if (!anterior) return res.status(404).json({ error: "Registro no encontrado." });

    await pool.query(`DELETE FROM \`${c.tabla}\` WHERE \`${c.pk}\` = ?`, [req.params.id]);
    await limpiarArchivos(c, anterior);
    res.json({ ok: true });
  } catch (err) {
    console.error("ERROR eliminar:", err);
    res.status(500).json({ error: "Error eliminando el registro." });
  }
};

// PUT /api/admin/configuracion  { anio_actual, correo_contacto }
export const guardarConfiguracion = async (req, res) => {
  const datos = {};
  for (const [clave, def] of Object.entries(CONFIGURACION)) {
    const { valor, error } = validarCampo(clave, def, req.body?.[clave]);
    if (error) return res.status(400).json({ error });
    datos[clave] = String(valor);
  }
  try {
    for (const [clave, valor] of Object.entries(datos)) {
      await pool.query(
        "INSERT INTO configuracion (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)",
        [clave, valor]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("ERROR guardarConfiguracion:", err);
    res.status(500).json({ error: "Error guardando la configuración." });
  }
};

// PUT /api/admin/visibilidad  { paginas, secciones, cifras }
export const guardarVisibilidad = async (req, res) => {
  const datos = normalizarVisibilidad(req.body);
  try {
    await pool.query(
      "INSERT INTO configuracion (clave, valor) VALUES ('visibilidad', ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)",
      [JSON.stringify(datos)]
    );
    res.json({ ok: true, data: datos });
  } catch (err) {
    console.error("ERROR guardarVisibilidad:", err);
    res.status(500).json({ error: "Error guardando la visibilidad." });
  }
};
