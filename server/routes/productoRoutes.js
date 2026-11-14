import { Router } from 'express';
import { soloAdmin } from '../middleware/auth.js';
import { listar, crear, actualizar, ingresarStock } from '../controllers/productoController.js';

const router = Router();

router.get('/', listar);                                
router.post('/', soloAdmin, crear);                     
router.put('/:id', soloAdmin, actualizar);              
router.post('/:id/entrada', soloAdmin, ingresarStock);  

export default router;
