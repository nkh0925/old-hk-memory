import sharp from 'sharp';
import axios from 'axios';

// Doubao image requirements
const MIN_DIMENSION = 300;
const MAX_DIMENSION = 6000;
const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
const MIN_ASPECT_RATIO = 0.4;
const MAX_ASPECT_RATIO = 2.5;
const SUPPORTED_FORMATS = ['jpeg', 'png', 'webp', 'bmp', 'tiff', 'gif'];

/**
 * Download image from URL
 * @param {string} imageUrl - Image URL
 * @returns {Promise<Buffer>} - Image buffer
 */
const downloadImage = async (imageUrl) => {
  try {
    const response = await axios({
      method: 'GET',
      url: imageUrl,
      responseType: 'arraybuffer',
      timeout: 30000,
      maxContentLength: MAX_FILE_SIZE
    });
    
    return Buffer.from(response.data);
  } catch (error) {
    throw new Error(`Failed to download image: ${error.message}`);
  }
};

/**
 * Validate and get image metadata
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<Object>} - Image metadata
 */
const getImageMetadata = async (imageBuffer) => {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: imageBuffer.length,
      aspectRatio: metadata.width / metadata.height
    };
  } catch (error) {
    throw new Error(`Failed to read image metadata: ${error.message}`);
  }
};

/**
 * Check if image meets Doubao requirements
 * @param {Object} metadata - Image metadata
 * @returns {Object} - Validation result
 */
const validateImageRequirements = (metadata) => {
  const issues = [];
  
  // Check format
  if (!SUPPORTED_FORMATS.includes(metadata.format)) {
    issues.push(`Unsupported format: ${metadata.format}. Supported: ${SUPPORTED_FORMATS.join(', ')}`);
  }
  
  // Check file size
  if (metadata.size > MAX_FILE_SIZE) {
    issues.push(`File size ${(metadata.size / 1024 / 1024).toFixed(2)}MB exceeds 30MB limit`);
  }
  
  // Check dimensions
  if (metadata.width < MIN_DIMENSION || metadata.height < MIN_DIMENSION) {
    issues.push(`Dimensions ${metadata.width}x${metadata.height} below minimum ${MIN_DIMENSION}px`);
  }
  
  if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
    issues.push(`Dimensions ${metadata.width}x${metadata.height} exceed maximum ${MAX_DIMENSION}px`);
  }
  
  // Check aspect ratio
  if (metadata.aspectRatio < MIN_ASPECT_RATIO || metadata.aspectRatio > MAX_ASPECT_RATIO) {
    issues.push(`Aspect ratio ${metadata.aspectRatio.toFixed(2)} outside range (${MIN_ASPECT_RATIO}, ${MAX_ASPECT_RATIO})`);
  }
  
  return {
    valid: issues.length === 0,
    issues: issues,
    needsResize: metadata.width < MIN_DIMENSION || metadata.height < MIN_DIMENSION
  };
};

/**
 * Calculate new dimensions to meet minimum requirements
 * @param {number} width - Current width
 * @param {number} height - Current height
 * @returns {Object} - New dimensions
 */
const calculateResizeDimensions = (width, height) => {
  const aspectRatio = width / height;
  
  // If both dimensions are below minimum
  if (width < MIN_DIMENSION && height < MIN_DIMENSION) {
    // Scale based on the smaller dimension
    if (width < height) {
      const newWidth = MIN_DIMENSION;
      const newHeight = Math.round(newWidth / aspectRatio);
      return { width: newWidth, height: newHeight };
    } else {
      const newHeight = MIN_DIMENSION;
      const newWidth = Math.round(newHeight * aspectRatio);
      return { width: newWidth, height: newHeight };
    }
  }
  
  // If only width is below minimum
  if (width < MIN_DIMENSION) {
    const newWidth = MIN_DIMENSION;
    const newHeight = Math.round(newWidth / aspectRatio);
    return { width: newWidth, height: newHeight };
  }
  
  // If only height is below minimum
  if (height < MIN_DIMENSION) {
    const newHeight = MIN_DIMENSION;
    const newWidth = Math.round(newHeight * aspectRatio);
    return { width: newWidth, height: newHeight };
  }
  
  // No resize needed
  return { width, height };
};

/**
 * Resize image to meet Doubao requirements
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {Object} metadata - Image metadata
 * @returns {Promise<Buffer>} - Resized image buffer
 */
const resizeImage = async (imageBuffer, metadata) => {
  try {
    const newDimensions = calculateResizeDimensions(metadata.width, metadata.height);
    
    console.log(`📐 Resizing image from ${metadata.width}x${metadata.height} to ${newDimensions.width}x${newDimensions.height}`);
    
    // Resize image maintaining aspect ratio
    const resizedBuffer = await sharp(imageBuffer)
      .resize(newDimensions.width, newDimensions.height, {
        fit: 'fill',
        kernel: sharp.kernel.lanczos3 // High-quality resize
      })
      .jpeg({ quality: 95 }) // Convert to JPEG with high quality
      .toBuffer();
    
    return resizedBuffer;
  } catch (error) {
    throw new Error(`Failed to resize image: ${error.message}`);
  }
};

/**
 * Convert image buffer to base64 data URL
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} format - Image format (default: jpeg)
 * @returns {string} - Base64 data URL
 */
const bufferToBase64 = (imageBuffer, format = 'jpeg') => {
  const base64 = imageBuffer.toString('base64');
  return `data:image/${format};base64,${base64}`;
};

/**
 * Process image to meet Doubao requirements
 * Main function that handles download, validation, and resizing
 * 
 * @param {string} imageInput - Image URL or base64 string
 * @returns {Promise<Object>} - Processing result with base64 image
 */
export const processImageForDoubao = async (imageInput) => {
  try {
    let imageBuffer;
    let isBase64Input = false;
    
    // Handle base64 input
    if (imageInput.startsWith('data:image/')) {
      isBase64Input = true;
      const base64Data = imageInput.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } 
    // Handle URL input
    else {
      console.log('📥 Downloading image from URL...');
      imageBuffer = await downloadImage(imageInput);
    }
    
    // Get image metadata
    console.log('🔍 Analyzing image...');
    const metadata = await getImageMetadata(imageBuffer);
    
    console.log(`📊 Original image: ${metadata.width}x${metadata.height}, ${metadata.format}, ${(metadata.size / 1024).toFixed(2)}KB`);
    
    // Validate requirements
    const validation = validateImageRequirements(metadata);
    
    if (!validation.valid && !validation.needsResize) {
      return {
        success: false,
        error: {
          code: 'INVALID_IMAGE',
          message: 'Image does not meet requirements',
          issues: validation.issues
        }
      };
    }
    
    // Resize if needed
    let processedBuffer = imageBuffer;
    let processedMetadata = metadata;
    
    if (validation.needsResize) {
      console.log('🔧 Image needs resizing...');
      processedBuffer = await resizeImage(imageBuffer, metadata);
      processedMetadata = await getImageMetadata(processedBuffer);
      
      console.log(`✅ Resized to: ${processedMetadata.width}x${processedMetadata.height}, ${(processedMetadata.size / 1024).toFixed(2)}KB`);
      
      // Validate again after resize
      const finalValidation = validateImageRequirements(processedMetadata);
      
      if (!finalValidation.valid) {
        return {
          success: false,
          error: {
            code: 'RESIZE_FAILED',
            message: 'Image still does not meet requirements after resize',
            issues: finalValidation.issues
          }
        };
      }
    } else {
      console.log('✅ Image meets requirements, no resize needed');
    }
    
    // Convert to base64 for API submission
    const base64Image = bufferToBase64(processedBuffer, 'jpeg');
    
    return {
      success: true,
      data: {
        base64Image: base64Image,
        metadata: {
          width: processedMetadata.width,
          height: processedMetadata.height,
          format: 'jpeg',
          size: processedMetadata.size,
          aspectRatio: processedMetadata.aspectRatio,
          wasResized: validation.needsResize
        }
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'PROCESSING_ERROR',
        message: error.message
      }
    };
  }
};

/**
 * Quick validation without processing
 * @param {string} imageInput - Image URL or base64 string
 * @returns {Promise<Object>} - Validation result
 */
export const validateImage = async (imageInput) => {
  try {
    let imageBuffer;
    
    if (imageInput.startsWith('data:image/')) {
      const base64Data = imageInput.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      imageBuffer = await downloadImage(imageInput);
    }
    
    const metadata = await getImageMetadata(imageBuffer);
    const validation = validateImageRequirements(metadata);
    
    return {
      success: true,
      data: {
        valid: validation.valid,
        needsResize: validation.needsResize,
        issues: validation.issues,
        metadata: metadata
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message
      }
    };
  }
};
