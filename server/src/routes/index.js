import express from 'express';
import authRoutes from './auth.js';

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString()
    },
    message: 'API is running'
  });
});

export default router;
