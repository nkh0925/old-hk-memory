import dotenv from 'dotenv';
import videoStorageService from './src/services/videoStorageService.js';

dotenv.config();

const testVideoStorageService = async () => {
  console.log('🧪 Testing Video Storage Service...\n');

  try {
    // Test 1: Download and Upload Video
    console.log('--- Test 1: Download and upload video ---');
    
    // CHANGED: Using a 10-second sample video (~9MB) instead of the 150MB one
    const testVideoUrl = 'https://ark-content-generation-cn-beijing.tos-cn-beijing.volces.com/doubao-seedance-1-0-pro/02177502031161000000000000000000000ffffac15a1a7f16ee6.mp4?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20260401%2Fcn-beijing%2Ftos%2Frequest&X-Tos-Date=20260401T051245Z&X-Tos-Expires=86400&X-Tos-Signature=357f2c125bf7d58e0c2e1222a4c4a382984551fe58fd8a951453e0ce6a7533d4&X-Tos-SignedHeaders=host';
    const testPhotoId = '65a1b2c3d4e5f6g7h8i9j0k1';
    
    console.log('Downloading from:', testVideoUrl);
    console.log('Photo ID:', testPhotoId);
    console.log('⏳ This may take a minute...\n');
    
    const result = await videoStorageService.downloadAndUploadVideo(
      testVideoUrl,
      testPhotoId
    );
    
    if (result.success) {
      console.log('✅ Test 1 passed');
      console.log('   Azure Blob URL:', result.data.url);
      console.log('   Filename:', result.data.filename);
      console.log('   Size:', (result.data.size / 1024 / 1024).toFixed(2), 'MB');
      
      const blobUrl = result.data.url;
      const blobName = result.data.filename;

      // Test 2: Get Video URL
      console.log('\n--- Test 2: Get video URL ---');
      const urlResult = await videoStorageService.getVideoUrl(blobName);
      
      if (urlResult.success) {
        console.log('✅ Test 2 passed');
        console.log('   Video URL:', urlResult.data.url);
      } else {
        console.log('❌ Test 2 failed:', urlResult.error);
      }

      // Test 3: Delete Video
      console.log('\n--- Test 3: Delete video ---');
      const deleteResult = await videoStorageService.deleteVideo(blobUrl);
      
      if (deleteResult.success) {
        console.log('✅ Test 3 passed');
        console.log('   Video deleted successfully');
      } else {
        console.log('❌ Test 3 failed:', deleteResult.error);
      }
    } else {
      console.log('❌ Test 1 failed:', result.error);
    }

    // Test 4: Download from invalid URL
    console.log('\n--- Test 4: Download from invalid URL ---');
    const invalidResult = await videoStorageService.downloadAndUploadVideo(
      'https://invalid-url-12345.com/video.mp4',
      testPhotoId
    );
    
    if (!invalidResult.success) {
      console.log('✅ Test 4 passed - Error handled gracefully');
      console.log('   Error message:', invalidResult.error.message);
    } else {
      console.log('❌ Test 4 failed - Should have failed');
    }

    // Test 5: Get URL for non-existent blob
    console.log('\n--- Test 5: Get URL for non-existent blob ---');
    const nonExistentResult = await videoStorageService.getVideoUrl('non-existent-blob.mp4');
    
    // CHANGED: Correctly expects a failure here
    if (!nonExistentResult.success && nonExistentResult.error.code === 'BLOB_NOT_FOUND') {
      console.log('✅ Test 5 passed - Error handled gracefully');
      console.log('   Error:', nonExistentResult.error.message);
    } else {
      console.log('❌ Test 5 failed - Should have returned BLOB_NOT_FOUND error');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }

  console.log('\n🎉 All tests completed!');
};

testVideoStorageService();