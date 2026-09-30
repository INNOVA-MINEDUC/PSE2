// Colecciones administrables con el CRUD genérico (/api/admin/c/:coleccion).
// Solo los campos listados aquí se leen o escriben: los nombres de tabla y columna
// nunca vienen de la petición.
//
// Tipos de campo:
//   texto   { max, requerido }      entero { min, requerido }      bool
//   url     archivo subido o ruta del sitio o https (archivo: true => se borra al reemplazar)
//   opcion  { opciones: [...] }
//
// importar: habilita la carga masiva (Excel/CSV). Modos:
//   actualizar  solo modifica filas existentes (por llave); las columnas ausentes no se tocan
//   upsert      actualiza las existentes y agrega las nuevas
//   reemplazar  por cada valor de "grupo" presente en el archivo, borra sus filas y carga las del archivo
// etiquetas: nombre legible de cada columna (hoja de instrucciones de la plantilla)

const entero = { tipo: "entero", min: 0 };

export const COLECCIONES = {
  // Cifras del año en curso por departamento (99 = nacional). Filas fijas: solo edición.
  resumen: {
    tabla: "resumen_ejecutivo_pse",
    pk: "cod_departamento",
    crear: false,
    eliminar: false,
    orden: "cod_departamento = 99 DESC, departamento",
    importar: { modo: "actualizar" },
    etiquetas: {
      cod_departamento: "Código de departamento (99 = total nacional). No modificar.",
      departamento: "Nombre del departamento",
      periodo: "Período, texto largo (ej.: Del 01 de enero al 28 de agosto 2026)",
      periodo_corto: "Período, texto corto (ej.: 01 enero - 28 agosto)",
      atenciones: "Consultas atendidas",
      estudiantes_atendidos: "Estudiantes atendidos",
      est_atendidos_f: "Estudiantes atendidos, femenino",
      est_atendidos_m: "Estudiantes atendidos, masculino",
      infecciones_respiratorias: "Infecciones respiratorias",
      enfermedades_gastrointestinales: "Enfermedades gastrointestinales",
      accidentes: "Accidentes",
      otros: "Otras morbilidades",
      llamadas: "Llamadas al 1528",
      medicamentos_dispensados: "Medicamentos dispensados",
      establecimientos_beneficiados: "Centros educativos beneficiados",
      fallecidos: "Aportes por fallecimiento",
      fallecidos_f: "Aportes por fallecimiento, femenino",
      fallecidos_m: "Aportes por fallecimiento, masculino",
      monto: "Monto total de aportes (Q)",
    },
    campos: {
      departamento: { tipo: "texto", max: 100, requerido: true },
      periodo: { tipo: "texto", max: 50, requerido: true },
      periodo_corto: { tipo: "texto", max: 50, requerido: true },
      atenciones: entero,
      estudiantes_atendidos: entero,
      est_atendidos_f: entero,
      est_atendidos_m: entero,
      infecciones_respiratorias: entero,
      enfermedades_gastrointestinales: entero,
      accidentes: entero,
      otros: entero,
      llamadas: entero,
      medicamentos_dispensados: entero,
      establecimientos_beneficiados: entero,
      fallecidos: entero,
      fallecidos_f: entero,
      fallecidos_m: entero,
      monto: entero,
    },
  },

  diagnosticos: {
    tabla: "diagnosticos_pse",
    pk: "id",
    filtro: "cod_departamento",
    orden: "numero, id",
    importar: { modo: "reemplazar", grupo: "cod_departamento" },
    etiquetas: {
      cod_departamento: "Código de departamento (99 = total nacional)",
      numero: "Posición en el listado (1 a 10)",
      descripcion: "Diagnóstico",
      cantidad: "Cantidad",
    },
    campos: {
      cod_departamento: { tipo: "entero", min: 1, requerido: true },
      numero: { tipo: "entero", min: 1, requerido: true },
      descripcion: { tipo: "texto", max: 255, requerido: true },
      cantidad: entero,
    },
  },

  medicamentos: {
    tabla: "medicamentos_pse",
    pk: "id",
    filtro: "cod_departamento",
    orden: "numero, id",
    importar: { modo: "reemplazar", grupo: "cod_departamento" },
    etiquetas: {
      cod_departamento: "Código de departamento (99 = total nacional)",
      numero: "Posición en el listado (1 a 10)",
      descripcion: "Medicamento",
      cantidad: "Cantidad",
    },
    campos: {
      cod_departamento: { tipo: "entero", min: 1, requerido: true },
      numero: { tipo: "entero", min: 1, requerido: true },
      descripcion: { tipo: "texto", max: 255, requerido: true },
      cantidad: entero,
    },
  },

  historico: {
    tabla: "historico_anual",
    pk: "anio",
    pkEnCampos: true,
    publico: true,
    orden: "anio",
    importar: { modo: "upsert" },
    etiquetas: {
      anio: "Año",
      periodo_inicio: "Inicio del período (ej.: 01 enero)",
      periodo_fin: "Fin del período (ej.: 31 diciembre)",
      consultas: "Consultas atendidas",
      estudiantes: "Estudiantes atendidos",
      llamadas: "Llamadas al 1528",
      infecciones_respiratorias: "Infecciones respiratorias",
      enfermedades_gastrointestinales: "Enfermedades gastrointestinales",
      accidentes: "Accidentes",
      medicamentos_dispensados: "Medicamentos dispensados",
      aportes: "Aportes por fallecimiento",
      monto_aportes: "Monto total de aportes (Q)",
      aportes_f: "Aportes, femenino",
      aportes_m: "Aportes, masculino",
    },
    campos: {
      anio: { tipo: "entero", min: 2000, requerido: true },
      periodo_inicio: { tipo: "texto", max: 50 },
      periodo_fin: { tipo: "texto", max: 50 },
      consultas: entero,
      estudiantes: entero,
      llamadas: entero,
      infecciones_respiratorias: entero,
      enfermedades_gastrointestinales: entero,
      accidentes: entero,
      medicamentos_dispensados: entero,
      aportes: entero,
      monto_aportes: entero,
      aportes_f: entero,
      aportes_m: entero,
    },
  },

  actividades: {
    tabla: "actividades",
    pk: "id",
    publico: true,
    orden: "orden, id",
    campos: {
      titulo: { tipo: "texto", max: 255, requerido: true },
      descripcion: { tipo: "texto", max: 1000 },
      imagen_url: { tipo: "url", archivo: true, requerido: true },
      orden: { tipo: "entero" },
      activo: { tipo: "bool" },
    },
  },

  personal: {
    tabla: "personal_1528",
    pk: "id",
    publico: true,
    orden: "orden, id",
    campos: {
      cantidad: entero,
      titulo: { tipo: "texto", max: 255, requerido: true },
      texto: { tipo: "texto", max: 1000 },
      imagen_url: { tipo: "url", archivo: true },
      orden: { tipo: "entero" },
      activo: { tipo: "bool" },
    },
  },

  materiales: {
    tabla: "materiales",
    pk: "id",
    publico: true,
    orden: "orden, id",
    campos: {
      titulo: { tipo: "texto", max: 255, requerido: true },
      descripcion: { tipo: "texto", max: 1000 },
      imagen_url: { tipo: "url", archivo: true },
      tipo: { tipo: "opcion", opciones: ["pdf", "audio"], requerido: true },
      archivo_url: { tipo: "url", archivo: true, requerido: true },
      etiqueta_boton: { tipo: "texto", max: 100 },
      orden: { tipo: "entero" },
      activo: { tipo: "bool" },
    },
  },

  normativa: {
    tabla: "normativa",
    pk: "id",
    publico: true,
    orden: "orden, id",
    campos: {
      titulo: { tipo: "texto", max: 255, requerido: true },
      subtitulo: { tipo: "texto", max: 255 },
      archivo_url: { tipo: "url", archivo: true, requerido: true },
      orden: { tipo: "entero" },
      activo: { tipo: "bool" },
    },
  },
};

// Datos generales (tabla configuracion, clave/valor)
export const CONFIGURACION = {
  anio_actual: { tipo: "entero", min: 2000, requerido: true },
  correo_contacto: { tipo: "correo", requerido: true },
};
