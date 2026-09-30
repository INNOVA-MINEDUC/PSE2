import { pool } from "../db.js";

const NACIONAL = 99;

// Resumen, diagnósticos y medicamentos de un departamento (99 = nacional).
export const getResumen = async (req, res) => {
  let departamento = Number.parseInt(req.query.departamento, 10);
  if (!(departamento > 0)) departamento = NACIONAL;

  try {
    const [[resumen]] = await pool.query(
      `SELECT atenciones, estudiantes_atendidos, est_atendidos_f, est_atendidos_m,
              infecciones_respiratorias, enfermedades_gastrointestinales, accidentes, otros, llamadas,
              fallecidos, fallecidos_f, fallecidos_m, monto, periodo, periodo_corto,
              medicamentos_dispensados, establecimientos_beneficiados
       FROM resumen_ejecutivo_pse WHERE cod_departamento = ?`,
      [departamento]
    );

    const lista = async (tabla) => {
      const [rows] = await pool.query(
        `SELECT numero, descripcion, cantidad FROM ${tabla}
         WHERE cod_departamento = ? ORDER BY numero`,
        [departamento]
      );
      return rows;
    };

    res.json({
      resumen: resumen || null,
      diagnosticos: await lista("diagnosticos_pse"),
      medicamentos: await lista("medicamentos_pse"),
    });
  } catch (err) {
    console.error("ERROR getResumen:", err);
    res.status(500).json({ error: "Error obteniendo datos" });
  }
};
