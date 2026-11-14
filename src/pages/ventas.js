import { api } from '../api.js';
import { tabla } from '../components/tabla.js';
import { esc, soles, fecha, aviso } from '../utils.js';

export async function renderVentas(contenedor) {
  const [productos, ventas] = await Promise.all([api.productos(), api.ventas()]);
  let carrito = [];
  let busqueda = '';

  contenedor.innerHTML = `
    <h1>Ventas</h1>
    <p class="sub">Toca los productos para armar la venta</p>

    <div class="venta-layout">
      <section class="tarjeta">
        <div class="barra">
          <h2>Productos</h2>
          <input id="buscar" type="search" placeholder="Buscar producto...">
        </div>
        <div id="zona-productos" class="grid-productos"></div>
      </section>

      <aside class="tarjeta carrito">
        <h2>Venta actual</h2>
        <div id="zona-carrito"></div>
        <label>Cliente (opcional)<input id="cliente" placeholder="Nombre del cliente"></label>
        <button id="registrar" class="btn grande" disabled>Registrar venta</button>
      </aside>
    </div>

    <section class="tarjeta">
      <h2>Últimas ventas</h2>
      ${tabla(
        [
          { titulo: 'N°', campo: 'id' },
          { titulo: 'Fecha', render: (v) => fecha(v.fecha) },
          { titulo: 'Cliente', render: (v) => esc(v.cliente || '-') },
          { titulo: 'Vendedor', campo: 'vendedor' },
          { titulo: 'Unidades', clase: 'num', campo: 'unidades' },
          { titulo: 'Total', clase: 'num', render: (v) => `<strong>${soles(v.total)}</strong>` }
        ],
        ventas,
        'Aún no hay ventas registradas'
      )}
    </section>`;

  const zonaProductos = contenedor.querySelector('#zona-productos');
  const zonaCarrito = contenedor.querySelector('#zona-carrito');
  const btnRegistrar = contenedor.querySelector('#registrar');

  function pintarProductos() {
    const texto = busqueda.trim().toLowerCase();
    const lista = texto ? productos.filter((p) => p.nombre.toLowerCase().includes(texto)) : productos;

    zonaProductos.innerHTML = lista.length
      ? lista
          .map((p) => {
            const agotado = p.stock <= 0;
            const bajo = p.stock <= p.stock_minimo;
            return `
              <button type="button" class="prod-card ${agotado ? 'agotado' : ''}" data-id="${p.id}" ${agotado ? 'disabled' : ''}>
                <span class="prod-nombre">${esc(p.nombre)}</span>
                <span class="prod-precio">${soles(p.precio)}</span>
                <span class="badge ${agotado || bajo ? 'bajo' : 'ok'}">${agotado ? 'Agotado' : 'Stock ' + p.stock}</span>
              </button>`;
          })
          .join('')
      : '<p class="vacio">Sin resultados</p>';
  }

  function pintarCarrito() {
    const total = carrito.reduce((suma, i) => suma + i.precio * i.cantidad, 0);

    const lista = carrito.length
      ? `<ul class="lista-carrito">${carrito
          .map(
            (i) => `
            <li>
              <div class="ci-info"><strong>${esc(i.nombre)}</strong><small>${soles(i.precio)} c/u</small></div>
              <div class="ci-cant">
                <button type="button" class="qty" data-menos="${i.id}">-</button>
                <span>${i.cantidad}</span>
                <button type="button" class="qty" data-mas="${i.id}">+</button>
              </div>
              <div class="ci-sub">${soles(i.precio * i.cantidad)}</div>
              <button type="button" class="quitar" data-quitar="${i.id}" title="Quitar">&times;</button>
            </li>`
          )
          .join('')}</ul>`
      : '<p class="vacio">Aún no hay productos</p>';

    zonaCarrito.innerHTML = `${lista}<div class="total"><span>Total</span><strong>${soles(total)}</strong></div>`;
    btnRegistrar.disabled = carrito.length === 0;
  }

  function agregar(id) {
    const producto = productos.find((p) => p.id === id);
    const item = carrito.find((i) => i.id === id);
    const actual = item ? item.cantidad : 0;

    if (actual + 1 > producto.stock) {
      return aviso(`Stock insuficiente de ${producto.nombre} (disponible: ${producto.stock})`, 'error');
    }
    if (item) item.cantidad += 1;
    else carrito.push({ id, nombre: producto.nombre, precio: producto.precio, cantidad: 1, stock: producto.stock });
    pintarCarrito();
  }

  contenedor.querySelector('#buscar').addEventListener('input', (e) => {
    busqueda = e.target.value;
    pintarProductos();
  });

  zonaProductos.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-id]');
    if (btn) agregar(Number(btn.dataset.id));
  });

  zonaCarrito.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const { mas, menos, quitar } = btn.dataset;

    if (mas) agregar(Number(mas));
    if (menos) {
      const item = carrito.find((i) => i.id === Number(menos));
      item.cantidad -= 1;
      if (item.cantidad <= 0) carrito = carrito.filter((i) => i !== item);
      pintarCarrito();
    }
    if (quitar) {
      carrito = carrito.filter((i) => i.id !== Number(quitar));
      pintarCarrito();
    }
  });

  btnRegistrar.addEventListener('click', async () => {
    btnRegistrar.disabled = true;
    try {
      const r = await api.crearVenta({
        cliente: contenedor.querySelector('#cliente').value,
        items: carrito.map((i) => ({ producto_id: i.id, cantidad: i.cantidad }))
      });
      aviso(`Venta N° ${r.id} registrada: ${soles(r.total)}`);
      renderVentas(contenedor);
    } catch (err) {
      aviso(err.message, 'error');
      btnRegistrar.disabled = false;
    }
  });

  pintarProductos();
  pintarCarrito();
}
