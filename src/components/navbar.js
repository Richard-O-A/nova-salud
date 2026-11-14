import { logout, usuarioActual, esAdmin } from '../api.js';
import { esc, LOGO } from '../utils.js';

const enlaces = [
  ['almacen', 'Almacén'],
  ['ventas', 'Ventas'],
  ['kardex', 'Kardex'],
  ['resumen', 'Resumen'],
  ['usuarios', 'Usuarios']
];

export function navbar(rutaActual) {
  const usuario = usuarioActual();
  const inicial = (usuario?.nombre || '?').trim().charAt(0).toUpperCase();
  const links = enlaces
    .filter(([ruta]) => ruta !== 'usuarios' || esAdmin())
    .map(([ruta, texto]) => `<a href="#/${ruta}" class="${ruta === rutaActual ? 'activo' : ''}">${texto}</a>`)
    .join('');

  return `
    <header class="navbar">
      <div class="navbar-in">
        <a class="marca" href="#/almacen">
          <img src="${LOGO}" alt="" class="logo-mini">
          <span>Nova Salud</span>
        </a>
        <nav>${links}</nav>
        <div class="usuario">
          <div class="avatar">${esc(inicial)}</div>
          <div class="u-datos">
            <span>${esc(usuario?.nombre)}</span>
            <small>${usuario?.rol === 'admin' ? 'Administrador' : 'Vendedor'}</small>
          </div>
          <button id="btn-salir" class="btn-sec">Salir</button>
        </div>
      </div>
    </header>`;
}

export function activarNavbar() {
  document.getElementById('btn-salir').addEventListener('click', () => {
    logout();
    location.hash = '#/login';
  });
}
