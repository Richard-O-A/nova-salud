import bcrypt from 'bcryptjs';
import pool from '../database.js';
import { responderError, esEntero } from '../helpers.js';

const ROLES = ['admin', 'vendedor'];

export async function listar(req, res) {
  try {
    const r = await pool.query(
      'select id, nombre, email, rol, created_at from usuarios order by id'
    );
    res.json(r.rows);
  } catch (err) {
    responderError(res, err);
  }
}

export async function crear(req, res) {
  const nombre = String(req.body.nombre || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const rol = req.body.rol || 'vendedor';

  if (nombre.length < 2 || nombre.length > 100) {
    return res.status(400).json({ error: 'Ingresa el nombre completo' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100) {
    return res.status(400).json({ error: 'Correo electrónico inválido' });
  }
  if (password.length < 6 || password.length > 72) {
    return res.status(400).json({ error: 'La contraseña debe tener entre 6 y 72 caracteres' });
  }
  if (!ROLES.includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query(
      `insert into usuarios (nombre, email, password, rol)
       values ($1, $2, $3, $4) returning id, nombre, email, rol, created_at`,
      [nombre, email, hash, rol]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ese correo ya está registrado' });
    }
    responderError(res, err);
  }
}

export async function eliminar(req, res) {
  if (!esEntero(req.params.id)) {
    return res.status(400).json({ error: 'Usuario inválido' });
  }
  const id = Number(req.params.id);

  if (id === req.usuario.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
  }

  try {
    const r = await pool.query('delete from usuarios where id = $1', [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ error: 'No se puede eliminar: el usuario tiene ventas registradas' });
    }
    responderError(res, err);
  }
}
