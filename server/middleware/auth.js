import jwt from 'jsonwebtoken';

// Protege las rutas: exige un token válido en el encabezado Authorization
export function verificarToken(req, res, next) {
  const cabecera = req.headers.authorization || '';
  const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : null;

  if (!token) return res.status(401).json({ error: 'Sesión requerida' });

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Sesión inválida o vencida' });
  }
}
