import { api, usuarioActual } from '../api.js';
import { tabla } from '../components/tabla.js';
import { abrirModal } from '../components/modal.js';
import { esc, fecha, aviso } from '../utils.js';

export async function renderUsuarios(contenedor) {
  let usuarios = await api.usuarios();
  const yo = usuarioActual();

  const columnas = [
    { titulo: 'Nombre', render: (u) => `<strong>${esc(u.nombre)}</strong>` },
    { titulo: 'Correo', campo: 'email' },
    {
      titulo: 'Rol',
      render: (u) =>
        u.rol === 'admin' ? '<span class="badge salida">Administrador</span>' : '<span class="badge ok">Vendedor</span>'
    },
    { titulo: 'Creado', render: (u) => fecha(u.created_at) },
    {
      titulo: 'Acciones',
      render: (u) =>
        u.id === yo.id
          ? '<small class="nota">Tu cuenta</small>'
          : `<button class="btn-mini sec" data-eliminar="${u.id}">Eliminar</button>`
    }
  ];

  function pintar() {
    contenedor.innerHTML = `
      <div class="titulo-fila">
        <div><h1>Usuarios</h1><p class="sub">Personal con acceso al sistema</p></div>
        <button id="nuevo" class="btn">+ Nuevo usuario</button>
      </div>
      <section class="tarjeta">${tabla(columnas, usuarios)}</section>`;

    contenedor.querySelector('#nuevo').addEventListener('click', abrirFormulario);
    contenedor.querySelectorAll('[data-eliminar]').forEach((btn) =>
      btn.addEventListener('click', () => confirmarEliminar(usuarios.find((u) => u.id === Number(btn.dataset.eliminar))))
    );
  }

  async function recargar(mensaje) {
    usuarios = await api.usuarios();
    pintar();
    aviso(mensaje);
  }

  function abrirFormulario() {
    const { el, cerrar } = abrirModal(
      'Nuevo usuario',
      `<form id="form-usuario" class="form-modal">
        <label>Nombre completo<input name="nombre" required minlength="2" maxlength="100"></label>
        <label>Correo<input type="email" name="email" required></label>
        <label>Contraseña<input type="password" name="password" required minlength="6" autocomplete="new-password"></label>
        <label>Rol
          <select name="rol">
            <option value="vendedor">Vendedor (vende y consulta)</option>
            <option value="admin">Administrador (acceso total)</option>
          </select>
        </label>
        <div class="acciones-modal">
          <button type="button" class="btn-sec" data-cancelar>Cancelar</button>
          <button class="btn">Crear usuario</button>
        </div>
      </form>`
    );

    el.querySelector('[data-cancelar]').addEventListener('click', cerrar);
    el.querySelector('#form-usuario').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      try {
        await api.crearUsuario({
          nombre: f.get('nombre'),
          email: f.get('email'),
          password: f.get('password'),
          rol: f.get('rol')
        });
        cerrar();
        await recargar('Usuario creado correctamente');
      } catch (err) {
        aviso(err.message, 'error');
      }
    });
  }

  function confirmarEliminar(usuario) {
    const { el, cerrar } = abrirModal(
      'Eliminar usuario',
      `<p>¿Seguro que deseas eliminar a <strong>${esc(usuario.nombre)}</strong>?</p>
       <div class="acciones-modal">
         <button type="button" class="btn-sec" data-cancelar>Cancelar</button>
         <button type="button" class="btn" id="confirmar">Sí, eliminar</button>
       </div>`
    );

    el.querySelector('[data-cancelar]').addEventListener('click', cerrar);
    el.querySelector('#confirmar').addEventListener('click', async () => {
      try {
        await api.eliminarUsuario(usuario.id);
        cerrar();
        await recargar('Usuario eliminado');
      } catch (err) {
        cerrar();
        aviso(err.message, 'error');
      }
    });
  }

  pintar();
}
