// server/src/routes/photos.js

import { Router } from 'express';
import auth from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';  // Fixed: Use named import
import {
  uploadPhoto,
  getPhotos,
  getMapMarkers,
  getPhotoDetail,
  getNearbyPhotos,
  deletePhoto 
} from '../controllers/photoController.js';

const router = Router();

// Public routes (no auth required)
router.post('/list', getPhotos);
router.post('/map', getMapMarkers);
router.post('/detail', getPhotoDetail);
router.post('/nearby', getNearbyPhotos);

// Protected routes (auth required)
router.post('/upload', auth, uploadSingle, uploadPhoto);
router.post('/delete', auth, deletePhoto);
export default router;
