import { api } from '../api.js';
import { LOGO } from '../utils.js';

export function renderLogin(contenedor) {
  contenedor.innerHTML = `
    <main class="login">
      <section class="login-marca">
        <img src="${LOGO}" alt="Logo Nova Salud" class="logo-grande">
        <h1>Botica Nova Salud</h1>
        <p>Gestión de inventario y ventas, simple y en línea.</p>
        <ul>
          <li>Control de stock en tiempo real</li>
          <li>Registro de ventas y kardex</li>
          <li>Alertas de reposición</li>
        </ul>
      </section>

      <section class="login-lado">
        <form id="form-login" class="tarjeta login-card form-modal">
          <h2>Iniciar sesión</h2>
          <label>Correo<input type="email" name="email" required autofocus></label>
          <label>Contraseña<input type="password" name="password" required></label>
          <p id="error" class="error"></p>
          <button class="btn grande">Ingresar</button>
        </form>
      </section>
    </main>`;

  contenedor.querySelector('#form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = new FormData(e.target);
    try {
      const r = await api.login(datos.get('email'), datos.get('password'));
      localStorage.setItem('token', r.token);
      localStorage.setItem('usuario', JSON.stringify(r.usuario));
      location.hash = '#/almacen';
    } catch (err) {
      contenedor.querySelector('#error').textContent = err.message;
    }
  });
}
