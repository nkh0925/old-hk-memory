import express from 'express';
import auth from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes (require authentication)
router.post('/me', auth, authController.getMe);
router.post('/profile', auth, authController.updateProfile);

export default router;
