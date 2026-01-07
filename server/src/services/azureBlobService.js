import { BlobServiceClient } from '@azure/storage-blob';
import path from 'path';
import crypto from 'crypto';

// Allowed file types and max size
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Initialize Blob Service Client
const getBlobServiceClient = () => {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  
  if (!connectionString) {
    throw new Error('Azure Storage connection string is not configured');
  }
  
  return BlobServiceClient.fromConnectionString(connectionString);
};

/**
 * Generate unique filename with timestamp and random string
 * @param {string} originalName - Original filename
 * @returns {string} - Unique filename
 */
const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalName);
  return `${timestamp}-${randomString}${ext}`;
};

/**
 * Validate file type and size
 * @param {Object} file - File object with buffer, mimetype, size
 * @throws {Error} - If validation fails
 */
const validateFile = (file) => {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    throw new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
  }
  
  // Check file size
  if (file.buffer.length > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
};

/**
 * Upload photo to Azure Blob Storage
 * @param {Object} file - File object with buffer, originalname, mimetype
 * @param {string} folder - Folder name within container (default: 'photos')
 * @returns {Promise<Object>} - { url, filename }
 */
export const uploadPhoto = async (file, folder = 'photos') => {
  try {
    // Validate file
    validateFile(file);
    
    // Generate unique filename
    const filename = generateUniqueFilename(file.originalname);
    const blobName = `${folder}/${filename}`;
    
    // Get blob service client
    const blobServiceClient = getBlobServiceClient();
    
    // Get container client
    const containerClient = blobServiceClient.getContainerClient('photos');
    
    // Ensure container exists
    await containerClient.createIfNotExists({
      access: 'blob' // Public access for blobs
    });
    
    // Get block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Upload file
    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype
      }
    });
    
    // Return URL and filename
    return {
      url: blockBlobClient.url,
      filename: blobName
    };
    
  } catch (error) {
    if (error.message.includes('connection string')) {
      throw new Error('Azure Storage connection failed: Invalid or missing connection string');
    }
    
    if (error.statusCode === 403) {
      throw new Error('Azure Storage upload failed: Access denied');
    }
    
    throw new Error(`Failed to upload photo: ${error.message}`);
  }
};

/**
 * Delete blob from Azure Blob Storage
 * @param {string} blobUrl - Full blob URL
 * @param {string} container - Container name (default: 'photos')
 * @returns {Promise<boolean>} - Success status
 */
export const deleteBlob = async (blobUrl, container = 'photos') => {
  try {
    // Extract blob name from URL
    const url = new URL(blobUrl);
    const pathParts = url.pathname.split('/');
    
    // Remove container name from path (first element after split)
    pathParts.shift(); // Remove empty string
    pathParts.shift(); // Remove container name
    
    const blobName = pathParts.join('/');
    
    if (!blobName) {
      throw new Error('Invalid blob URL: Could not extract blob name');
    }
    
    // Get blob service client
    const blobServiceClient = getBlobServiceClient();
    
    // Get container client
    const containerClient = blobServiceClient.getContainerClient(container);
    
    // Get block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Delete blob
    await blockBlobClient.deleteIfExists();
    
    return true;
    
  } catch (error) {
    if (error.message.includes('connection string')) {
      throw new Error('Azure Storage connection failed: Invalid or missing connection string');
    }
    
    console.error('Failed to delete blob:', error.message);
    return false;
  }
};
