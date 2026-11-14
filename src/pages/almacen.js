import { api, usuarioActual } from '../api.js';
import { tabla } from '../components/tabla.js';
import { abrirModal } from '../components/modal.js';
import { esc, soles, aviso } from '../utils.js';

export async function renderAlmacen(contenedor) {
  let productos = await api.productos();
  let busqueda = '';
  const admin = usuarioActual()?.rol === 'admin';

  const columnas = [
    { titulo: 'Producto', render: (p) => `<strong>${esc(p.nombre)}</strong>` },
    { titulo: 'Categoría', render: (p) => esc(p.categoria || '-') },
    { titulo: 'Precio', clase: 'num', render: (p) => soles(p.precio) },
    { titulo: 'Stock', clase: 'num', campo: 'stock' },
    { titulo: 'Mínimo', clase: 'num', campo: 'stock_minimo' },
    {
      titulo: 'Estado',
      render: (p) =>
        p.stock <= p.stock_minimo ? '<span class="badge bajo">Reponer</span>' : '<span class="badge ok">Normal</span>'
    }
  ];
  if (admin) {
    columnas.push({
      titulo: 'Acciones',
      render: (p) => `
        <button class="btn-mini" data-ingreso="${p.id}">Ingresar stock</button>
        <button class="btn-mini sec" data-editar="${p.id}">Editar</button>`
    });
  }

  function pintar() {
    const bajos = productos.filter((p) => p.stock <= p.stock_minimo);
    const unidades = productos.reduce((suma, p) => suma + p.stock, 0);
    const valor = productos.reduce((suma, p) => suma + p.stock * p.precio, 0);

    contenedor.innerHTML = `
      <div class="titulo-fila">
        <div><h1>Almacén</h1><p class="sub">Control de productos y existencias</p></div>
        ${admin ? '<button id="nuevo" class="btn">+ Nuevo producto</button>' : ''}
      </div>

      <div class="cards">
        <div class="card"><span>Productos</span><strong>${productos.length}</strong></div>
        <div class="card"><span>Unidades en stock</span><strong>${unidades}</strong></div>
        <div class="card"><span>Valor del inventario</span><strong>${soles(valor)}</strong></div>
        <div class="card ${bajos.length ? 'rojo' : ''}"><span>Con stock bajo</span><strong>${bajos.length}</strong></div>
      </div>

      ${bajos.length ? `<div class="alerta"><strong>Reposición necesaria:</strong> ${bajos.map((p) => `${esc(p.nombre)} (${p.stock})`).join(', ')}</div>` : ''}

      <section class="tarjeta">
        <div class="barra">
          <h2>Productos</h2>
          <input id="buscar" type="search" placeholder="Buscar producto o categoría..." value="${esc(busqueda)}">
        </div>
        <div id="zona-tabla"></div>
      </section>`;

    contenedor.querySelector('#nuevo')?.addEventListener('click', () => abrirFormulario());
    contenedor.querySelector('#buscar').addEventListener('input', (e) => {
      busqueda = e.target.value;
      pintarTabla();
    });
    pintarTabla();
  }

  function pintarTabla() {
    const texto = busqueda.trim().toLowerCase();
    const lista = texto
      ? productos.filter((p) => `${p.nombre} ${p.categoria || ''}`.toLowerCase().includes(texto))
      : productos;

    const zona = contenedor.querySelector('#zona-tabla');
    zona.innerHTML = tabla(columnas, lista, 'No se encontraron productos');

    zona.querySelectorAll('[data-editar]').forEach((btn) =>
      btn.addEventListener('click', () => abrirFormulario(productos.find((p) => p.id === Number(btn.dataset.editar))))
    );
    zona.querySelectorAll('[data-ingreso]').forEach((btn) =>
      btn.addEventListener('click', () => abrirIngreso(productos.find((p) => p.id === Number(btn.dataset.ingreso))))
    );
  }

  async function recargar(mensaje) {
    productos = await api.productos();
    pintar();
    aviso(mensaje);
  }

  // Ventana para registrar o editar un producto
  function abrirFormulario(producto = null) {
    const categorias = [...new Set(productos.map((p) => p.categoria).filter(Boolean))];

    const { el, cerrar } = abrirModal(
      producto ? 'Editar producto' : 'Nuevo producto',
      `<form id="form-producto" class="form-modal">
        <label>Nombre<input name="nombre" required value="${esc(producto?.nombre)}"></label>
        <label>Categoría<input name="categoria" list="categorias" value="${esc(producto?.categoria)}"></label>
        <datalist id="categorias">${categorias.map((c) => `<option value="${esc(c)}">`).join('')}</datalist>
        <div class="dos-col">
          <label>Precio (S/)<input name="precio" type="number" step="0.01" min="0" required value="${producto?.precio ?? ''}"></label>
          <label>Stock mínimo<input name="stock_minimo" type="number" min="0" required value="${producto?.stock_minimo ?? 5}"></label>
        </div>
        ${producto ? '' : '<label>Stock inicial<input name="stock" type="number" min="0" value="0"></label>'}
        <div class="acciones-modal">
          <button type="button" class="btn-sec" data-cancelar>Cancelar</button>
          <button class="btn">${producto ? 'Guardar cambios' : 'Registrar producto'}</button>
        </div>
      </form>`
    );

    el.querySelector('[data-cancelar]').addEventListener('click', cerrar);
    el.querySelector('#form-producto').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const datos = {
        nombre: f.get('nombre'),
        categoria: f.get('categoria'),
        precio: f.get('precio'),
        stock_minimo: f.get('stock_minimo'),
        stock: f.get('stock') ?? 0
      };
      try {
        if (producto) await api.editarProducto(producto.id, datos);
        else await api.crearProducto(datos);
        cerrar();
        await recargar(producto ? 'Producto actualizado' : 'Producto registrado');
      } catch (err) {
        aviso(err.message, 'error');
      }
    });
  }

  // Ventana para ingresar mercadería (genera una ENTRADA en el kardex)
  function abrirIngreso(producto) {
    const { el, cerrar } = abrirModal(
      'Ingresar stock',
      `<p class="sub">${esc(producto.nombre)} - stock actual: <strong>${producto.stock}</strong></p>
      <form id="form-ingreso" class="form-modal">
        <label>Cantidad a ingresar<input name="cantidad" type="number" min="1" required></label>
        <label>Motivo
          <select name="motivo">
            <option>Compra a proveedor</option>
            <option>Reposición</option>
            <option>Devolución</option>
            <option>Ajuste de inventario</option>
          </select>
        </label>
        <div class="acciones-modal">
          <button type="button" class="btn-sec" data-cancelar>Cancelar</button>
          <button class="btn">Registrar ingreso</button>
        </div>
      </form>`
    );

    el.querySelector('[data-cancelar]').addEventListener('click', cerrar);
    el.querySelector('#form-ingreso').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      try {
        await api.ingresarStock(producto.id, Number(f.get('cantidad')), f.get('motivo'));
        cerrar();
        await recargar('Ingreso registrado en el kardex');
      } catch (err) {
        aviso(err.message, 'error');
      }
    });
  }

  pintar();
}
