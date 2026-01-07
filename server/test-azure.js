import dotenv from 'dotenv';
import { uploadPhoto } from './src/services/azureBlobService.js';
import { readFileSync } from 'fs';

dotenv.config();

async function test() {
  try {
    // Prepare a test image
    const testImage = {
      buffer: readFileSync('./test-image.jpg'), // You need to prepare an image
      originalname: 'test.jpg',
      mimetype: 'image/jpeg'
    };
    
    console.log('Uploading...');
    const result = await uploadPhoto(testImage, 'photos');
    console.log('Upload successful:', result);
    
  } catch (error) {
    console.error('Upload failed:', error.message);
  }
}

test();
