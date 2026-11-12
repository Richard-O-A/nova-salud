import { Router } from 'express';
import { obtener } from '../controllers/resumenController.js';

const router = Router();

router.get('/', obtener);  // Resumen de ingresos y salidas

export default router;
