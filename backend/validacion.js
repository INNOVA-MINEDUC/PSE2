import { PREFIJO_BUCKET, llaveValida } from "./storage.js";

export const MODULOS = ["general", "promocion", "atencion", "medicamentos", "llamadas", "funerario"];

export const RECURSOS = {
  llamadas: ["video_url"],
  funerario: ["video_url", "folleto_url", "formulario_url"],
};

// URL aceptada: vacía, archivo del bucket (/api/archivos/<uuid>.<ext>), archivo del sitio
// (/uploads, /imagenes, /audio, /documentos) o enlace https externo
export const urlValida = (url) =>
  url === "" ||
  (url.startsWith(PREFIJO_BUCKET) && llaveValida(url.slice(PREFIJO_BUCKET.length))) ||
  (/^\/(uploads|imagenes|audio|documentos)\/[^"'<>\\]+$/.test(url) && !url.includes("..")) ||
  /^https:\/\/[^\s"'<>]+$/.test(url);

const texto = (v, max) => String(v ?? "").trim().slice(0, max);

// Devuelve { datos } o { error }
export function validarNoticia(body = {}) {
  const datos = {
    titulo: texto(body.titulo, 255),
    descripcion_corta: texto(body.descripcion_corta, 1000),
    contenido: texto(body.contenido, 100000),
    imagen_url: texto(body.imagen_url, 1000),
    fecha_publicacion: texto(body.fecha_publicacion, 10) || null,
    modulo: texto(body.modulo, 100) || "general",
    autor: texto(body.autor, 255) || null,
    activo: [false, 0, "0"].includes(body.activo) ? 0 : 1,
    orden: Number.parseInt(body.orden, 10) || 0,
  };

  if (!datos.titulo) return { error: "El título es requerido." };
  if (!MODULOS.includes(datos.modulo)) return { error: "Módulo no válido." };
  if (!urlValida(datos.imagen_url)) return { error: "La URL de la imagen no es válida." };
  if (datos.fecha_publicacion && !/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha_publicacion)) {
    return { error: "La fecha debe tener formato AAAA-MM-DD." };
  }
  return { datos };
}

// Valida un valor según su definición de campo (colecciones.js). Devuelve { valor } o { error }.
export function validarCampo(nombre, def, entrada) {
  const vacio = entrada === undefined || entrada === null || String(entrada).trim() === "";

  switch (def.tipo) {
    case "entero": {
      if (vacio) {
        if (def.requerido) return { error: `El campo "${nombre}" es requerido.` };
        return { valor: 0 };
      }
      const n = Number(String(entrada).replace(/,/g, ""));
      if (!Number.isInteger(n)) return { error: `"${nombre}" debe ser un número entero.` };
      if (def.min !== undefined && n < def.min) return { error: `"${nombre}" debe ser mayor o igual a ${def.min}.` };
      return { valor: n };
    }
    case "bool":
      return { valor: [false, 0, "0", "false"].includes(entrada) ? 0 : 1 };
    case "opcion": {
      const v = String(entrada ?? "");
      if (!def.opciones.includes(v)) return { error: `Valor no válido para "${nombre}".` };
      return { valor: v };
    }
    case "url": {
      const v = texto(entrada, 1000);
      if (!urlValida(v)) return { error: `La URL de "${nombre}" no es válida.` };
      if (!v && def.requerido) return { error: `El campo "${nombre}" es requerido.` };
      return { valor: v };
    }
    case "correo": {
      const v = texto(entrada, 255);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { error: `"${nombre}" debe ser un correo válido.` };
      return { valor: v };
    }
    default: {
      const v = texto(entrada, def.max || 1000);
      if (!v && def.requerido) return { error: `El campo "${nombre}" es requerido.` };
      return { valor: v };
    }
  }
}

// Valida todos los campos de un registro. Devuelve { datos } o { error }.
export function validarRegistro(campos, body = {}) {
  const datos = {};
  for (const [nombre, def] of Object.entries(campos)) {
    const { valor, error } = validarCampo(nombre, def, body[nombre]);
    if (error) return { error };
    datos[nombre] = valor;
  }
  return { datos };
}
