
import 'dotenv/config';
import mongoose from 'mongoose';
import Photo from './src/models/Photo.js';
import User from './src/models/User.js';
import * as videoController from './src/controllers/videoController.js';

// Mock request and response
const mockReq = (body, user, params = {}) => ({
  body,
  user,
  params
});

const mockRes = () => {
  const res = {};
  res.status = function(code) {
    this.statusCode = code;
    return this;
  };
  res.json = function(data) {
    this.jsonData = data;
    return this;
  };
  return res;
};

const mockNext = (error) => {
  if (error) {
    console.log('Next called with error:', error.message);
  }
};

async function testVideoController() {
  console.log('🧪 Testing Video Controller...\n');

  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // 创建测试用户
    const testUser = await User.create({
      email: 'test-video@example.com',
      password: 'password123',
      username: 'TestVideoUser'
    });
    console.log('✅ Test user created:', testUser._id);

    // 创建测试照片
    const testPhoto = await Photo.create({
      imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1600&h=1067',
      thumbnailUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200',
      story: '一只可爱的小猫在阳光下打哈欠',
      location: {
        type: 'Point',
        coordinates: [114.1545, 22.2819],
        address: 'Central, Hong Kong'
      },
      district: new mongoose.Types.ObjectId(),
      districtCode: 'central',
      uploader: testUser._id,
      era: '1970s'
    });
    console.log('✅ Test photo created:', testPhoto._id);

    // Test 1: Generate Video
    console.log('\nTest 1: Generate video');
    const req1 = mockReq(
      { photoId: testPhoto._id.toString() },
      { id: testUser._id.toString() }
    );
    const res1 = mockRes();
    
    await videoController.generateVideo(req1, res1, mockNext);
    
    console.log('✅ Generate video response:', res1.jsonData);
    
    if (res1.jsonData?.success) {
      console.log('   Job ID:', res1.jsonData.data.jobId);
      console.log('   Status:', res1.jsonData.data.status);
    } else {
      console.log('   Error:', res1.jsonData?.error);
    }

    // 等待几秒
    console.log('\nWaiting 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Test 2: Check Video Status
    console.log('\nTest 2: Check video status');
    const req2 = mockReq(
      {},
      { id: testUser._id.toString() },
      { photoId: testPhoto._id.toString() }
    );
    const res2 = mockRes();
    
    await videoController.checkVideoStatus(req2, res2, mockNext);
    
    console.log('✅ Check status response:', res2.jsonData);
    
    if (res2.jsonData?.success) {
      console.log('   Status:', res2.jsonData.data.status);
      if (res2.jsonData.data.videoUrl) {
        console.log('   Video URL:', res2.jsonData.data.videoUrl.substring(0, 50) + '...');
      }
    } else {
      console.log('   Error:', res2.jsonData?.error);
    }

    // Test 3: Get Video URL (if completed)
    if (res2.jsonData?.data?.status === 'completed') {
      console.log('\nTest 3: Get video URL');
      const req3 = mockReq(
        {},
        { id: testUser._id.toString() },
        { photoId: testPhoto._id.toString() }
      );
      const res3 = mockRes();
      
      await videoController.getVideoUrl(req3, res3, mockNext);
      
      console.log('✅ Get URL response:', res3.jsonData);
      
      if (res3.jsonData?.success) {
        console.log('   Video URL:', res3.jsonData.data.videoUrl?.substring(0, 50) + '...');
        console.log('   Duration:', res3.jsonData.data.duration, 'seconds');
      }
    } else {
      console.log('\nTest 3: Skipped (video not completed yet)');
      console.log('   Current status:', res2.jsonData?.data?.status);
      console.log('   You can run checkVideoStatus again later');
    }

    // Test 4: Error - Generate video again (should fail)
    console.log('\nTest 4: Try to generate video again (should fail)');
    const req4 = mockReq(
      { photoId: testPhoto._id.toString() },
      { id: testUser._id.toString() }
    );
    const res4 = mockRes();
    let errorCaught = false;
    
    const mockNextWithCapture = (error) => {
      if (error) {
        errorCaught = true;
        console.log('✅ Error caught as expected:', error.message);
      }
    };
    
    await videoController.generateVideo(req4, res4, mockNextWithCapture);
    
    if (!errorCaught && res4.jsonData?.error) {
      console.log('✅ Error returned in response:', res4.jsonData.error.message);
    }

    // Test 5: List all videos for user
    console.log('\nTest 5: List all videos for user');
    const req5 = mockReq(
      {},
      { id: testUser._id.toString() }
    );
    const res5 = mockRes();
    
    if (videoController.listUserVideos) {
      await videoController.listUserVideos(req5, res5, mockNext);
      console.log('✅ List videos response:', res5.jsonData);
    } else {
      console.log('⚠️  listUserVideos function not found');
    }

    // Cleanup
    console.log('\nCleaning up test data...');
    await Photo.deleteOne({ _id: testPhoto._id });
    await User.deleteOne({ _id: testUser._id });
    console.log('✅ Test data cleaned');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🎉 Test completed!');
  }
}

testVideoController();
