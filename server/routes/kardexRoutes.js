import { Router } from 'express';
import { listar } from '../controllers/kardexController.js';

const router = Router();

router.get('/', listar);

export default router;
