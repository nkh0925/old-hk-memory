import dotenv from 'dotenv';
import videoStorageService from './src/services/videoStorageService.js';

dotenv.config();

const testVideoStorageService = async () => {
  console.log('🧪 Testing Video Storage Service...\n');

  try {
    // Test 1: Download and Upload Video
    console.log('--- Test 1: Download and upload video ---');
    
    // 使用一个公开的测试视频 URL
    const testVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
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
      console.log('   Azure Blob URL:', result.data.blobUrl);
      console.log('   Blob Name:', result.data.blobName);
      
      const blobUrl = result.data.blobUrl;
      const blobName = result.data.blobName;

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

      // Test 4: Delete non-existent video (should handle gracefully)
      console.log('\n--- Test 4: Delete non-existent video ---');
      const deleteAgainResult = await videoStorageService.deleteVideo(blobUrl);
      
      if (!deleteAgainResult.success) {
        console.log('✅ Test 4 passed - Error handled gracefully');
        console.log('   Error:', deleteAgainResult.error.message);
      } else {
        console.log('⚠️  Test 4 warning - Should have failed');
      }

    } else {
      console.log('❌ Test 1 failed:', result.error);
    }

    // Test 5: Download from invalid URL
    console.log('\n--- Test 5: Download from invalid URL ---');
    const invalidResult = await videoStorageService.downloadAndUploadVideo(
      'https://invalid-url-12345.com/video.mp4',
      testPhotoId
    );
    
    if (!invalidResult.success) {
      console.log('✅ Test 5 passed - Error handled gracefully');
      console.log('   Error:', invalidResult.error.message);
    } else {
      console.log('❌ Test 5 failed - Should have failed');
    }

    // Test 6: Get URL for non-existent blob
    console.log('\n--- Test 6: Get URL for non-existent blob ---');
    const nonExistentResult = await videoStorageService.getVideoUrl('non-existent-blob.mp4');
    
    if (nonExistentResult.success) {
      console.log('✅ Test 6 passed');
      console.log('   URL generated (blob may not exist):', nonExistentResult.data.url);
    } else {
      console.log('❌ Test 6 failed:', nonExistentResult.error);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error(error.stack);
  }

  console.log('\n🎉 Test completed!');
};

testVideoStorageService();
