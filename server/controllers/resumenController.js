import pool from '../database.js';
import { responderError } from '../helpers.js';

const ZONA = 'America/Lima';
const FORMATO = /^\d{4}-\d{2}-\d{2}$/;
const hoyLima = (fecha = new Date()) => fecha.toLocaleDateString('en-CA', { timeZone: ZONA });

export async function obtener(req, res) {
  const haceUnMes = new Date();
  haceUnMes.setDate(haceUnMes.getDate() - 30);

  const desde = req.query.desde || hoyLima(haceUnMes);
  const hasta = req.query.hasta || hoyLima();

  if (!FORMATO.test(desde) || !FORMATO.test(hasta) || desde > hasta) {
    return res.status(400).json({ error: 'Rango de fechas inválido' });
  }

  try {
    const filtroVentas = `(v.fecha at time zone '${ZONA}')::date between $1::date and $2::date`;
    const filtroMov = `(fecha at time zone '${ZONA}')::date between $1::date and $2::date`;

    const [ventas, movimientos, bajoStock, masVendidos] = await Promise.all([
      pool.query(
        `select coalesce(sum(total), 0)::float8 as ingresos, count(*)::int as num_ventas
         from ventas v where ${filtroVentas}`, [desde, hasta]),
      pool.query(
        `select coalesce(sum(cantidad) filter (where tipo = 'ENTRADA'), 0)::int as entradas,
                coalesce(sum(cantidad) filter (where tipo = 'SALIDA'), 0)::int as salidas
         from movimientos where ${filtroMov}`, [desde, hasta]),
      pool.query(
        `select id, nombre, stock, stock_minimo from productos
         where stock <= stock_minimo order by stock, nombre`),
      pool.query(
        `select p.nombre, sum(d.cantidad)::int as unidades, sum(d.subtotal)::float8 as monto
         from detalle_ventas d
         join ventas v on v.id = d.venta_id
         join productos p on p.id = d.producto_id
         where ${filtroVentas}
         group by p.nombre order by unidades desc limit 5`, [desde, hasta])
    ]);

    res.json({
      desde,
      hasta,
      ingresos: ventas.rows[0].ingresos,
      num_ventas: ventas.rows[0].num_ventas,
      unidades_entrada: movimientos.rows[0].entradas,
      unidades_salida: movimientos.rows[0].salidas,
      bajo_stock: bajoStock.rows,
      mas_vendidos: masVendidos.rows
    });
  } catch (err) {
    responderError(res, err);
  }
}
