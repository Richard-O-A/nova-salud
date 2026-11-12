import { api } from '../api.js';

export function renderLogin(contenedor) {
  contenedor.innerHTML = `
    <main class="login">
      <form id="form-login" class="tarjeta login-card">
        <h1>Botica Nova Salud</h1>
        <p class="sub">Sistema de inventario y ventas</p>
        <label>Correo<input type="email" name="email" required autofocus></label>
        <label>Contraseña<input type="password" name="password" required></label>
        <p id="error" class="error"></p>
        <button class="btn">Ingresar</button>
      </form>
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
