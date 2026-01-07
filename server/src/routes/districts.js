import express from 'express';
import * as districtController from '../controllers/districtController.js';

const router = express.Router();

// Public routes
router.post('/list', districtController.list);
router.post('/detail', districtController.detail);

export default router;
