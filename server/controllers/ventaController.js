import pool from '../database.js';
import { conTransaccion, responderError, ErrorNegocio, esEntero } from '../helpers.js';

export async function listar(req, res) {
  try {
    const r = await pool.query(
      `select v.id, v.cliente, v.total::float8 as total, v.fecha, u.nombre as vendedor,
              (select coalesce(sum(cantidad), 0)::int from detalle_ventas d where d.venta_id = v.id) as unidades
       from ventas v left join usuarios u on u.id = v.usuario_id
       order by v.fecha desc, v.id desc limit 20`
    );
    res.json(r.rows);
  } catch (err) {
    responderError(res, err);
  }
}

// Registra la venta, descuenta el stock y deja la SALIDA en el kardex
export async function crear(req, res) {
  const { cliente, items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'La venta debe tener al menos un producto' });
  }

  // Une los productos repetidos y valida cantidades
  const cantidades = new Map();
  for (const item of items) {
    if (!esEntero(item.producto_id) || !esEntero(item.cantidad) || Number(item.cantidad) <= 0) {
      return res.status(400).json({ error: 'Producto o cantidad inválidos' });
    }
    const id = Number(item.producto_id);
    cantidades.set(id, (cantidades.get(id) || 0) + Number(item.cantidad));
  }

  try {
    const venta = await conTransaccion(async (db) => {
      const v = await db.query(
        'insert into ventas (cliente, usuario_id) values ($1, $2) returning id',
        [cliente ? String(cliente).trim() : null, req.usuario.id]
      );
      const ventaId = v.rows[0].id;
      let total = 0;

      // Se procesan en orden de id para evitar bloqueos entre ventas simultáneas
      const ordenados = [...cantidades].sort((a, b) => a[0] - b[0]);

      for (const [productoId, cantidad] of ordenados) {
        const r = await db.query(
          'select nombre, precio::float8 as precio, stock from productos where id = $1 for update',
          [productoId]
        );
        const producto = r.rows[0];

        if (!producto) throw new ErrorNegocio(404, `El producto ${productoId} no existe`);
        if (producto.stock < cantidad) {
          throw new ErrorNegocio(400, `Stock insuficiente de ${producto.nombre} (disponible: ${producto.stock})`);
        }

        const subtotal = Math.round(producto.precio * cantidad * 100) / 100;
        const nuevoStock = producto.stock - cantidad;

        await db.query(
          `insert into detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal)
           values ($1, $2, $3, $4, $5)`,
          [ventaId, productoId, cantidad, producto.precio, subtotal]
        );
        await db.query('update productos set stock = $1 where id = $2', [nuevoStock, productoId]);
        await db.query(
          `insert into movimientos (producto_id, tipo, cantidad, saldo, motivo, venta_id)
           values ($1, 'SALIDA', $2, $3, 'Venta', $4)`,
          [productoId, cantidad, nuevoStock, ventaId]
        );
        total += subtotal;
      }

      total = Math.round(total * 100) / 100;
      await db.query('update ventas set total = $1 where id = $2', [total, ventaId]);
      return { id: ventaId, total };
    });

    res.status(201).json({ mensaje: 'Venta registrada correctamente', ...venta });
  } catch (err) {
    responderError(res, err);
  }
}
