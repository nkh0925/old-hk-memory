import express from 'express';
import authRoutes from './auth.js';
import districtRoutes from './districts.js';

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/districts', districtRoutes);

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
