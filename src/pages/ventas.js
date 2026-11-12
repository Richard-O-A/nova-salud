import { api } from '../api.js';
import { tabla } from '../components/tabla.js';
import { esc, soles, fecha, aviso } from '../utils.js';

export async function renderVentas(contenedor) {
  const productos = await api.productos();
  const ventas = await api.ventas();
  const disponibles = productos.filter((p) => p.stock > 0);
  let carrito = []; // { id, nombre, precio, cantidad }

  contenedor.innerHTML = `
    <h1>Ventas</h1>
    <section class="tarjeta">
      <h2>Nueva venta</h2>
      <div class="fila-venta">
        <label>Producto
          <select id="producto">
            ${disponibles.map((p) => `<option value="${p.id}">${esc(p.nombre)} - ${soles(p.precio)} (stock ${p.stock})</option>`).join('')}
          </select>
        </label>
        <label>Cantidad<input id="cantidad" type="number" min="1" value="1"></label>
        <button id="agregar" class="btn">Agregar</button>
      </div>
      <div id="zona-carrito"></div>
      <div class="fila-venta">
        <label>Cliente (opcional)<input id="cliente" placeholder="Nombre del cliente"></label>
        <button id="registrar" class="btn" disabled>Registrar venta</button>
      </div>
    </section>

    <section class="tarjeta">
      <h2>Últimas ventas</h2>
      ${tabla(
        [
          { titulo: 'N°', campo: 'id' },
          { titulo: 'Fecha', render: (v) => fecha(v.fecha) },
          { titulo: 'Cliente', render: (v) => esc(v.cliente || '-') },
          { titulo: 'Vendedor', campo: 'vendedor' },
          { titulo: 'Unidades', clase: 'num', campo: 'unidades' },
          { titulo: 'Total', clase: 'num', render: (v) => soles(v.total) }
        ],
        ventas,
        'Aún no hay ventas registradas'
      )}
    </section>`;

  const zona = contenedor.querySelector('#zona-carrito');
  const btnRegistrar = contenedor.querySelector('#registrar');

  function pintarCarrito() {
    const total = carrito.reduce((suma, i) => suma + i.precio * i.cantidad, 0);

    zona.innerHTML =
      tabla(
        [
          { titulo: 'Producto', campo: 'nombre' },
          { titulo: 'Cant.', clase: 'num', campo: 'cantidad' },
          { titulo: 'P. unit.', clase: 'num', render: (i) => soles(i.precio) },
          { titulo: 'Subtotal', clase: 'num', render: (i) => soles(i.precio * i.cantidad) },
          { titulo: '', render: (i) => `<button class="btn-mini sec" data-quitar="${i.id}">Quitar</button>` }
        ],
        carrito,
        'Agrega productos a la venta'
      ) + `<div class="total">Total: <strong>${soles(total)}</strong></div>`;

    btnRegistrar.disabled = carrito.length === 0;

    zona.querySelectorAll('[data-quitar]').forEach((btn) =>
      btn.addEventListener('click', () => {
        carrito = carrito.filter((i) => i.id !== Number(btn.dataset.quitar));
        pintarCarrito();
      })
    );
  }

  contenedor.querySelector('#agregar').addEventListener('click', () => {
    const id = Number(contenedor.querySelector('#producto').value);
    const cantidad = Number(contenedor.querySelector('#cantidad').value);
    const producto = disponibles.find((p) => p.id === id);

    if (!producto) return aviso('No hay productos con stock disponible', 'error');
    if (!Number.isInteger(cantidad) || cantidad <= 0) return aviso('Cantidad inválida', 'error');

    const existente = carrito.find((i) => i.id === id);
    const enCarrito = existente ? existente.cantidad : 0;
    if (enCarrito + cantidad > producto.stock) {
      return aviso(`Stock insuficiente (disponible: ${producto.stock})`, 'error');
    }

    if (existente) existente.cantidad += cantidad;
    else carrito.push({ id, nombre: producto.nombre, precio: producto.precio, cantidad });
    pintarCarrito();
  });

  btnRegistrar.addEventListener('click', async () => {
    btnRegistrar.disabled = true;
    try {
      const r = await api.crearVenta({
        cliente: contenedor.querySelector('#cliente').value,
        items: carrito.map((i) => ({ producto_id: i.id, cantidad: i.cantidad }))
      });
      aviso(`Venta N° ${r.id} registrada: ${soles(r.total)}`);
      renderVentas(contenedor); // recarga stock y lista de ventas
    } catch (err) {
      aviso(err.message, 'error');
      btnRegistrar.disabled = false;
    }
  });

  pintarCarrito();
}
