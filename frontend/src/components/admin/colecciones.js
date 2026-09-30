// Formularios y tablas del CRUD genérico del panel.
// Los nombres de campo y las reglas deben coincidir con backend/colecciones.js.
//
// Tipos de campo: texto | textarea | entero | bool | opcion | departamento | imagen | pdf | audio
//   archivo: el tipo de subida depende de otro campo (materiales: pdf o audio)
// ancho: 'completo' ocupa toda la fila del formulario
// importar: habilita la carga masiva (Excel/CSV); el texto explica qué hace (debe coincidir con backend)

import { DEPARTAMENTOS, NACIONAL } from '../../departamentos'

export const OPCIONES_DEPARTAMENTO = [
  { valor: NACIONAL, texto: 'Total nacional' },
  ...Object.entries(DEPARTAMENTOS)
    .map(([valor, texto]) => ({ valor: Number(valor), texto }))
    .sort((a, b) => a.texto.localeCompare(b.texto, 'es'))
]

const n = (nombre, etiqueta) => ({ nombre, etiqueta, tipo: 'entero' })

const listaTopDiez = (singular, plural) => ({
  pk: 'id',
  descripcion: `Los 10 ${plural} más frecuentes de cada departamento (Resultados del Programa y Análisis Geográfico).`,
  filtro: { campo: 'cod_departamento', etiqueta: 'Departamento', opciones: OPCIONES_DEPARTAMENTO, inicial: NACIONAL },
  importar: `Por cada departamento que aparezca en el archivo, su listado de ${plural} se reemplaza completo por el del archivo. Los departamentos que no aparezcan no se modifican.`,
  columnas: [
    { campo: 'numero', etiqueta: 'No.' },
    { campo: 'descripcion', etiqueta: singular, principal: true },
    { campo: 'cantidad', etiqueta: 'Cantidad', formato: 'numero' }
  ],
  campos: [
    { nombre: 'cod_departamento', etiqueta: 'Departamento', tipo: 'departamento' },
    n('numero', 'Posición (No.)'),
    n('cantidad', 'Cantidad'),
    { nombre: 'descripcion', etiqueta: singular, tipo: 'texto', ancho: 'completo' }
  ],
  nuevo: (filtro, filas) => ({
    cod_departamento: filtro,
    numero: Math.max(0, ...filas.map(f => f.numero)) + 1,
    descripcion: '',
    cantidad: 0
  })
})

export const COLECCIONES = {
  resumen: {
    titulo: 'Cifras del año en curso',
    descripcion: 'Una fila por departamento más el total nacional. Alimenta Inicio, Resultados, Multianual (año en curso), Análisis Geográfico, Centro 1528 y Apoyo funerario.',
    pk: 'cod_departamento',
    crear: false,
    eliminar: false,
    importar: 'Actualiza las filas de los departamentos incluidos en el archivo. Puede quitar las columnas que no quiera modificar; no se agregan ni se eliminan departamentos.',
    columnas: [
      { campo: 'departamento', etiqueta: 'Departamento' },
      { campo: 'atenciones', etiqueta: 'Consultas', formato: 'numero' },
      { campo: 'estudiantes_atendidos', etiqueta: 'Estudiantes', formato: 'numero' },
      { campo: 'llamadas', etiqueta: 'Llamadas', formato: 'numero' },
      { campo: 'fallecidos', etiqueta: 'Aportes', formato: 'numero' },
      { campo: 'periodo_corto', etiqueta: 'Período' }
    ],
    campos: [
      { nombre: 'departamento', etiqueta: 'Nombre', tipo: 'texto' },
      { nombre: 'periodo', etiqueta: 'Período (texto largo)', tipo: 'texto', ayuda: 'Ej.: Del 01 de enero al 28 de agosto 2026' },
      { nombre: 'periodo_corto', etiqueta: 'Período (corto)', tipo: 'texto', ayuda: 'Ej.: 01 enero - 28 agosto' },
      n('atenciones', 'Consultas atendidas'),
      n('estudiantes_atendidos', 'Estudiantes atendidos'),
      n('est_atendidos_f', 'Estudiantes (femenino)'),
      n('est_atendidos_m', 'Estudiantes (masculino)'),
      n('infecciones_respiratorias', 'Infecciones respiratorias'),
      n('enfermedades_gastrointestinales', 'Enf. gastrointestinales'),
      n('accidentes', 'Accidentes'),
      n('otros', 'Otros'),
      n('llamadas', 'Llamadas al 1528'),
      n('medicamentos_dispensados', 'Medicamentos dispensados'),
      n('establecimientos_beneficiados', 'Centros educativos beneficiados'),
      n('fallecidos', 'Aportes por fallecimiento'),
      n('fallecidos_f', 'Aportes (femenino)'),
      n('fallecidos_m', 'Aportes (masculino)'),
      n('monto', 'Monto total de aportes (Q)')
    ]
  },

  diagnosticos: { titulo: 'Diagnósticos recurrentes', ...listaTopDiez('Diagnóstico', 'diagnósticos') },

  medicamentos: { titulo: 'Medicamentos recurrentes', ...listaTopDiez('Medicamento', 'medicamentos') },

  historico: {
    titulo: 'Años anteriores',
    descripcion: 'Cifras cerradas de años anteriores para el Análisis Multianual y el Centro 1528. Al cerrar un año, agréguelo aquí y actualice el "Año en curso" en Datos generales.',
    pk: 'anio',
    pkEditable: true,
    importar: 'Actualiza los años que ya existen y agrega los nuevos. No se elimina ningún año.',
    columnas: [
      { campo: 'anio', etiqueta: 'Año' },
      { campo: 'consultas', etiqueta: 'Consultas', formato: 'numero' },
      { campo: 'estudiantes', etiqueta: 'Estudiantes', formato: 'numero' },
      { campo: 'llamadas', etiqueta: 'Llamadas', formato: 'numero' },
      { campo: 'aportes', etiqueta: 'Aportes', formato: 'numero' }
    ],
    campos: [
      n('anio', 'Año'),
      { nombre: 'periodo_inicio', etiqueta: 'Inicio del período', tipo: 'texto', ayuda: 'Ej.: 01 enero' },
      { nombre: 'periodo_fin', etiqueta: 'Fin del período', tipo: 'texto', ayuda: 'Ej.: 31 diciembre' },
      n('consultas', 'Consultas atendidas'),
      n('estudiantes', 'Estudiantes atendidos'),
      n('llamadas', 'Llamadas al 1528'),
      n('infecciones_respiratorias', 'Infecciones respiratorias'),
      n('enfermedades_gastrointestinales', 'Enf. gastrointestinales'),
      n('accidentes', 'Accidentes'),
      n('medicamentos_dispensados', 'Medicamentos dispensados'),
      n('aportes', 'Aportes por fallecimiento'),
      n('monto_aportes', 'Monto total de aportes (Q)'),
      n('aportes_f', 'Aportes (femenino)'),
      n('aportes_m', 'Aportes (masculino)')
    ],
    nuevo: (_, filas) => ({ anio: Math.max(2023, ...filas.map(f => f.anio)) + 1, periodo_inicio: '01 enero', periodo_fin: '31 diciembre' })
  },

  actividades: {
    titulo: 'Actividades de promoción',
    descripcion: 'Tarjetas con fotografía de la página Promoción de la salud.',
    pk: 'id',
    columnas: [
      { campo: 'imagen_url', etiqueta: 'Imagen', formato: 'imagen' },
      { campo: 'titulo', etiqueta: 'Título' },
      { campo: 'orden', etiqueta: 'Orden' },
      { campo: 'activo', etiqueta: 'Estado', formato: 'bool' }
    ],
    campos: [
      { nombre: 'titulo', etiqueta: 'Título', tipo: 'texto', ancho: 'completo' },
      { nombre: 'descripcion', etiqueta: 'Descripción (opcional)', tipo: 'textarea', ancho: 'completo' },
      { nombre: 'imagen_url', etiqueta: 'Fotografía', tipo: 'imagen', ancho: 'completo' },
      n('orden', 'Orden'),
      { nombre: 'activo', etiqueta: 'Visible en el portal', tipo: 'bool' }
    ],
    nuevo: (_, filas) => ({ orden: filas.length + 1, activo: 1 })
  },

  personal: {
    titulo: 'Personal del Centro 1528',
    descripcion: 'Tarjetas de "Personal designado" en la página del Centro de llamadas 1528.',
    pk: 'id',
    columnas: [
      { campo: 'imagen_url', etiqueta: 'Ícono', formato: 'imagen' },
      { campo: 'cantidad', etiqueta: 'Cantidad' },
      { campo: 'titulo', etiqueta: 'Cargo' },
      { campo: 'activo', etiqueta: 'Estado', formato: 'bool' }
    ],
    campos: [
      n('cantidad', 'Cantidad'),
      { nombre: 'titulo', etiqueta: 'Cargo', tipo: 'texto' },
      n('orden', 'Orden'),
      { nombre: 'texto', etiqueta: 'Descripción', tipo: 'textarea', ancho: 'completo' },
      { nombre: 'imagen_url', etiqueta: 'Ícono', tipo: 'imagen', ancho: 'completo' },
      { nombre: 'activo', etiqueta: 'Visible en el portal', tipo: 'bool' }
    ],
    nuevo: (_, filas) => ({ orden: filas.length + 1, activo: 1, imagen_url: '/imagenes/icons/stethoscope.png' })
  },

  materiales: {
    titulo: 'Material educativo',
    descripcion: 'Tarjetas de la página Material Educativo. Tipo audio: botón "Escuchar". Tipo PDF: botones "Ver" y "Descargar".',
    pk: 'id',
    columnas: [
      { campo: 'imagen_url', etiqueta: 'Imagen', formato: 'imagen' },
      { campo: 'titulo', etiqueta: 'Título' },
      { campo: 'tipo', etiqueta: 'Tipo' },
      { campo: 'activo', etiqueta: 'Estado', formato: 'bool' }
    ],
    campos: [
      { nombre: 'titulo', etiqueta: 'Título', tipo: 'texto' },
      { nombre: 'tipo', etiqueta: 'Tipo', tipo: 'opcion', opciones: [{ valor: 'pdf', texto: 'Documento PDF' }, { valor: 'audio', texto: 'Audio (MP3/WAV)' }] },
      { nombre: 'etiqueta_boton', etiqueta: 'Texto del botón', tipo: 'texto', ayuda: 'Ej.: Escuchar Spot, Ver Trifoliar' },
      { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'textarea', ancho: 'completo' },
      { nombre: 'imagen_url', etiqueta: 'Imagen de portada', tipo: 'imagen', ancho: 'completo' },
      { nombre: 'archivo_url', etiqueta: 'Archivo', tipo: 'archivo', segun: 'tipo', ancho: 'completo' },
      n('orden', 'Orden'),
      { nombre: 'activo', etiqueta: 'Visible en el portal', tipo: 'bool' }
    ],
    nuevo: (_, filas) => ({ tipo: 'pdf', orden: filas.length + 1, activo: 1 })
  },

  normativa: {
    titulo: 'Normativa legal',
    descripcion: 'Documentos del recuadro "Normativa legal" (Inicio y Apoyo funerario).',
    pk: 'id',
    columnas: [
      { campo: 'titulo', etiqueta: 'Título' },
      { campo: 'subtitulo', etiqueta: 'Descripción' },
      { campo: 'orden', etiqueta: 'Orden' },
      { campo: 'activo', etiqueta: 'Estado', formato: 'bool' }
    ],
    campos: [
      { nombre: 'titulo', etiqueta: 'Título', tipo: 'texto' },
      { nombre: 'subtitulo', etiqueta: 'Descripción', tipo: 'texto' },
      n('orden', 'Orden'),
      { nombre: 'archivo_url', etiqueta: 'Documento PDF', tipo: 'pdf', ancho: 'completo' },
      { nombre: 'activo', etiqueta: 'Visible en el portal', tipo: 'bool' }
    ],
    nuevo: (_, filas) => ({ orden: filas.length + 1, activo: 1 })
  }
}
