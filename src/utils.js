export const LOGO = '/logo.svg';

export const esc = (texto) =>
  String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const soles = (monto) => 'S/ ' + Number(monto).toFixed(2);

export const fecha = (valor) =>
  new Date(valor).toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'short', timeStyle: 'short' });

export function fechaLima(dias = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
}

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
