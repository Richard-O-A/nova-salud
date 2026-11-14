import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from './database.js';
import { verificarToken, soloAdmin } from './middleware/auth.js';
import authRoutes from './routes/authRoutes.js';
import productoRoutes from './routes/productoRoutes.js';
import ventaRoutes from './routes/ventaRoutes.js';
import kardexRoutes from './routes/kardexRoutes.js';
import resumenRoutes from './routes/resumenRoutes.js';
import usuarioRoutes from './routes/usuarioRoutes.js';

if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
  console.error('Falta configurar DATABASE_URL o JWT_SECRET en el archivo .env');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const dirActual = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());

app.get('/api/salud', async (req, res) => {
  try {
    const r = await pool.query('select now() as hora');
    res.json({ estado: 'ok', hora: r.rows[0].hora });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'No se pudo conectar a la base de datos' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/productos', verificarToken, productoRoutes);
app.use('/api/ventas', verificarToken, ventaRoutes);
app.use('/api/kardex', verificarToken, kardexRoutes);
app.use('/api/resumen', verificarToken, resumenRoutes);
app.use('/api/usuarios', verificarToken, soloAdmin, usuarioRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

const dist = path.join(dirActual, '..', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.use((req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
