import pool from '../database.js';
import { responderError, esEntero } from '../helpers.js';

export async function listar(req, res) {
  const productoId = req.query.producto_id;

  if (productoId && !esEntero(productoId)) {
    return res.status(400).json({ error: 'Producto inválido' });
  }

  try {
    const r = await pool.query(
      `select m.id, m.fecha, p.nombre as producto, m.tipo, m.cantidad, m.saldo, m.motivo
       from movimientos m join productos p on p.id = m.producto_id
       where ($1::int is null or m.producto_id = $1::int)
       order by m.fecha desc, m.id desc limit 200`,
      [productoId ? Number(productoId) : null]
    );
    res.json(r.rows);
  } catch (err) {
    responderError(res, err);
  }
}
