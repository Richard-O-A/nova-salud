import './css/style.css';
import { token } from './api.js';
import { esc } from './utils.js';
import { navbar, activarNavbar } from './components/navbar.js';
import { cerrarModal } from './components/modal.js';
import { renderLogin } from './pages/login.js';
import { renderAlmacen } from './pages/almacen.js';
import { renderVentas } from './pages/ventas.js';
import { renderKardex } from './pages/kardex.js';
import { renderResumen } from './pages/resumen.js';

const paginas = {
  almacen: renderAlmacen,
  ventas: renderVentas,
  kardex: renderKardex,
  resumen: renderResumen
};

const app = document.getElementById('app');

// Muestra la pantalla que corresponde a la dirección (#/almacen, #/ventas...)
async function router() {
  cerrarModal();
  const ruta = location.hash.replace('#/', '') || 'almacen';

  if (!token()) {
    if (ruta !== 'login') {
      location.hash = '#/login';
      return;
    }
    renderLogin(app);
    return;
  }

  if (ruta === 'login' || !paginas[ruta]) {
    location.hash = '#/almacen';
    return;
  }

  app.innerHTML = navbar(ruta) + '<main class="contenido" id="contenido"><p class="vacio">Cargando...</p></main>';
  activarNavbar();

  const contenido = document.getElementById('contenido');
  try {
    await paginas[ruta](contenido);
  } catch (err) {
    contenido.innerHTML = `<p class="error">${esc(err.message)}</p>`;
  }
}

window.addEventListener('hashchange', router);
router();
