import videoService from './src/services/videoService';

// Mock photo ID (replace with real one from your database)
const TEST_PHOTO_ID = '65a1b2c3d4e5f6g7h8i9j0k1';

const testVideoService = async () => {
  console.log('🧪 Testing Video Service...\n');

  try {
    // Test 1: Generate Video
    console.log('--- Test 1: Generate video ---');
    console.log('Photo ID:', TEST_PHOTO_ID);
    
    const generateResult = await videoService.generateVideo(TEST_PHOTO_ID);
    console.log('✅ Generate video response:', generateResult);
    console.log('   Job ID:', generateResult.jobId);
    console.log('   Status:', generateResult.status);

    // Wait 5 seconds
    console.log('\n⏳ Waiting 5 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Test 2: Check Video Status
    console.log('--- Test 2: Check video status ---');
    const statusResult = await videoService.checkVideoStatus(TEST_PHOTO_ID);
    console.log('✅ Check status response:', statusResult);
    console.log('   Status:', statusResult.status);
    
    if (statusResult.videoUrl) {
      console.log('   Video URL:', statusResult.videoUrl.substring(0, 50) + '...');
    }

    // Test 3: Get Video URL (if completed)
    if (statusResult.status === 'completed') {
      console.log('\n--- Test 3: Get video URL ---');
      const urlResult = await videoService.getVideoUrl(TEST_PHOTO_ID);
      console.log('✅ Get URL response:', urlResult);
      console.log('   Video URL:', urlResult.videoUrl.substring(0, 50) + '...');
    } else {
      console.log('\n--- Test 3: Skipped (video not completed) ---');
      console.log('   Current status:', statusResult.status);
      console.log('   Run checkVideoStatus again later');
    }

    // Test 4: Error handling - Invalid photo ID
    console.log('\n--- Test 4: Error handling (invalid ID) ---');
    try {
      await videoService.generateVideo('invalid-id');
      console.log('❌ Should have thrown error');
    } catch (error: any) {
      console.log('✅ Error caught as expected');
      console.log('   Error message:', error.message);
    }

    // Test 5: Error handling - Non-existent photo
    console.log('\n--- Test 5: Error handling (non-existent photo) ---');
    try {
      await videoService.checkVideoStatus('000000000000000000000000');
      console.log('❌ Should have thrown error');
    } catch (error: any) {
      console.log('✅ Error caught as expected');
      console.log('   Error message:', error.message);
    }

  } catch (error: any) {
    console.error('❌ Test error:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }

  console.log('\n🎉 Test completed!');
};

// Run tests
testVideoService();
