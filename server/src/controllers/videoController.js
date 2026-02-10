import Photo from '../models/Photo.js';
import * as doubaoVideoService from '../services/doubaoVideoService.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

/**
 * Default prompt template when photo has no story
 */
const DEFAULT_PROMPT = 'Generate a smooth camera movement showcasing this historic Hong Kong scene, bringing the old photograph to life with subtle motion.';

/**
 * Generate AI video from photo
 * POST /api/v1/videos/generate
 * @access Private (requires authentication)
 */
export const generateVideo = asyncHandler(async (req, res, next) => {
  const { photoId } = req.body;

  // 1. Validate photoId exists
  if (!photoId) {
    throw new AppError('VALIDATION_ERROR', 'Photo ID is required', 400);
  }

  // 2. Find photo by ID
  const photo = await Photo.findById(photoId);

  if (!photo) {
    throw new AppError('NOT_FOUND', 'Photo not found', 404);
  }

  // 3. Check ownership - photo must belong to authenticated user
  if (photo.uploader.toString() !== req.user._id.toString()) {
    throw new AppError('FORBIDDEN', 'You do not have permission to generate video for this photo', 403);
  }

  // 4. Check aiVideo status - must be 'none' or 'failed' to allow generation
  const currentStatus = photo.aiVideo?.status || 'none';
  
  if (currentStatus !== 'none' && currentStatus !== 'failed') {
    throw new AppError(
      'VALIDATION_ERROR',
      `Cannot generate video. Current status: ${currentStatus}. Only photos with status 'none' or 'failed' can generate new videos.`,
      400
    );
  }

  // 5. Get image URL from photo
  const imageUrl = photo.imageUrl;

  if (!imageUrl) {
    throw new AppError('VALIDATION_ERROR', 'Photo has no image URL', 400);
  }

  // 6. Prepare prompt - use story if available, otherwise use default
  const prompt = photo.story && photo.story.trim().length > 0 
    ? photo.story.trim() 
    : DEFAULT_PROMPT;

  // 7. Call Doubao API to create video generation task
  const taskResult = await doubaoVideoService.createTask(imageUrl, prompt, {
    duration: 10,
    resolution: '720p',
    ratio: 'adaptive',
    watermark: false,
    cameraFixed: false,
    seed: -1,
    serviceTier: 'default'
  });

  // 8. Handle Doubao API errors
  if (!taskResult.success) {
    throw new AppError(
      'SERVER_ERROR',
      `Failed to create video generation task: ${taskResult.error.message}`,
      500
    );
  }

  const taskId = taskResult.data.id;

  if (!taskId) {
    throw new AppError('SERVER_ERROR', 'No task ID returned from Doubao API', 500);
  }

  // 9. Update photo document with task information
  photo.aiVideo = {
    status: 'pending',
    jobId: taskId,
    prompt: prompt,
    url: undefined,
    duration: undefined,
    generatedAt: undefined,
    error: undefined
  };

  await photo.save();

  // 10. Return success response
  res.status(200).json({
    success: true,
    data: {
      photoId: photo._id,
      jobId: taskId,
      status: 'pending'
    },
    message: 'Video generation task created successfully'
  });
});

/**
 * Check video generation status and update photo
 * POST /api/v1/videos/status
 * @access Private (requires authentication)
 */
export const checkVideoStatus = asyncHandler(async (req, res, next) => {
  const { photoId } = req.body;

  // 1. Validate photoId exists
  if (!photoId) {
    throw new AppError('VALIDATION_ERROR', 'Photo ID is required', 400);
  }

  // 2. Find photo by ID
  const photo = await Photo.findById(photoId);

  if (!photo) {
    throw new AppError('NOT_FOUND', 'Photo not found', 404);
  }

  // 3. Get jobId from photo
  const jobId = photo.aiVideo?.jobId;

  if (!jobId) {
    throw new AppError('VALIDATION_ERROR', 'Photo has no video generation job', 400);
  }

  // 4. Query Doubao API for task status
  const taskResult = await doubaoVideoService.queryTask(jobId);

  if (!taskResult.success) {
    throw new AppError(
      'SERVER_ERROR',
      `Failed to query video generation status: ${taskResult.error.message}`,
      500
    );
  }

  const taskData = taskResult.data;
  const doubaoStatus = taskData.status;

  // 5. Update photo based on Doubao status
  let updatedStatus;
  let videoUrl = null;

  switch (doubaoStatus) {
    case 'queued':
    case 'running':
      // Task is still processing
      updatedStatus = 'processing';
      photo.aiVideo.status = updatedStatus;
      break;

    case 'succeeded':
      // Task completed successfully
      updatedStatus = 'completed';
      videoUrl = taskData.content?.video_url;
      
      photo.aiVideo.status = updatedStatus;
      photo.aiVideo.url = videoUrl; // Store temporary URL (valid 24h)
      photo.aiVideo.duration = taskData.duration || 10;
      photo.aiVideo.generatedAt = new Date();
      photo.aiVideo.error = undefined;
      break;

    case 'failed':
      // Task failed
      updatedStatus = 'failed';
      const errorMessage = taskData.error?.message || 'Video generation failed';
      
      photo.aiVideo.status = updatedStatus;
      photo.aiVideo.error = errorMessage;
      break;

    case 'expired':
      // Task expired due to timeout
      updatedStatus = 'failed';
      
      photo.aiVideo.status = updatedStatus;
      photo.aiVideo.error = 'Task expired due to timeout';
      break;

    case 'cancelled':
      // Task was cancelled
      updatedStatus = 'failed';
      
      photo.aiVideo.status = updatedStatus;
      photo.aiVideo.error = 'Task was cancelled';
      break;

    default:
      // Unknown status
      throw new AppError('SERVER_ERROR', `Unknown task status: ${doubaoStatus}`, 500);
  }

  await photo.save();

  // 6. Return response with current status
  const responseData = {
    photoId: photo._id,
    status: updatedStatus,
    jobId: jobId
  };

  // Include video URL if completed (warn: expires in 24h)
  if (updatedStatus === 'completed' && videoUrl) {
    responseData.videoUrl = videoUrl;
    responseData.warning = 'Video URL expires in 24 hours. Download immediately and upload to Azure Blob Storage.';
  }

  // Include error message if failed
  if (updatedStatus === 'failed' && photo.aiVideo.error) {
    responseData.error = photo.aiVideo.error;
  }

  res.status(200).json({
    success: true,
    data: responseData,
    message: `Video generation status: ${updatedStatus}`
  });
});

/**
 * Get video URL for completed video
 * POST /api/v1/videos/url
 * @access Public
 */
export const getVideoUrl = asyncHandler(async (req, res, next) => {
  const { photoId } = req.body;

  // 1. Validate photoId exists
  if (!photoId) {
    throw new AppError('VALIDATION_ERROR', 'Photo ID is required', 400);
  }

  // 2. Find photo by ID
  const photo = await Photo.findById(photoId);

  if (!photo) {
    throw new AppError('NOT_FOUND', 'Photo not found', 404);
  }

  // 3. Check aiVideo status must be 'completed'
  const status = photo.aiVideo?.status;

  if (status !== 'completed') {
    throw new AppError(
      'VALIDATION_ERROR',
      `Video is not ready. Current status: ${status || 'none'}`,
      400
    );
  }

  // 4. Get video URL
  const videoUrl = photo.aiVideo?.url;

  if (!videoUrl) {
    throw new AppError('SERVER_ERROR', 'Video URL not found despite completed status', 500);
  }

  // 5. Return video URL
  res.status(200).json({
    success: true,
    data: {
      videoUrl: videoUrl,
      duration: photo.aiVideo.duration,
      generatedAt: photo.aiVideo.generatedAt
    },
    message: 'Video URL retrieved successfully'
  });
});

export default {
  generateVideo,
  checkVideoStatus,
  getVideoUrl
};

