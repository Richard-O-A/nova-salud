import { esc } from '../utils.js';

// Tabla reutilizable.
// columnas: [{ titulo, campo }] o [{ titulo, render: (fila) => html }]
export function tabla(columnas, filas, textoVacio = 'Sin registros') {
  if (!filas.length) return `<p class="vacio">${esc(textoVacio)}</p>`;

  const cabecera = columnas.map((c) => `<th class="${c.clase || ''}">${esc(c.titulo)}</th>`).join('');
  const cuerpo = filas
    .map((fila) => {
      const celdas = columnas
        .map((c) => `<td class="${c.clase || ''}">${c.render ? c.render(fila) : esc(fila[c.campo])}</td>`)
        .join('');
      return `<tr>${celdas}</tr>`;
    })
    .join('');

  return `<div class="tabla-wrap"><table><thead><tr>${cabecera}</tr></thead><tbody>${cuerpo}</tbody></table></div>`;
}
