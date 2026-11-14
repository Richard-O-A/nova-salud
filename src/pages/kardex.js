import { api } from '../api.js';
import { tabla } from '../components/tabla.js';
import { esc, fecha } from '../utils.js';

export async function renderKardex(contenedor) {
  const productos = await api.productos();
  let movimientos = [];

  contenedor.innerHTML = `
    <h1>Inventario - Kardex</h1>
    <p class="sub">Historial de entradas y salidas de mercadería</p>

    <section class="tarjeta">
      <div class="filtros">
        <label>Producto
          <select id="filtro-producto">
            <option value="">Todos los productos</option>
            ${productos.map((p) => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('')}
          </select>
        </label>
        <label>Tipo de movimiento
          <select id="filtro-tipo">
            <option value="">Todos</option>
            <option value="ENTRADA">Entradas</option>
            <option value="SALIDA">Salidas</option>
          </select>
        </label>
      </div>
    </section>

    <div id="resumen-kardex" class="cards"></div>
    <section class="tarjeta"><div id="zona"></div></section>`;

  const filtroProducto = contenedor.querySelector('#filtro-producto');
  const filtroTipo = contenedor.querySelector('#filtro-tipo');

  function pintar() {
    const tipo = filtroTipo.value;
    const lista = tipo ? movimientos.filter((m) => m.tipo === tipo) : movimientos;
    const suma = (t) => lista.filter((m) => m.tipo === t).reduce((s, m) => s + m.cantidad, 0);

    const saldo =
      filtroProducto.value && movimientos.length
        ? `<div class="card"><span>Saldo actual</span><strong>${movimientos[0].saldo}</strong></div>`
        : '';

    contenedor.querySelector('#resumen-kardex').innerHTML = `
      <div class="card"><span>Movimientos</span><strong>${lista.length}</strong></div>
      <div class="card"><span>Unidades que entraron</span><strong>${suma('ENTRADA')}</strong></div>
      <div class="card"><span>Unidades que salieron</span><strong>${suma('SALIDA')}</strong></div>
      ${saldo}`;

    contenedor.querySelector('#zona').innerHTML =
      tabla(
        [
          { titulo: 'Fecha', render: (m) => fecha(m.fecha) },
          { titulo: 'Producto', campo: 'producto' },
          {
            titulo: 'Tipo',
            render: (m) => `<span class="badge ${m.tipo === 'ENTRADA' ? 'ok' : 'salida'}">${m.tipo}</span>`
          },
          { titulo: 'Cantidad', clase: 'num', campo: 'cantidad' },
          { titulo: 'Saldo', clase: 'num', campo: 'saldo' },
          { titulo: 'Motivo', campo: 'motivo' }
        ],
        lista,
        'Sin movimientos'
      ) + '<p class="nota">Se muestran los últimos 200 movimientos.</p>';
  }

  async function cargar() {
    movimientos = await api.kardex(filtroProducto.value);
    pintar();
  }

  filtroProducto.addEventListener('change', cargar);
  filtroTipo.addEventListener('change', pintar);
  await cargar();
}
