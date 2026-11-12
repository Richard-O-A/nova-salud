// Único archivo que se comunica con el servidor Node.js
const BASE = '/api';

export const token = () => localStorage.getItem('token');

export function usuarioActual() {
  try {
    return JSON.parse(localStorage.getItem('usuario'));
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
}

async function pedir(ruta, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token()) headers.Authorization = `Bearer ${token()}`;

  const respuesta = await fetch(BASE + ruta, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const datos = await respuesta.json().catch(() => ({}));

  // Sesión vencida: vuelve al inicio de sesión
  if (respuesta.status === 401 && ruta !== '/auth/login') {
    logout();
    location.hash = '#/login';
    throw new Error(datos.error || 'Sesión vencida');
  }
  if (!respuesta.ok) throw new Error(datos.error || 'Error en la solicitud');
  return datos;
}

export const api = {
  login: (email, password) => pedir('/auth/login', { method: 'POST', body: { email, password } }),
  productos: () => pedir('/productos'),
  crearProducto: (datos) => pedir('/productos', { method: 'POST', body: datos }),
  editarProducto: (id, datos) => pedir(`/productos/${id}`, { method: 'PUT', body: datos }),
  ingresarStock: (id, cantidad, motivo) =>
    pedir(`/productos/${id}/entrada`, { method: 'POST', body: { cantidad, motivo } }),
  ventas: () => pedir('/ventas'),
  crearVenta: (datos) => pedir('/ventas', { method: 'POST', body: datos }),
  kardex: (productoId) => pedir('/kardex' + (productoId ? `?producto_id=${productoId}` : '')),
  resumen: (desde, hasta) => pedir(`/resumen?desde=${desde}&hasta=${hasta}`)
};
