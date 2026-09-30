import { pool } from "../db.js";
import { COLECCIONES } from "../colecciones.js";
import { validarCampo, validarRegistro } from "../validacion.js";
import { leerHoja, generarCsv, generarXlsx, normalizar, MAX_FILAS } from "../hojas.js";

const MAX_ERRORES = 100;

const INSTRUCCIONES = {
  actualizar: [
    "Edite los valores en la hoja Datos y suba el archivo en el panel (Carga masiva).",
    "Cada fila se identifica por la primera columna; no la modifique.",
    "Solo se actualizan las filas existentes. Puede quitar columnas que no quiera modificar.",
  ],
  upsert: [
    "Edite o agregue filas en la hoja Datos y suba el archivo en el panel (Carga masiva).",
    "Cada fila se identifica por la primera columna: si ya existe se actualiza, si no, se agrega.",
    "No se eliminan registros que no estén en el archivo.",
  ],
  reemplazar: [
    "Edite o agregue filas en la hoja Datos y suba el archivo en el panel (Carga masiva).",
    "Por cada departamento que aparezca en el archivo se REEMPLAZA su listado completo por el del archivo.",
    "Los departamentos que no aparezcan en el archivo no se modifican.",
  ],
};

const importable = (req, res) => {
  const c = Object.hasOwn(COLECCIONES, req.params.coleccion) ? COLECCIONES[req.params.coleccion] : null;
  if (!c?.importar) {
    res.status(404).json({ error: "Esta colección no admite carga masiva." });
    return null;
  }
  return c;
};

// Columnas del archivo: la llave va primero cuando identifica la fila
const columnasArchivo = (c) =>
  c.importar.modo === "reemplazar" ? Object.keys(c.campos) : [c.pk, ...Object.keys(c.campos).filter((k) => k !== c.pk)];

// Encabezados aceptados: nombre técnico o etiqueta legible (sin tildes ni mayúsculas)
function aliasDe(c) {
  const alias = new Map();
  for (const col of columnasArchivo(c)) {
    alias.set(normalizar(col), col);
    if (c.etiquetas?.[col]) alias.set(normalizar(c.etiquetas[col]), col);
  }
  return alias;
}

// GET /api/admin/c/:coleccion/plantilla?formato=xlsx|csv — plantilla con los datos actuales
export const descargarPlantilla = async (req, res) => {
  const c = importable(req, res);
  if (!c) return;
  const formato = req.query.formato === "csv" ? "csv" : "xlsx";
  const columnas = columnasArchivo(c);
  try {
    const orden = c.importar.grupo ? `\`${c.importar.grupo}\` = 99 DESC, \`${c.importar.grupo}\`, ${c.orden}` : c.orden;
    const [filas] = await pool.query(
      `SELECT ${columnas.map((k) => `\`${k}\``).join(", ")} FROM \`${c.tabla}\` ORDER BY ${orden}`
    );
    const nombre = `${req.params.coleccion}-${new Date().toISOString().slice(0, 10)}.${formato}`;
    const archivo = formato === "csv"
      ? generarCsv(columnas, filas)
      : await generarXlsx(`Carga masiva: ${req.params.coleccion}`, columnas, c.etiquetas || {}, filas, INSTRUCCIONES[c.importar.modo]);

    res.setHeader("Content-Type", formato === "csv"
      ? "text/csv; charset=utf-8"
      : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${nombre}"`);
    res.send(archivo);
  } catch (err) {
    console.error("ERROR descargarPlantilla:", err);
    res.status(500).json({ error: "No se pudo generar la plantilla." });
  }
};

// Valida el archivo completo. Devuelve { operaciones, errores, avisos, cambios }.
async function analizar(c, hoja, conn) {
  const { modo, grupo } = c.importar;
  const errores = [];
  const avisos = [];
  const operaciones = [];
  const cambios = { actualizar: 0, insertar: 0, eliminar: 0 };
  const error = (fila, mensaje) => { if (errores.length < MAX_ERRORES) errores.push({ fila, mensaje }); };

  if (hoja.desconocidas.length) avisos.push(`Columnas ignoradas (no se reconocen): ${hoja.desconocidas.join(", ")}.`);
  if (!hoja.filas.length) errores.push({ fila: null, mensaje: "El archivo no tiene filas con datos." });
  if (hoja.filas.length > MAX_FILAS) {
    errores.push({ fila: null, mensaje: `El archivo supera el máximo de ${MAX_FILAS} filas.` });
    return { operaciones, errores, avisos, cambios };
  }

  const faltantes = (modo === "reemplazar" ? Object.keys(c.campos) : [c.pk]).filter((k) => !hoja.columnas.includes(k));
  if (faltantes.length) {
    errores.push({ fila: null, mensaje: `Faltan columnas obligatorias: ${faltantes.join(", ")}.` });
    return { operaciones, errores, avisos, cambios };
  }

  const pkDef = c.campos[c.pk] || { tipo: "entero", min: 0, requerido: true };
  const [existentes] = modo === "reemplazar" ? [[]] : await conn.query(`SELECT \`${c.pk}\` AS k FROM \`${c.tabla}\``);
  const llaves = new Set(existentes.map((r) => String(r.k)));
  const vistas = new Set();

  if (modo === "reemplazar") {
    // Los grupos válidos son los departamentos de resumen_ejecutivo_pse
    const [deps] = await conn.query("SELECT cod_departamento AS k FROM resumen_ejecutivo_pse");
    const validos = new Set(deps.map((r) => String(r.k)));
    const grupos = new Map();

    for (const { fila, valores } of hoja.filas) {
      const { datos, error: e } = validarRegistro(c.campos, valores);
      if (e) { error(fila, e); continue; }
      if (!validos.has(String(datos[grupo]))) { error(fila, `El código de departamento ${datos[grupo]} no existe.`); continue; }
      const clave = `${datos[grupo]}|${datos.numero}`;
      if (vistas.has(clave)) { error(fila, `Posición ${datos.numero} repetida para el departamento ${datos[grupo]}.`); continue; }
      vistas.add(clave);
      if (!grupos.has(datos[grupo])) grupos.set(datos[grupo], []);
      grupos.get(datos[grupo]).push(datos);
    }

    for (const [valor, registros] of grupos) {
      const [[{ n }]] = await conn.query(`SELECT COUNT(*) AS n FROM \`${c.tabla}\` WHERE \`${grupo}\` = ?`, [valor]);
      cambios.eliminar += n;
      cambios.insertar += registros.length;
      operaciones.push({ tipo: "reemplazar", valor, registros });
    }
    return { operaciones, errores, avisos, cambios };
  }

  // actualizar / upsert: solo se validan las columnas presentes
  const presentes = Object.fromEntries(Object.entries(c.campos).filter(([k]) => k !== c.pk && hoja.columnas.includes(k)));

  for (const { fila, valores } of hoja.filas) {
    const { valor: llave, error: ePk } = validarCampo(c.pk, { ...pkDef, requerido: true }, valores[c.pk]);
    if (ePk) { error(fila, ePk); continue; }
    if (vistas.has(String(llave))) { error(fila, `El identificador ${llave} está repetido en el archivo.`); continue; }
    vistas.add(String(llave));

    if (llaves.has(String(llave))) {
      const { datos, error: e } = validarRegistro(presentes, valores);
      if (e) { error(fila, e); continue; }
      if (Object.keys(datos).length) {
        operaciones.push({ tipo: "actualizar", llave, datos });
        cambios.actualizar++;
      }
    } else if (modo === "upsert") {
      const { datos, error: e } = validarRegistro(c.campos, { ...valores, [c.pk]: llave });
      if (e) { error(fila, e); continue; }
      operaciones.push({ tipo: "insertar", datos });
      cambios.insertar++;
    } else {
      error(fila, `No existe un registro con identificador ${llave}.`);
    }
  }
  return { operaciones, errores, avisos, cambios };
}

// POST /api/admin/c/:coleccion/importar?confirmar=1  (campo "archivo")
// Sin confirmar: solo valida y devuelve la vista previa. Con confirmar: aplica todo en una transacción.
export const importar = async (req, res) => {
  const c = importable(req, res);
  if (!c) return;
  if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo." });

  let hoja;
  try {
    hoja = await leerHoja(req.file.buffer, aliasDe(c));
  } catch (err) {
    console.error("ERROR leerHoja:", err.message);
    return res.status(400).json({ error: "No se pudo leer el archivo. Use Excel (.xlsx) o CSV." });
  }

  const confirmar = req.query.confirmar === "1";
  const conn = await pool.getConnection();
  try {
    const { operaciones, errores, avisos, cambios } = await analizar(c, hoja, conn);
    const resultado = { filas: hoja.filas.length, cambios, errores, avisos, aplicado: false };

    if (!confirmar || errores.length) return res.json({ data: resultado });

    await conn.beginTransaction();
    for (const op of operaciones) {
      if (op.tipo === "actualizar") {
        await conn.query(`UPDATE \`${c.tabla}\` SET ? WHERE \`${c.pk}\` = ?`, [op.datos, op.llave]);
      } else if (op.tipo === "insertar") {
        await conn.query(`INSERT INTO \`${c.tabla}\` SET ?`, [op.datos]);
      } else {
        await conn.query(`DELETE FROM \`${c.tabla}\` WHERE \`${c.importar.grupo}\` = ?`, [op.valor]);
        for (const datos of op.registros) await conn.query(`INSERT INTO \`${c.tabla}\` SET ?`, [datos]);
      }
    }
    await conn.commit();
    res.json({ data: { ...resultado, aplicado: true } });
  } catch (err) {
    await conn.rollback().catch(() => {});
    console.error("ERROR importar:", err);
    res.status(500).json({ error: "Error aplicando la carga masiva. No se guardó ningún cambio." });
  } finally {
    conn.release();
  }
};
