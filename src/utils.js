// Funciones auxiliares compartidas por las pantallas

// Logo del sistema. Para usar tu propia imagen, ponla en la carpeta public/
// (por ejemplo public/mi-logo.png) y cambia esta ruta: '/mi-logo.png'
export const LOGO = '/logo.svg';

// Evita que el texto ingresado se interprete como código HTML
export const esc = (texto) =>
  String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const soles = (monto) => 'S/ ' + Number(monto).toFixed(2);

export const fecha = (valor) =>
  new Date(valor).toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'short', timeStyle: 'short' });

// Fecha de hoy en Lima (AAAA-MM-DD), con un desplazamiento opcional en días
export function fechaLima(dias = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
}

// Mensaje flotante de confirmación o error (se apilan si hay varios)
export function aviso(mensaje, tipo = 'ok') {
  let caja = document.getElementById('avisos');
  if (!caja) {
    caja = document.createElement('div');
    caja.id = 'avisos';
    document.body.appendChild(caja);
  }
  const el = document.createElement('div');
  el.className = `aviso ${tipo}`;
  el.textContent = mensaje;
  caja.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
