import pool from './database.js';

// Error con código HTTP para respuestas controladas (400, 404, 409...)
export class ErrorNegocio extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

// Ejecuta varias consultas como una sola operación: o se guardan todas o ninguna
export async function conTransaccion(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await callback(client);
    await client.query('COMMIT');
    return resultado;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Responde con el código correcto según el tipo de error
export function responderError(res, err) {
  if (err instanceof ErrorNegocio) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
}

export const esEntero = (v) => Number.isInteger(Number(v)) && String(v).trim() !== '';
