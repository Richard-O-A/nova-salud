// Carga datos de ejemplo: un usuario administrador y productos de la botica.
// Uso: npm run seed
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from './database.js';

const productos = [
  ['Paracetamol 500 mg (tableta)', 'Analgésicos', 0.50, 120, 20],
  ['Ibuprofeno 400 mg (tableta)', 'Analgésicos', 0.80, 100, 20],
  ['Amoxicilina 500 mg (cápsula)', 'Antibióticos', 1.20, 80, 15],
  ['Loratadina 10 mg (tableta)', 'Antialérgicos', 0.70, 60, 15],
  ['Omeprazol 20 mg (cápsula)', 'Gastrointestinales', 0.90, 70, 15],
  ['Alcohol medicinal 70° 250 ml', 'Primeros auxilios', 4.50, 25, 5],
  ['Gasa estéril 10x10', 'Primeros auxilios', 1.00, 50, 10],
  ['Vitamina C 1 g (efervescente)', 'Vitaminas', 1.50, 40, 10],
  ['Suero oral (sobre)', 'Hidratación', 2.50, 30, 8],
  ['Jarabe para la tos 120 ml', 'Respiratorios', 12.00, 4, 6],
  ['Mascarilla quirúrgica (unidad)', 'Protección', 0.50, 200, 30],
  ['Termómetro digital', 'Equipos', 15.00, 3, 5]
];

try {
  const hash = await bcrypt.hash('admin123', 10);
  await pool.query(
    `insert into usuarios (nombre, email, password, rol)
     values ('Administrador', 'admin@novasalud.com', $1, 'admin')
     on conflict (email) do nothing`,
    [hash]
  );

  const { rows } = await pool.query('select count(*)::int as total from productos');
  if (rows[0].total === 0) {
    for (const [nombre, categoria, precio, stock, minimo] of productos) {
      const r = await pool.query(
        `insert into productos (nombre, categoria, precio, stock, stock_minimo)
         values ($1, $2, $3, $4, $5) returning id`,
        [nombre, categoria, precio, stock, minimo]
      );
      await pool.query(
        `insert into movimientos (producto_id, tipo, cantidad, saldo, motivo)
         values ($1, 'ENTRADA', $2, $2, 'Stock inicial')`,
        [r.rows[0].id, stock]
      );
    }
    console.log(`Se cargaron ${productos.length} productos de ejemplo.`);
  } else {
    console.log('Ya existen productos, no se agregaron datos de ejemplo.');
  }

  console.log('Usuario listo: admin@novasalud.com / admin123');
} catch (err) {
  console.error('Error al cargar los datos:', err.message);
} finally {
  await pool.end();
}
