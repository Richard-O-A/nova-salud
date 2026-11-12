import { logout, usuarioActual } from '../api.js';
import { esc } from '../utils.js';

const enlaces = [
  ['almacen', 'Almacén'],
  ['ventas', 'Ventas'],
  ['kardex', 'Kardex'],
  ['resumen', 'Resumen']
];

export function navbar(rutaActual) {
  const usuario = usuarioActual();
  const links = enlaces
    .map(([ruta, texto]) => `<a href="#/${ruta}" class="${ruta === rutaActual ? 'activo' : ''}">${texto}</a>`)
    .join('');

  return `
    <header class="navbar">
      <div class="marca">Nova Salud</div>
      <nav>${links}</nav>
      <div class="usuario">
        <span>${esc(usuario?.nombre)}</span>
        <button id="btn-salir" class="btn-sec">Salir</button>
      </div>
    </header>`;
}

export function activarNavbar() {
  document.getElementById('btn-salir').addEventListener('click', () => {
    logout();
    location.hash = '#/login';
  });
}
