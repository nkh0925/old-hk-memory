import axios from 'axios';
import { processImageForDoubao } from './imageProcessor.js';

// API Configuration
const DOUBAO_API_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks';
const DEFAULT_MODEL = 'ep-20260210222658-nm48m';
const DEFAULT_DURATION = 10;
const DEFAULT_RESOLUTION = '720p';
const DEFAULT_RATIO = 'adaptive';
const DEFAULT_WATERMARK = false;

// Get API Key from environment
const getApiKey = () => {
  const apiKey = process.env.VOLCENGINE_API_KEY;
  
  if (!apiKey) {
    throw new Error('Doubao API key is not configured');
  }
  
  return apiKey;
};

/**
 * Create axios instance with default configuration
 * @returns {Object} - Axios instance
 */
const createAxiosInstance = () => {
  return axios.create({
    baseURL: DOUBAO_API_BASE_URL,
    timeout: 30000, // 30 seconds
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json'
    }
  });
};

/**
 * Handle API errors and return standardized error response
 * @param {Error} error - Error object
 * @returns {Object} - Standardized error response
 */
const handleApiError = (error) => {
  // Network error
  if (error.code === 'ECONNABORTED') {
    return {
      success: false,
      error: {
        code: 'TIMEOUT',
        message: 'Request timeout: API did not respond in time'
      }
    };
  }
  
  // Network connection error
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network error: Unable to connect to Doubao API'
      }
    };
  }
  
  // API response error
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    
    // Extract error details
    const errorCode = data?.error?.code || data?.code || `HTTP_${status}`;
    const errorMessage = data?.error?.message || data?.message || `Request failed with status ${status}`;
    
    // 4xx Client errors
    if (status >= 400 && status < 500) {
      return {
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
          details: data
        }
      };
    }
    
    // 5xx Server errors
    if (status >= 500) {
      return {
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
          details: data
        }
      };
    }
  }
  
  // Unknown error
  return {
    success: false,
    error: {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred'
    }
  };
};

/**
 * Validate image URL or base64 format
 * @param {string} imageInput - Image URL or base64 string
 * @returns {Object} - Validation result
 */
const validateImageInput = (imageInput) => {
  if (!imageInput || typeof imageInput !== 'string') {
    return {
      valid: false,
      error: 'Image input is required and must be a string'
    };
  }
  
  // Check if it's a base64 string
  if (imageInput.startsWith('data:image/')) {
    const validFormats = ['jpeg', 'jpg', 'png', 'webp', 'bmp', 'tiff', 'gif'];
    const formatMatch = imageInput.match(/data:image\/(.*?);base64,/);
    
    if (!formatMatch || !validFormats.includes(formatMatch[1].toLowerCase())) {
      return {
        valid: false,
        error: 'Invalid base64 image format. Supported: jpeg, png, webp, bmp, tiff, gif'
      };
    }
    
    return { valid: true };
  }
  
  // Check if it's a valid URL
  try {
    new URL(imageInput);
    return { valid: true };
  } catch {
    return {
      valid: false,
      error: 'Image input must be a valid URL or base64 string'
    };
  }
};

/**
 * Create video generation task
 * @param {string} imageInput - Image URL or base64 string (data:image/jpeg;base64,...)
 * @param {string} prompt - Text prompt for video generation
 * @param {Object} options - Optional parameters
 * @param {string} options.model - Model name (default: doubao-seedance-1-0-pro)
 * @param {number} options.duration - Video duration 2-12 seconds (default: 10)
 * @param {string} options.resolution - Video resolution: 480p/720p/1080p (default: 720p)
 * @param {string} options.ratio - Aspect ratio: 16:9/4:3/1:1/3:4/9:16/21:9/adaptive (default: adaptive)
 * @param {boolean} options.watermark - Add watermark (default: false)
 * @param {boolean} options.cameraFixed - Fixed camera (default: false)
 * @param {number} options.seed - Random seed: -1 or [0, 2^32-1] (default: -1)
 * @param {string} options.serviceTier - Service tier: default/flex (default: default)
 * @param {string} options.callbackUrl - Callback URL for task completion (optional)
 * @param {boolean} options.returnLastFrame - Return last frame image (default: false)
 * @param {number} options.executionExpiresAfter - Task expiration in seconds (default: 172800)
 * @returns {Promise<Object>} - Standardized response with task ID
 */
/**
 * Create video generation task with automatic image processing
 * @param {string} imageInput - Image URL or base64 string
 * @param {string} prompt - Text prompt for video generation
 * @param {Object} options - Optional parameters
 * @returns {Promise<Object>} - Standardized response with task ID
 */
export const createTask = async (imageInput, prompt, options = {}) => {
  try {
    // Validate prompt
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return {
        success: false,
        error: {
          code: 'INVALID_PROMPT',
          message: 'Prompt is required and must be a non-empty string'
        }
      };
    }
    
    // Validate duration
    const duration = options.duration || DEFAULT_DURATION;
    if (duration < 2 || duration > 12) {
      return {
        success: false,
        error: {
          code: 'INVALID_DURATION',
          message: 'Duration must be between 2 and 12 seconds'
        }
      };
    }
    
    // Process image to meet Doubao requirements
    console.log('🖼️  Processing image...');
    const processResult = await processImageForDoubao(imageInput);
    
    if (!processResult.success) {
      return processResult;
    }
    
    const { base64Image, metadata } = processResult.data;
    
    console.log(`✅ Image ready: ${metadata.width}x${metadata.height}${metadata.wasResized ? ' (resized)' : ''}`);
    
    // Build content array
    const content = [
      {
        type: 'image_url',
        image_url: {
          url: base64Image
        }
      },
      {
        type: 'text',
        text: prompt
      }
    ];
    
    // Build request payload
    const payload = {
      model: options.model || DEFAULT_MODEL,
      content: content,
      duration: duration,
      resolution: options.resolution || DEFAULT_RESOLUTION,
      ratio: options.ratio || DEFAULT_RATIO,
      watermark: options.watermark !== undefined ? options.watermark : DEFAULT_WATERMARK,
      camera_fixed: options.cameraFixed || false,
      seed: options.seed !== undefined ? options.seed : -1,
      service_tier: options.serviceTier || 'default'
    };
    
    // Add optional parameters
    if (options.callbackUrl) {
      payload.callback_url = options.callbackUrl;
    }
    
    if (options.returnLastFrame !== undefined) {
      payload.return_last_frame = options.returnLastFrame;
    }
    
    if (options.executionExpiresAfter) {
      payload.execution_expires_after = options.executionExpiresAfter;
    }
    
    // Create axios instance
    const axiosInstance = createAxiosInstance();
    
    // Make API request
    console.log('🚀 Submitting task to Doubao API...');
    const response = await axiosInstance.post('', payload);
    
    // Return standardized success response
    return {
      success: true,
      data: {
        ...response.data,
        imageMetadata: metadata
      }
    };
    
  } catch (error) {
    return handleApiError(error);
  }
};


/**
 * Query video generation task status
 * @param {string} taskId - Task ID to query
 * @returns {Promise<Object>} - Standardized response with task status and result
 */
export const queryTask = async (taskId) => {
  try {
    // Validate required parameter
    if (!taskId || typeof taskId !== 'string') {
      return {
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'taskId is required and must be a string'
        }
      };
    }
    
    // Create axios instance
    const axiosInstance = createAxiosInstance();
    
    // Make API request
    const response = await axiosInstance.get(`/${taskId}`);
    
    // Return standardized success response
    return {
      success: true,
      data: response.data
    };
    
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Cancel or delete video generation task
 * Behavior depends on task status:
 * - queued: Cancel task → status becomes 'cancelled'
 * - running: Not allowed
 * - succeeded/failed/expired: Delete record → task becomes not queryable
 * - cancelled: Not allowed
 * 
 * @param {string} taskId - Task ID to cancel/delete
 * @returns {Promise<Object>} - Standardized response
 */
export const cancelTask = async (taskId) => {
  try {
    // Validate required parameter
    if (!taskId || typeof taskId !== 'string') {
      return {
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'taskId is required and must be a string'
        }
      };
    }
    
    // Create axios instance
    const axiosInstance = createAxiosInstance();
    
    // Make API request (returns 204 No Content on success)
    await axiosInstance.delete(`/${taskId}`);
    
    // Return standardized success response
    return {
      success: true,
      data: {
        message: 'Task cancelled or deleted successfully'
      }
    };
    
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Poll task status until completion or timeout
 * @param {string} taskId - Task ID to poll
 * @param {Object} options - Polling options
 * @param {number} options.initialDelay - Initial delay in ms (default: 5000)
 * @param {number} options.pollingInterval - Polling interval in ms (default: 10000)
 * @param {number} options.maxAttempts - Maximum polling attempts (default: 30, ~5min)
 * @param {Function} options.onProgress - Callback for progress updates (receives task data)
 * @returns {Promise<Object>} - Final task result with video URL
 */
export const pollTaskStatus = async (taskId, options = {}) => {
  const {
    initialDelay = 5000,
    pollingInterval = 10000,
    maxAttempts = 30,
    onProgress = null
  } = options;
  
  try {
    // Initial delay before first poll
    await new Promise(resolve => setTimeout(resolve, initialDelay));
    
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      // Query task status
      const result = await queryTask(taskId);
      
      if (!result.success) {
        return result;
      }
      
      const taskData = result.data;
      const status = taskData?.status;
      
      // Call progress callback if provided
      if (onProgress && typeof onProgress === 'function') {
        onProgress(taskData);
      }
      
      // Check terminal states
      if (status === 'succeeded') {
        // Warn about video URL expiration
        if (taskData.content?.video_url) {
          console.warn('⚠️  Video URL is valid for 24 hours only. Download immediately!');
        }
        
        return {
          success: true,
          data: taskData
        };
      }
      
      if (status === 'failed') {
        return {
          success: false,
          error: {
            code: 'TASK_FAILED',
            message: taskData.error?.message || 'Task failed',
            details: taskData.error
          }
        };
      }
      
      if (status === 'expired') {
        return {
          success: false,
          error: {
            code: 'TASK_EXPIRED',
            message: 'Task expired due to timeout',
            details: taskData
          }
        };
      }
      
      if (status === 'cancelled') {
        return {
          success: false,
          error: {
            code: 'TASK_CANCELLED',
            message: 'Task was cancelled',
            details: taskData
          }
        };
      }
      
      // Continue polling for queued/running states
      if (status === 'queued' || status === 'running') {
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
        continue;
      }
      
      // Unknown status
      return {
        success: false,
        error: {
          code: 'UNKNOWN_STATUS',
          message: `Unknown task status: ${status}`,
          details: taskData
        }
      };
    }
    
    // Max attempts reached
    return {
      success: false,
      error: {
        code: 'POLLING_TIMEOUT',
        message: `Polling timeout: Maximum attempts (${maxAttempts}) reached after ${(maxAttempts * pollingInterval / 1000).toFixed(0)} seconds`
      }
    };
    
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Helper function to download video from temporary URL
 * Note: Video URLs expire after 24 hours, must download immediately
 * 
 * @param {string} videoUrl - Temporary video URL from task result
 * @param {string} outputPath - Local file path to save video
 * @returns {Promise<Object>} - Download result
 */
export const downloadVideo = async (videoUrl, outputPath) => {
  try {
    if (!videoUrl || typeof videoUrl !== 'string') {
      return {
        success: false,
        error: {
          code: 'INVALID_URL',
          message: 'Video URL is required'
        }
      };
    }
    
    const response = await axios({
      method: 'GET',
      url: videoUrl,
      responseType: 'stream',
      timeout: 60000 // 60 seconds for video download
    });
    
    const fs = await import('fs');
    const writer = fs.createWriteStream(outputPath);
    
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        resolve({
          success: true,
          data: {
            path: outputPath,
            message: 'Video downloaded successfully'
          }
        });
      });
      
      writer.on('error', (error) => {
        reject({
          success: false,
          error: {
            code: 'DOWNLOAD_ERROR',
            message: error.message
          }
        });
      });
    });
    
  } catch (error) {
    return handleApiError(error);
  }
};

export default {
  createTask,
  queryTask,
  cancelTask,
  pollTaskStatus
};