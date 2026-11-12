import pool from '../database.js';
import { conTransaccion, responderError, ErrorNegocio, esEntero } from '../helpers.js';

const COLUMNAS = 'id, nombre, categoria, precio::float8 as precio, stock, stock_minimo';

export async function listar(req, res) {
  try {
    const r = await pool.query(`select ${COLUMNAS} from productos order by nombre`);
    res.json(r.rows);
  } catch (err) {
    responderError(res, err);
  }
}

export async function crear(req, res) {
  const { nombre, categoria, precio } = req.body;
  const stock = req.body.stock ?? 0;
  const stockMinimo = req.body.stock_minimo ?? 5;

  if (!nombre || !String(nombre).trim() || precio === undefined || Number(precio) < 0 || isNaN(Number(precio))) {
    return res.status(400).json({ error: 'Nombre y precio válido son obligatorios' });
  }
  if (!esEntero(stock) || Number(stock) < 0 || !esEntero(stockMinimo) || Number(stockMinimo) < 0) {
    return res.status(400).json({ error: 'Stock y stock mínimo deben ser números enteros positivos' });
  }

  try {
    const producto = await conTransaccion(async (db) => {
      const r = await db.query(
        `insert into productos (nombre, categoria, precio, stock, stock_minimo)
         values ($1, $2, $3, $4, $5) returning ${COLUMNAS}`,
        [String(nombre).trim(), categoria || null, Number(precio), Number(stock), Number(stockMinimo)]
      );
      const p = r.rows[0];
      // El stock inicial queda registrado como la primera entrada del kardex
      if (p.stock > 0) {
        await db.query(
          `insert into movimientos (producto_id, tipo, cantidad, saldo, motivo)
           values ($1, 'ENTRADA', $2, $2, 'Stock inicial')`,
          [p.id, p.stock]
        );
      }
      return p;
    });
    res.status(201).json(producto);
  } catch (err) {
    responderError(res, err);
  }
}

export async function actualizar(req, res) {
  const { nombre, categoria, precio, stock_minimo } = req.body;

  if (!nombre || !String(nombre).trim() || precio === undefined || Number(precio) < 0 || isNaN(Number(precio))) {
    return res.status(400).json({ error: 'Nombre y precio válido son obligatorios' });
  }
  if (!esEntero(stock_minimo ?? 5) || Number(stock_minimo ?? 5) < 0) {
    return res.status(400).json({ error: 'El stock mínimo debe ser un entero positivo' });
  }

  try {
    const r = await pool.query(
      `update productos set nombre = $1, categoria = $2, precio = $3, stock_minimo = $4
       where id = $5 returning ${COLUMNAS}`,
      [String(nombre).trim(), categoria || null, Number(precio), Number(stock_minimo ?? 5), req.params.id]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(r.rows[0]);
  } catch (err) {
    responderError(res, err);
  }
}

// Ingreso de mercadería: suma al stock y registra la ENTRADA en el kardex
export async function ingresarStock(req, res) {
  const { cantidad, motivo } = req.body;

  if (!esEntero(cantidad) || Number(cantidad) <= 0) {
    return res.status(400).json({ error: 'La cantidad debe ser un entero mayor a cero' });
  }

  try {
    const resultado = await conTransaccion(async (db) => {
      const r = await db.query('select stock from productos where id = $1 for update', [req.params.id]);
      if (r.rowCount === 0) throw new ErrorNegocio(404, 'Producto no encontrado');

      const nuevoStock = r.rows[0].stock + Number(cantidad);
      await db.query('update productos set stock = $1 where id = $2', [nuevoStock, req.params.id]);
      await db.query(
        `insert into movimientos (producto_id, tipo, cantidad, saldo, motivo)
         values ($1, 'ENTRADA', $2, $3, $4)`,
        [req.params.id, Number(cantidad), nuevoStock, motivo || 'Ingreso de mercadería']
      );
      return { stock: nuevoStock };
    });
    res.status(201).json(resultado);
  } catch (err) {
    responderError(res, err);
  }
}
