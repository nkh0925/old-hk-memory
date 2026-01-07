import { Router } from 'express';
import auth from '../middleware/auth.js';
import { getUserPhotos } from '../controllers/photoController.js';

const router = Router();

router.post('/photos', auth, getUserPhotos);

export default router;
