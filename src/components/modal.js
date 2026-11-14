import { esc } from '../utils.js';

let cerrarActual = null;

export function abrirModal(titulo, html) {
  cerrarModal();

  const fondo = document.createElement('div');
  fondo.className = 'modal-fondo';
  fondo.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-cab">
        <h2>${esc(titulo)}</h2>
        <button type="button" class="modal-x" aria-label="Cerrar">&times;</button>
      </div>
      <div class="modal-cuerpo">${html}</div>
    </div>`;
  document.body.appendChild(fondo);

  const alTeclear = (e) => { if (e.key === 'Escape') cerrar(); };
  function cerrar() {
    fondo.remove();
    document.removeEventListener('keydown', alTeclear);
    cerrarActual = null;
  }

  fondo.addEventListener('mousedown', (e) => { if (e.target === fondo) cerrar(); });
  fondo.querySelector('.modal-x').addEventListener('click', cerrar);
  document.addEventListener('keydown', alTeclear);
  cerrarActual = cerrar;

  fondo.querySelector('input, select')?.focus();
  return { el: fondo.querySelector('.modal'), cerrar };
}

export function cerrarModal() {
  if (cerrarActual) cerrarActual();
}
