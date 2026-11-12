import { api } from '../api.js';
import { tabla } from '../components/tabla.js';
import { esc, fecha } from '../utils.js';

export async function renderKardex(contenedor) {
  const productos = await api.productos();

  contenedor.innerHTML = `
    <h1>Inventario - Kardex</h1>
    <section class="tarjeta">
      <label>Producto
        <select id="filtro">
          <option value="">Todos los productos</option>
          ${productos.map((p) => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('')}
        </select>
      </label>
      <div id="zona"></div>
    </section>`;

  const filtro = contenedor.querySelector('#filtro');
  const zona = contenedor.querySelector('#zona');

  async function cargar() {
    const movimientos = await api.kardex(filtro.value);
    zona.innerHTML = tabla(
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
      movimientos,
      'Sin movimientos'
    );
  }

  filtro.addEventListener('change', cargar);
  await cargar();
}
