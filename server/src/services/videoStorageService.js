import { BlobServiceClient } from '@azure/storage-blob';
import axios from 'axios';
import { Readable } from 'stream';
import crypto from 'crypto';

// Configuration
const CONTAINER_NAME = 'videos';
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const DOWNLOAD_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const CONTENT_TYPE = 'video/mp4';

/**
 * Initialize Blob Service Client
 * @returns {BlobServiceClient} - Azure Blob Service Client
 * @throws {Error} - If connection string is not configured
 */
const getBlobServiceClient = () => {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  
  if (!connectionString) {
    throw new Error('Azure Storage connection string is not configured');
  }
  
  return BlobServiceClient.fromConnectionString(connectionString);
};

/**
 * Generate unique filename for video
 * Format: {photoId}_{timestamp}_{random}.mp4
 * @param {string} photoId - Photo ID
 * @returns {string} - Unique filename
 */
const generateVideoFilename = (photoId) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  return `${photoId}_${timestamp}_${randomString}.mp4`;
};

/**
 * Extract blob name from Azure Blob URL
 * @param {string} blobUrl - Full Azure Blob URL
 * @returns {string} - Blob name (path within container)
 * @throws {Error} - If URL is invalid
 */
const extractBlobName = (blobUrl) => {
  try {
    const url = new URL(blobUrl);
    const pathParts = url.pathname.split('/');
    
    // Remove empty string and container name
    pathParts.shift(); // Remove empty string
    pathParts.shift(); // Remove container name
    
    const blobName = pathParts.join('/');
    
    if (!blobName) {
      throw new Error('Could not extract blob name from URL');
    }
    
    return blobName;
  } catch (error) {
    throw new Error(`Invalid blob URL: ${error.message}`);
  }
};

/**
 * Download video from Doubao URL and upload to Azure Blob Storage
 * 
 * @param {string} doubaoVideoUrl - Temporary video URL from Doubao (expires in 24h)
 * @param {string} photoId - Photo ID for filename generation
 * @returns {Promise<Object>} - { success: boolean, data?: { url, filename, size }, error?: { code, message } }
 */
export const downloadAndUploadVideo = async (doubaoVideoUrl, photoId) => {
  let downloadStream = null;
  
  try {
    // Validate parameters
    if (!doubaoVideoUrl || typeof doubaoVideoUrl !== 'string') {
      return {
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Video URL is required and must be a string'
        }
      };
    }
    
    if (!photoId || typeof photoId !== 'string') {
      return {
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Photo ID is required and must be a string'
        }
      };
    }
    
    console.log(`📥 Downloading video from Doubao for photo ${photoId}...`);
    
    // Download video from Doubao URL with streaming
    let response;
    try {
      response = await axios({
        method: 'GET',
        url: doubaoVideoUrl,
        responseType: 'stream',
        timeout: DOWNLOAD_TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8'
        },
        maxRedirects: 5 // 允许跟随重定向
      });
    } catch (error) {
      // 打印完整的原始错误，防止 message 为空的情况
      console.error('Axios Download Raw Error:', error.message || error.code || 'Unknown stream error');
      
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: {
            code: 'DOWNLOAD_TIMEOUT',
            message: 'Video download timeout: Request exceeded 5 minutes'
          }
        };
      }
      
      if (error.response && error.response.status === 404) {
        return {
          success: false,
          error: {
            code: 'VIDEO_NOT_FOUND',
            message: 'Video not found at URL'
          }
        };
      }
      
      return {
        success: false,
        error: {
          code: 'DOWNLOAD_FAILED',
          message: `Failed to download video: ${error.message || error.code || 'Connection reset by peer'}`
        }
      };
    }
    
    downloadStream = response.data;
    
    // Check content length
    const contentLength = parseInt(response.headers['content-length'] || '0', 10);
    
    if (contentLength > MAX_VIDEO_SIZE) {
      downloadStream.destroy();
      return {
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `Video size (${(contentLength / 1024 / 1024).toFixed(2)}MB) exceeds maximum limit of ${MAX_VIDEO_SIZE / 1024 / 1024}MB`
        }
      };
    }
    
    console.log(`Video downloaded (${(contentLength / 1024 / 1024).toFixed(2)}MB)`);
    
    // Generate unique filename
    const filename = generateVideoFilename(photoId);
    
    console.log(`Uploading to Azure Blob Storage: ${filename}...`);
    
    // Get blob service client
    const blobServiceClient = getBlobServiceClient();
    
    // Get container client
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    
    // Ensure container exists with public blob access
    await containerClient.createIfNotExists({
      access: 'blob' // Public read access for blobs
    });
    
    // Get block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(filename);
    
    // Upload stream to Azure Blob
    try {
      await blockBlobClient.uploadStream(
        downloadStream,
        undefined, // bufferSize (use default)
        undefined, // maxConcurrency (use default)
        {
          blobHTTPHeaders: {
            blobContentType: CONTENT_TYPE
          }
        }
      );
    } catch (error) {
      // Handle Azure upload errors
      if (error.statusCode === 403) {
        return {
          success: false,
          error: {
            code: 'AZURE_ACCESS_DENIED',
            message: 'Azure Storage upload failed: Access denied. Check connection string and permissions.'
          }
        };
      }
      
      if (error.code === 'ContainerNotFound') {
        return {
          success: false,
          error: {
            code: 'AZURE_CONTAINER_ERROR',
            message: `Azure Storage container '${CONTAINER_NAME}' not found or inaccessible`
          }
        };
      }
      
      return {
        success: false,
        error: {
          code: 'AZURE_UPLOAD_FAILED',
          message: `Failed to upload to Azure: ${error.message}`
        }
      };
    }
    
    const blobUrl = blockBlobClient.url;
    
    console.log(`✅ Video uploaded successfully: ${blobUrl}`);
    
    // Return success response
    return {
      success: true,
      data: {
        url: blobUrl,
        filename: filename,
        size: contentLength
      }
    };
    
  } catch (error) {
    // Handle unexpected errors
    console.error('❌ Unexpected error in downloadAndUploadVideo:', error);
    
    // Clean up stream if still open
    if (downloadStream && !downloadStream.destroyed) {
      downloadStream.destroy();
    }
    
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: `Unexpected error: ${error.message}`
      }
    };
  }
};

/**
 * Delete video from Azure Blob Storage
 * 
 * @param {string} blobUrl - Full Azure Blob URL
 * @returns {Promise<Object>} - { success: boolean, error?: { code, message } }
 */
export const deleteVideo = async (blobUrl) => {
  try {
    // Validate parameter
    if (!blobUrl || typeof blobUrl !== 'string') {
      return {
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Blob URL is required and must be a string'
        }
      };
    }
    
    console.log(`🗑️  Deleting video from Azure: ${blobUrl}`);
    
    // Extract blob name from URL
    let blobName;
    try {
      blobName = extractBlobName(blobUrl);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INVALID_URL',
          message: error.message
        }
      };
    }
    
    // Get blob service client
    const blobServiceClient = getBlobServiceClient();
    
    // Get container client
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    
    // Get block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Delete blob (returns true if deleted, false if not found)
    const deleteResponse = await blockBlobClient.deleteIfExists();
    
    if (!deleteResponse.succeeded) {
      console.log(`⚠️  Video not found in Azure: ${blobName}`);
      return {
        success: false,
        error: {
          code: 'BLOB_NOT_FOUND',
          message: 'Video not found in Azure Blob Storage'
        }
      };
    }
    
    console.log(`✅ Video deleted successfully: ${blobName}`);
    
    return {
      success: true
    };
    
  } catch (error) {
    // Handle Azure errors
    if (error.message.includes('connection string')) {
      return {
        success: false,
        error: {
          code: 'AZURE_CONNECTION_ERROR',
          message: 'Azure Storage connection failed: Invalid or missing connection string'
        }
      };
    }
    
    if (error.statusCode === 403) {
      return {
        success: false,
        error: {
          code: 'AZURE_ACCESS_DENIED',
          message: 'Azure Storage delete failed: Access denied'
        }
      };
    }
    
    console.error('❌ Failed to delete video:', error.message);
    
    return {
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: `Failed to delete video: ${error.message}`
      }
    };
  }
};

/**
 * Get video URL (public blob URL)
 * Note: Videos are stored with public blob access, so no SAS token needed
 * 
 * @param {string} blobName - Blob name (filename within container)
 * @returns {Promise<Object>} - { success: boolean, data?: { url }, error?: { code, message } }
 */
export const getVideoUrl = async (blobName) => {
  try {
    // Validate parameter
    if (!blobName || typeof blobName !== 'string') {
      return {
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Blob name is required and must be a string'
        }
      };
    }
    
    // Get blob service client
    const blobServiceClient = getBlobServiceClient();
    
    // Get container client
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    
    // Get block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Check if blob exists
    const exists = await blockBlobClient.exists();
    
    if (!exists) {
      return {
        success: false,
        error: {
          code: 'BLOB_NOT_FOUND',
          message: 'Video not found in Azure Blob Storage'
        }
      };
    }
    
    // Return public blob URL
    return {
      success: true,
      data: {
        url: blockBlobClient.url
      }
    };
    
  } catch (error) {
    // Handle Azure errors
    if (error.message.includes('connection string')) {
      return {
        success: false,
        error: {
          code: 'AZURE_CONNECTION_ERROR',
          message: 'Azure Storage connection failed: Invalid or missing connection string'
        }
      };
    }
    
    console.error('❌ Failed to get video URL:', error.message);
    
    return {
      success: false,
      error: {
        code: 'GET_URL_FAILED',
        message: `Failed to get video URL: ${error.message}`
      }
    };
  }
};

export default {
  downloadAndUploadVideo,
  deleteVideo,
  getVideoUrl
};
