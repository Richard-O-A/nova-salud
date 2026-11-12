import { Router } from 'express';
import { listar, crear, actualizar, ingresarStock } from '../controllers/productoController.js';

const router = Router();

router.get('/', listar);                       // Listar productos
router.post('/', crear);                       // Registrar producto
router.put('/:id', actualizar);                // Editar producto
router.post('/:id/entrada', ingresarStock);    // Ingresar mercadería al almacén

export default router;
