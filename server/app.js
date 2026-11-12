import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from './database.js';
import { verificarToken } from './middleware/auth.js';
import authRoutes from './routes/authRoutes.js';
import productoRoutes from './routes/productoRoutes.js';
import ventaRoutes from './routes/ventaRoutes.js';
import kardexRoutes from './routes/kardexRoutes.js';
import resumenRoutes from './routes/resumenRoutes.js';

if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
  console.error('Falta configurar DATABASE_URL o JWT_SECRET en el archivo .env');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const dirActual = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());

// Verifica la conexión con la base de datos
app.get('/api/salud', async (req, res) => {
  try {
    const r = await pool.query('select now() as hora');
    res.json({ estado: 'ok', hora: r.rows[0].hora });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'No se pudo conectar a la base de datos' });
  }
});

// Rutas de la API (todas, salvo el login, requieren sesión)
app.use('/api/auth', authRoutes);
app.use('/api/productos', verificarToken, productoRoutes);
app.use('/api/ventas', verificarToken, ventaRoutes);
app.use('/api/kardex', verificarToken, kardexRoutes);
app.use('/api/resumen', verificarToken, resumenRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// En producción, el mismo servidor entrega la página compilada (carpeta dist)
const dist = path.join(dirActual, '..', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.use((req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
