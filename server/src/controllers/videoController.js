import Photo from '../models/Photo.js';
import UserVideo from '../models/UserVideo.js';
import * as doubaoVideoService from '../services/doubaoVideoService.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

const DEFAULT_PROMPT =
  'Generate a smooth camera movement showcasing this historic Hong Kong scene, bringing the old photograph to life with subtle motion.';

// POST /api/v1/videos/generate
// Body: { photoId, prompt?, isCustom? }
export const generateVideo = asyncHandler(async (req, res, next) => {
  const { photoId, prompt: customPrompt, isCustom = false } = req.body;

  if (!photoId) {
    throw new AppError('VALIDATION_ERROR', 'Photo ID is required', 400);
  }

  const photo = await Photo.findById(photoId);

  if (!photo) {
    throw new AppError('NOT_FOUND', 'Photo not found', 404);
  }

  // Official Memory: uploader only
  if (!isCustom && photo.uploader.toString() !== req.user._id.toString()) {
    throw new AppError(
      'FORBIDDEN',
      'Only the uploader can generate the official memory video',
      403
    );
  }

  // Official Memory: block if already in progress or completed
  if (!isCustom) {
    const currentStatus = photo.aiVideo?.status || 'none';
    if (currentStatus !== 'none' && currentStatus !== 'failed') {
      throw new AppError(
        'VALIDATION_ERROR',
        `Cannot generate video. Current status: ${currentStatus}.`,
        400
      );
    }
  }

  if (!photo.imageUrl) {
    throw new AppError('VALIDATION_ERROR', 'Photo has no image URL', 400);
  }

  // Prompt priority:
  // 1. Custom prompt from request body (My Recreation)
  // 2. Photo story (Official Memory fallback)
  // 3. Default prompt
  const prompt =
    customPrompt?.trim() ||
    (photo.story?.trim().length > 0 ? photo.story.trim() : DEFAULT_PROMPT);

  const taskResult = await doubaoVideoService.createTask(photo.imageUrl, prompt, {
    duration: 10,
    resolution: '720p',
    ratio: 'adaptive',
    watermark: false,
    cameraFixed: false,
    seed: -1,
    serviceTier: 'default',
  });

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

  if (isCustom) {
    // My Recreation: persist to UserVideo collection
    await UserVideo.create({
      userId: req.user._id,
      photoId: photo._id,
      jobId: taskId,
      prompt,
      status: 'pending',
    });
  } else {
    // Official Memory: persist to Photo document
    photo.aiVideo = {
      status: 'pending',
      jobId: taskId,
      prompt,
      url: undefined,
      duration: undefined,
      generatedAt: undefined,
      error: undefined,
    };
    await photo.save();
  }

  res.status(200).json({
    success: true,
    data: {
      photoId: photo._id,
      jobId: taskId,
      status: 'pending',
      isCustom,
    },
    message: 'Video generation task created successfully',
  });
});

// POST /api/v1/videos/status
// Body: { photoId }
// Official Memory polling — reads jobId from Photo document
export const checkVideoStatus = asyncHandler(async (req, res, next) => {
  const { photoId } = req.body;

  if (!photoId) {
    throw new AppError('VALIDATION_ERROR', 'Photo ID is required', 400);
  }

  const photo = await Photo.findById(photoId);

  if (!photo) {
    throw new AppError('NOT_FOUND', 'Photo not found', 404);
  }

  const jobId = photo.aiVideo?.jobId;

  if (!jobId) {
    throw new AppError('VALIDATION_ERROR', 'Photo has no video generation job', 400);
  }

  const taskResult = await doubaoVideoService.queryTask(jobId);

  if (!taskResult.success) {
    throw new AppError(
      'SERVER_ERROR',
      `Failed to query video generation status: ${taskResult.error.message}`,
      500
    );
  }

  const taskData = taskResult.data;
  let updatedStatus;
  let videoUrl = null;

  switch (taskData.status) {
    case 'queued':
    case 'running':
      updatedStatus = 'processing';
      photo.aiVideo.status = updatedStatus;
      break;

    case 'succeeded':
      updatedStatus = 'completed';
      videoUrl = taskData.content?.video_url;
      photo.aiVideo.status = updatedStatus;
      photo.aiVideo.url = videoUrl;
      photo.aiVideo.duration = taskData.duration || 10;
      photo.aiVideo.generatedAt = new Date();
      photo.aiVideo.error = undefined;
      break;

    case 'failed':
      updatedStatus = 'failed';
      photo.aiVideo.status = updatedStatus;
      photo.aiVideo.error = taskData.error?.message || 'Video generation failed';
      break;

    case 'expired':
      updatedStatus = 'failed';
      photo.aiVideo.status = updatedStatus;
      photo.aiVideo.error = 'Task expired due to timeout';
      break;

    case 'cancelled':
      updatedStatus = 'failed';
      photo.aiVideo.status = updatedStatus;
      photo.aiVideo.error = 'Task was cancelled';
      break;

    default:
      throw new AppError('SERVER_ERROR', `Unknown task status: ${taskData.status}`, 500);
  }

  await photo.save();

  const responseData = {
    photoId: photo._id,
    status: updatedStatus,
    jobId,
  };

  if (updatedStatus === 'completed' && videoUrl) {
    responseData.videoUrl = videoUrl;
  }

  if (updatedStatus === 'failed' && photo.aiVideo.error) {
    responseData.error = photo.aiVideo.error;
  }

  res.status(200).json({
    success: true,
    data: responseData,
    message: `Video generation status: ${updatedStatus}`,
  });
});

// POST /api/v1/videos/job-status
// Body: { jobId }
// My Recreation polling — reads jobId directly, updates UserVideo document
export const getJobStatus = asyncHandler(async (req, res, next) => {
  const { jobId } = req.body;

  if (!jobId) {
    throw new AppError('VALIDATION_ERROR', 'Job ID is required', 400);
  }

  const userVideo = await UserVideo.findOne({ jobId });

  if (!userVideo) {
    throw new AppError('NOT_FOUND', 'Video job not found', 404);
  }

  // Ensure the requesting user owns this job
  if (userVideo.userId.toString() !== req.user._id.toString()) {
    throw new AppError('FORBIDDEN', 'You do not have permission to access this job', 403);
  }

  // If already terminal, return immediately without calling Doubao
  if (userVideo.status === 'completed' || userVideo.status === 'failed') {
    return res.status(200).json({
      success: true,
      data: {
        jobId,
        status: userVideo.status,
        videoUrl: userVideo.url || null,
        error: userVideo.error || null,
      },
      message: `Video generation status: ${userVideo.status}`,
    });
  }

  const taskResult = await doubaoVideoService.queryTask(jobId);

  if (!taskResult.success) {
    throw new AppError(
      'SERVER_ERROR',
      `Failed to query job status: ${taskResult.error.message}`,
      500
    );
  }

  const taskData = taskResult.data;
  let updatedStatus;
  let videoUrl = null;

  switch (taskData.status) {
    case 'queued':
    case 'running':
      updatedStatus = 'processing';
      userVideo.status = updatedStatus;
      break;

    case 'succeeded':
      updatedStatus = 'completed';
      videoUrl = taskData.content?.video_url;
      userVideo.status = updatedStatus;
      userVideo.url = videoUrl;
      userVideo.duration = taskData.duration || 10;
      userVideo.generatedAt = new Date();
      userVideo.error = undefined;
      break;

    case 'failed':
      updatedStatus = 'failed';
      userVideo.status = updatedStatus;
      userVideo.error = taskData.error?.message || 'Video generation failed';
      break;

    case 'expired':
      updatedStatus = 'failed';
      userVideo.status = updatedStatus;
      userVideo.error = 'Task expired due to timeout';
      break;

    case 'cancelled':
      updatedStatus = 'failed';
      userVideo.status = updatedStatus;
      userVideo.error = 'Task was cancelled';
      break;

    default:
      throw new AppError('SERVER_ERROR', `Unknown task status: ${taskData.status}`, 500);
  }

  await userVideo.save();

  res.status(200).json({
    success: true,
    data: {
      jobId,
      status: updatedStatus,
      videoUrl: videoUrl || null,
      error: userVideo.error || null,
    },
    message: `Video generation status: ${updatedStatus}`,
  });
});

// GET /api/v1/videos/my-videos
// Returns all completed UserVideo records for the authenticated user
export const getMyVideos = asyncHandler(async (req, res, next) => {
  const userVideos = await UserVideo.find({
    userId: req.user._id,
    status: 'completed',
  })
    .populate('photoId', 'imageUrl thumbnailUrl district era')
    .sort({ generatedAt: -1 });

  const data = userVideos.map((v) => ({
    videoId: v._id,
    photoId: v.photoId?._id,
    photoImageUrl: v.photoId?.thumbnailUrl || v.photoId?.imageUrl || null,
    photoEra: v.photoId?.era || null,
    prompt: v.prompt,
    url: v.url,
    duration: v.duration,
    generatedAt: v.generatedAt,
  }));

  res.status(200).json({
    success: true,
    data,
    message: 'User videos retrieved successfully',
  });
});

// POST /api/v1/videos/url
// Body: { photoId }
// Returns Official Memory video URL
export const getVideoUrl = asyncHandler(async (req, res, next) => {
  const { photoId } = req.body;

  if (!photoId) {
    throw new AppError('VALIDATION_ERROR', 'Photo ID is required', 400);
  }

  const photo = await Photo.findById(photoId);

  if (!photo) {
    throw new AppError('NOT_FOUND', 'Photo not found', 404);
  }

  if (photo.aiVideo?.status !== 'completed') {
    throw new AppError(
      'VALIDATION_ERROR',
      `Video is not ready. Current status: ${photo.aiVideo?.status || 'none'}`,
      400
    );
  }

  if (!photo.aiVideo?.url) {
    throw new AppError('SERVER_ERROR', 'Video URL not found despite completed status', 500);
  }

  res.status(200).json({
    success: true,
    data: {
      videoUrl: photo.aiVideo.url,
      duration: photo.aiVideo.duration,
      generatedAt: photo.aiVideo.generatedAt,
    },
    message: 'Video URL retrieved successfully',
  });
});

export default {
  generateVideo,
  checkVideoStatus,
  getJobStatus,
  getMyVideos,
  getVideoUrl,
};