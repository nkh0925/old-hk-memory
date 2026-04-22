import express from 'express';
import { body, validationResult } from 'express-validator';
import * as videoController from '../controllers/videoController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request parameters',
        details: errors.array(),
      },
    });
  }
  next();
};

// POST /api/v1/videos/generate
// Body: { photoId, prompt?, isCustom? }
router.post(
  '/generate',
  auth,
  [
    body('photoId')
      .notEmpty()
      .withMessage('Photo ID is required')
      .isMongoId()
      .withMessage('Invalid photo ID format'),
    body('prompt')
      .optional()
      .isString()
      .withMessage('Prompt must be a string')
      .isLength({ max: 500 })
      .withMessage('Prompt cannot exceed 500 characters'),
    body('isCustom')
      .optional()
      .isBoolean()
      .withMessage('isCustom must be a boolean'),
  ],
  validate,
  videoController.generateVideo
);

// POST /api/v1/videos/status
// Body: { photoId }
// Official Memory polling
router.post(
  '/status',
  auth,
  [
    body('photoId')
      .notEmpty()
      .withMessage('Photo ID is required')
      .isMongoId()
      .withMessage('Invalid photo ID format'),
  ],
  validate,
  videoController.checkVideoStatus
);

// POST /api/v1/videos/job-status
// Body: { jobId }
// My Recreation polling
router.post(
  '/job-status',
  auth,
  [
    body('jobId')
      .notEmpty()
      .withMessage('Job ID is required')
      .isString()
      .withMessage('Job ID must be a string'),
  ],
  validate,
  videoController.getJobStatus
);

// GET /api/v1/videos/my-videos
// Returns all completed UserVideo records for the authenticated user
router.get(
  '/my-videos',
  auth,
  videoController.getMyVideos
);

// POST /api/v1/videos/url
// Body: { photoId }
// Official Memory video URL
router.post(
  '/url',
  auth,
  [
    body('photoId')
      .notEmpty()
      .withMessage('Photo ID is required')
      .isMongoId()
      .withMessage('Invalid photo ID format'),
  ],
  validate,
  videoController.getVideoUrl
);

export default router;