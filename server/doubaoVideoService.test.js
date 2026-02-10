import dotenv from 'dotenv';
import { createTask, queryTask, pollTaskStatus } from './src/services/doubaoVideoService.js';

dotenv.config();

console.log('🧪 Testing Doubao Video Service...\n');

// Test image URL (use a real accessible image)
const testImageUrl = 'https://oldhkm.blob.core.windows.net/photos/photos/1767817278797-fa9faf5ea6a38016.jpeg';
const testPrompt = 'Hong Kong Baptist College’s campus on Waterloo Road was completed. The College entered into a phase of rapid development.The people in the picture are celebrating, some singing and others dancing.';

async function runTests() {
  try {
    // Test 1: Create task
    console.log('Test 1: Create video generation task');
    const createResult = await createTask(testImageUrl, testPrompt, {
      duration: 5,
      resolution: '720p',
      ratio: '16:9'
    });
    
    if (!createResult.success) {
      console.error('❌ Task creation failed:', createResult.error);
      return;
    }
    
    console.log('✅ Task created:', createResult.data);
    const taskId = createResult.data.id;
    
    // Test 2: Query task immediately
    console.log('\nTest 2: Query task status');
    const queryResult = await queryTask(taskId);
    
    if (!queryResult.success) {
      console.error('❌ Query failed:', queryResult.error);
      return;
    }
    
    console.log('✅ Task status:', queryResult.data.status);
    
    // Test 3: Poll until completion
    console.log('\nTest 3: Polling task until completion...');
    const pollResult = await pollTaskStatus(taskId, {
      initialDelay: 5000,
      pollingInterval: 10000,
      maxAttempts: 30,
      onProgress: (data) => {
        console.log(`📊 Status: ${data.status} | Updated: ${new Date(data.updated_at * 1000).toLocaleTimeString()}`);
      }
    });
    
    if (!pollResult.success) {
      console.error('❌ Polling failed:', pollResult.error);
      return;
    }
    
    console.log('\n✅ Video generated successfully!');
    console.log('📹 Video URL:', pollResult.data.content?.video_url);
    console.log('⚠️  URL expires in 24 hours - download immediately!');
    console.log('🎬 Duration:', pollResult.data.duration, 'seconds');
    console.log('📐 Resolution:', pollResult.data.resolution);
    console.log('🎲 Seed:', pollResult.data.seed);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

console.log('🎉 Test completed!\n');
runTests();
