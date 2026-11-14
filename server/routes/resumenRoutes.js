import { Router } from 'express';
import { obtener } from '../controllers/resumenController.js';

const router = Router();

router.get('/', obtener);

export default router;
