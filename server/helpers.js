import pool from './database.js';

export class ErrorNegocio extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

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

export function responderError(res, err) {
  if (err instanceof ErrorNegocio) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
}

export const esEntero = (v) => Number.isInteger(Number(v)) && String(v).trim() !== '';
