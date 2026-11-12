import { api } from '../api.js';
import { tabla } from '../components/tabla.js';
import { soles, fechaLima, aviso } from '../utils.js';

export async function renderResumen(contenedor) {
  contenedor.innerHTML = `
    <h1>Resumen de ingresos y salidas</h1>
    <section class="tarjeta">
      <form id="form-rango" class="fila-venta">
        <label>Desde<input type="date" name="desde" value="${fechaLima(-30)}" required></label>
        <label>Hasta<input type="date" name="hasta" value="${fechaLima()}" required></label>
        <button class="btn">Consultar</button>
      </form>
    </section>
    <div id="zona"></div>`;

  const zona = contenedor.querySelector('#zona');

  async function cargar(desde, hasta) {
    const r = await api.resumen(desde, hasta);

    zona.innerHTML = `
      <div class="cards">
        <div class="card"><span>Ingresos por ventas</span><strong>${soles(r.ingresos)}</strong></div>
        <div class="card"><span>Ventas realizadas</span><strong>${r.num_ventas}</strong></div>
        <div class="card"><span>Unidades que entraron</span><strong>${r.unidades_entrada}</strong></div>
        <div class="card"><span>Unidades que salieron</span><strong>${r.unidades_salida}</strong></div>
      </div>

      <section class="tarjeta">
        <h2>Alertas de reposición (stock bajo)</h2>
        ${tabla(
          [
            { titulo: 'Producto', campo: 'nombre' },
            { titulo: 'Stock', clase: 'num', render: (p) => `<span class="badge bajo">${p.stock}</span>` },
            { titulo: 'Mínimo', clase: 'num', campo: 'stock_minimo' }
          ],
          r.bajo_stock,
          'Todos los productos tienen stock suficiente'
        )}
      </section>

      <section class="tarjeta">
        <h2>Productos más vendidos</h2>
        ${tabla(
          [
            { titulo: 'Producto', campo: 'nombre' },
            { titulo: 'Unidades', clase: 'num', campo: 'unidades' },
            { titulo: 'Monto', clase: 'num', render: (p) => soles(p.monto) }
          ],
          r.mas_vendidos,
          'Sin ventas en el rango seleccionado'
        )}
      </section>`;
  }

  contenedor.querySelector('#form-rango').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      await cargar(f.get('desde'), f.get('hasta'));
    } catch (err) {
      aviso(err.message, 'error');
    }
  });

  await cargar(fechaLima(-30), fechaLima());
}
