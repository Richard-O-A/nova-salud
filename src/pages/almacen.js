import { api } from '../api.js';
import { tabla } from '../components/tabla.js';
import { esc, soles, aviso } from '../utils.js';

export async function renderAlmacen(contenedor) {
  let productos = await api.productos();
  let editando = null;

  const columnas = [
    { titulo: 'Producto', campo: 'nombre' },
    { titulo: 'Categoría', campo: 'categoria' },
    { titulo: 'Precio', clase: 'num', render: (p) => soles(p.precio) },
    {
      titulo: 'Stock',
      clase: 'num',
      render: (p) => `<span class="badge ${p.stock <= p.stock_minimo ? 'bajo' : 'ok'}">${p.stock}</span>`
    },
    { titulo: 'Mínimo', clase: 'num', campo: 'stock_minimo' },
    {
      titulo: 'Acciones',
      render: (p) => `
        <button class="btn-mini" data-ingreso="${p.id}">Ingresar stock</button>
        <button class="btn-mini sec" data-editar="${p.id}">Editar</button>`
    }
  ];

  function pintar() {
    const bajos = productos.filter((p) => p.stock <= p.stock_minimo);

    contenedor.innerHTML = `
      <h1>Almacén</h1>
      ${bajos.length ? `<div class="alerta"><strong>Reposición necesaria:</strong> ${bajos.map((p) => `${esc(p.nombre)} (${p.stock})`).join(', ')}</div>` : ''}

      <section class="tarjeta">
        <h2>${editando ? 'Editar producto' : 'Nuevo producto'}</h2>
        <form id="form-producto" class="grid-form">
          <label>Nombre<input name="nombre" required value="${esc(editando?.nombre)}"></label>
          <label>Categoría<input name="categoria" value="${esc(editando?.categoria)}"></label>
          <label>Precio (S/)<input name="precio" type="number" step="0.01" min="0" required value="${editando?.precio ?? ''}"></label>
          <label>${editando ? 'Stock actual' : 'Stock inicial'}<input name="stock" type="number" min="0" value="${editando ? editando.stock : 0}" ${editando ? 'disabled' : ''}></label>
          <label>Stock mínimo<input name="stock_minimo" type="number" min="0" value="${editando?.stock_minimo ?? 5}"></label>
          <div class="acciones">
            <button class="btn">${editando ? 'Guardar cambios' : 'Registrar producto'}</button>
            ${editando ? '<button type="button" id="cancelar" class="btn-sec">Cancelar</button>' : ''}
          </div>
        </form>
      </section>

      <section class="tarjeta">
        <h2>Productos (${productos.length})</h2>
        ${tabla(columnas, productos)}
      </section>`;

    activar();
  }

  async function recargar(mensaje) {
    productos = await api.productos();
    editando = null;
    pintar();
    aviso(mensaje);
  }

  function activar() {
    contenedor.querySelector('#form-producto').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const datos = {
        nombre: f.get('nombre'),
        categoria: f.get('categoria'),
        precio: f.get('precio'),
        stock: f.get('stock'),
        stock_minimo: f.get('stock_minimo')
      };
      try {
        if (editando) {
          await api.editarProducto(editando.id, datos);
          await recargar('Producto actualizado');
        } else {
          await api.crearProducto(datos);
          await recargar('Producto registrado');
        }
      } catch (err) {
        aviso(err.message, 'error');
      }
    });

    contenedor.querySelector('#cancelar')?.addEventListener('click', () => {
      editando = null;
      pintar();
    });

    contenedor.querySelectorAll('[data-editar]').forEach((btn) =>
      btn.addEventListener('click', () => {
        editando = productos.find((p) => p.id === Number(btn.dataset.editar));
        pintar();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
    );

    contenedor.querySelectorAll('[data-ingreso]').forEach((btn) =>
      btn.addEventListener('click', async () => {
        const producto = productos.find((p) => p.id === Number(btn.dataset.ingreso));
        const texto = prompt(`Cantidad a ingresar de ${producto.nombre}:`);
        if (texto === null) return;
        const cantidad = Number(texto);
        if (!Number.isInteger(cantidad) || cantidad <= 0) return aviso('Cantidad inválida', 'error');
        try {
          await api.ingresarStock(producto.id, cantidad, 'Ingreso de mercadería');
          await recargar('Ingreso registrado en el kardex');
        } catch (err) {
          aviso(err.message, 'error');
        }
      })
    );
  }

  pintar();
}
