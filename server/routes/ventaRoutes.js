import { Router } from 'express';
import { listar, crear } from '../controllers/ventaController.js';

const router = Router();

router.get('/', listar);   // Últimas ventas
router.post('/', crear);   // Registrar venta

export default router;
