import express from 'express';
import { body, param, validationResult } from 'express-validator';
import * as videoController from '../controllers/videoController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

/**
 * Validation middleware to check for validation errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request parameters',
        details: errors.array()
      }
    });
  }
  next();
};

/**
 * @route   POST /api/v1/videos/generate
 * @desc    Trigger AI video generation for a photo
 * @access  Private (requires authentication)
 * @body    { photoId: string }
 */
router.post(
  '/generate',
  auth,
  [
    body('photoId')
      .notEmpty()
      .withMessage('Photo ID is required')
      .isMongoId()
      .withMessage('Invalid photo ID format')
  ],
  validate,
  videoController.generateVideo
);

/**
 * @route   POST /api/v1/videos/status
 * @desc    Check video generation status and update photo
 * @access  Private (requires authentication)
 * @body    { photoId: string }
 */
router.post(
  '/status',
  auth,
  [
    body('photoId')
      .notEmpty()
      .withMessage('Photo ID is required')
      .isMongoId()
      .withMessage('Invalid photo ID format')
  ],
  validate,
  videoController.checkVideoStatus
);

/**
 * @route   POST /api/v1/videos/url
 * @desc    Get generated video URL for a completed video
 * @access  Public
 * @body    { photoId: string }
 */
router.post(
  '/url',
  [
    body('photoId')
      .notEmpty()
      .withMessage('Photo ID is required')
      .isMongoId()
      .withMessage('Invalid photo ID format')
  ],
  validate,
  videoController.getVideoUrl
);

export default router;
