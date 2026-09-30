// Lectura y generación de hojas de cálculo (Excel .xlsx y CSV) para la carga masiva.
import ExcelJS from "exceljs";

export const MAX_FILAS = 5000;

// "Consultas atendidas" / "consultas_atendidas" / " Consultas  Atendidas " -> "consultas_atendidas"
export const normalizar = (texto) =>
  String(texto ?? "")
    .normalize("NFD").replace(/\p{M}/gu, "")
    .trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

// Valor de una celda de ExcelJS como texto plano
function valorCelda(v) {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if ("result" in v) return valorCelda(v.result); // fórmula: se usa el resultado
    if ("richText" in v) return v.richText.map((t) => t.text).join("");
    if ("text" in v) return String(v.text); // hipervínculo
    return "";
  }
  return String(v);
}

// CSV con comillas dobles; separador ; , o tabulador (se detecta en la primera línea)
function leerCsv(texto) {
  texto = texto.replace(/^\uFEFF/, "");
  const primera = texto.slice(0, texto.indexOf("\n") + 1 || undefined);
  const conteo = (s) => primera.split(s).length;
  const sep = [";", ",", "\t"].sort((a, b) => conteo(b) - conteo(a))[0];

  const filas = [];
  let fila = [];
  let celda = "";
  let comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (comillas) {
      if (ch === '"' && texto[i + 1] === '"') { celda += '"'; i++; }
      else if (ch === '"') comillas = false;
      else celda += ch;
    } else if (ch === '"') comillas = true;
    else if (ch === sep) { fila.push(celda); celda = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && texto[i + 1] === "\n") i++;
      fila.push(celda); filas.push(fila); fila = []; celda = "";
    } else celda += ch;
  }
  if (celda !== "" || fila.length) { fila.push(celda); filas.push(fila); }
  return filas;
}

async function leerXlsx(buffer) {
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(buffer);
  // La hoja "Datos" de la plantilla, o la primera del libro
  const hoja = libro.getWorksheet("Datos") || libro.worksheets[0];
  if (!hoja) return [];
  if (hoja.rowCount > MAX_FILAS + 1 || hoja.columnCount > 100) {
    throw new Error(`Hoja demasiado grande (${hoja.rowCount} filas, ${hoja.columnCount} columnas).`);
  }
  const filas = [];
  hoja.eachRow({ includeEmpty: true }, (row, n) => {
    const valores = [];
    for (let c = 1; c <= hoja.columnCount; c++) valores.push(valorCelda(row.getCell(c).value));
    filas[n - 1] = valores;
  });
  return Array.from(filas, (f) => f || []);
}

// Devuelve { columnas: [nombre de campo | null por posición], filas: [{ fila, valores }] }
// "alias" traduce encabezados normalizados (nombre técnico o etiqueta) al nombre de campo.
export async function leerHoja(buffer, alias) {
  const esXlsx = buffer.subarray(0, 4).toString("latin1") === "PK\u0003\u0004";
  const crudas = esXlsx ? await leerXlsx(buffer) : leerCsv(buffer.toString("utf8"));

  const [encabezado = [], ...resto] = crudas;
  const columnas = encabezado.map((h) => alias.get(normalizar(h)) ?? null);
  const desconocidas = encabezado.filter((h, i) => String(h).trim() && !columnas[i]).map((h) => String(h).trim());

  const filas = [];
  resto.forEach((valores, i) => {
    if (!valores.some((v) => String(v).trim() !== "")) return; // fila vacía
    const registro = {};
    columnas.forEach((campo, j) => {
      // Se quita el apóstrofo que generarCsv antepone a textos tipo fórmula
      if (campo) registro[campo] = String(valores[j] ?? "").trim().replace(/^'(?=[=+\-@])/, "");
    });
    filas.push({ fila: i + 2, valores: registro }); // número de fila como en Excel
  });

  return { columnas: columnas.filter(Boolean), desconocidas, filas };
}

// Evita que Excel interprete un texto como fórmula al abrir un CSV
const seguroCsv = (v) => {
  const s = String(v ?? "");
  const t = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

// CSV con BOM y separador ";" (lo abre bien Excel en español)
export function generarCsv(columnas, filas) {
  const lineas = [columnas.join(";"), ...filas.map((f) => columnas.map((c) => seguroCsv(f[c])).join(";"))];
  return Buffer.from("\uFEFF" + lineas.join("\r\n") + "\r\n", "utf8");
}

export async function generarXlsx(titulo, columnas, etiquetas, filas, instrucciones) {
  const libro = new ExcelJS.Workbook();
  libro.creator = "Programa de Salud Escolar";

  const hoja = libro.addWorksheet("Datos", { views: [{ state: "frozen", ySplit: 1 }] });
  hoja.columns = columnas.map((c) => ({
    header: c,
    key: c,
    width: Math.min(45, Math.max(12, c.length + 2, ...filas.map((f) => String(f[c] ?? "").length + 2))),
  }));
  filas.forEach((f) => hoja.addRow(Object.fromEntries(columnas.map((c) => [c, f[c]]))));
  const encabezado = hoja.getRow(1);
  encabezado.font = { bold: true, color: { argb: "FF0C2F67" } };
  encabezado.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4C542" } };
  columnas.forEach((c, i) => { hoja.getCell(1, i + 1).note = etiquetas[c] || c; });

  const ayuda = libro.addWorksheet("Instrucciones");
  ayuda.columns = [{ width: 32 }, { width: 80 }];
  ayuda.addRow([titulo]).font = { bold: true, size: 14, color: { argb: "FF0C2F67" } };
  ayuda.addRow([]);
  instrucciones.forEach((linea) => ayuda.addRow(["", linea]));
  ayuda.addRow([]);
  const cab = ayuda.addRow(["Columna (hoja Datos)", "Contenido"]);
  cab.font = { bold: true };
  columnas.forEach((c) => ayuda.addRow([c, etiquetas[c] || ""]));

  return Buffer.from(await libro.xlsx.writeBuffer());
}
