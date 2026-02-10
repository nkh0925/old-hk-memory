import dotenv from 'dotenv';
import mongoose from 'mongoose';
import request from 'supertest';
import app from './src/app.js';
import User from './src/models/User.js';
import Photo from './src/models/Photo.js';

dotenv.config();

let authToken;
let testUserId;
let testPhotoId;

const testVideoRoutes = async () => {
  console.log('🧪 Testing Video Routes...\n');

  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Setup: 创建测试用户
    console.log('Setup: Creating test user...');
    const testUser = await User.create({
      email: `test-${Date.now()}@example.com`,
      password: 'Password123!',
      username: `TestUser${Date.now()}`
    });
    testUserId = testUser._id.toString();
    console.log('✅ Test user created:', testUserId);

    // Setup: 登录获取 token
    console.log('\nSetup: Logging in...');
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'Password123!'
      });
    
    authToken = loginRes.body.data.token;
    console.log('✅ Login successful, token obtained');

    // Setup: 创建测试照片
    console.log('\nSetup: Creating test photo...');
    const testPhoto = await Photo.create({
      imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200',
      story: '一只可爱的小猫在阳光下打哈欠',
      location: {
        type: 'Point',
        coordinates: [114.1545, 22.2819],
        address: 'Central, Hong Kong'
      },
      district: new mongoose.Types.ObjectId(),
      districtCode: 'central',
      uploader: testUserId,
      era: '1970s'
    });
    testPhotoId = testPhoto._id.toString();
    console.log('✅ Test photo created:', testPhotoId);

    // Test 1: Generate Video - Success
    console.log('\n--- Test 1: POST /api/v1/videos/generate (Success) ---');
    const generateRes = await request(app)
      .post('/api/v1/videos/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ photoId: testPhotoId });

    console.log('Status:', generateRes.status);
    console.log('Response:', generateRes.body);
    
    if (generateRes.status === 200 && generateRes.body.success) {
      console.log('✅ Test 1 passed');
      console.log('   Job ID:', generateRes.body.data.jobId);
    } else {
      console.log('❌ Test 1 failed');
    }

    // Test 2: Generate Video - Invalid photoId
    console.log('\n--- Test 2: POST /api/v1/videos/generate (Invalid photoId) ---');
    const invalidRes = await request(app)
      .post('/api/v1/videos/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ photoId: 'invalid-id' });

    console.log('Status:', invalidRes.status);
    console.log('Response:', invalidRes.body);
    
    if (invalidRes.status === 400) {
      console.log('✅ Test 2 passed - Validation error caught');
    } else {
      console.log('❌ Test 2 failed');
    }

    // Test 3: Generate Video - No auth token
    console.log('\n--- Test 3: POST /api/v1/videos/generate (No auth) ---');
    const noAuthRes = await request(app)
      .post('/api/v1/videos/generate')
      .send({ photoId: testPhotoId });

    console.log('Status:', noAuthRes.status);
    console.log('Response:', noAuthRes.body);
    
    if (noAuthRes.status === 401) {
      console.log('✅ Test 3 passed - Unauthorized');
    } else {
      console.log('❌ Test 3 failed');
    }

    // Wait 5 seconds
    console.log('\n⏳ Waiting 5 seconds before checking status...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Test 4: Check Video Status - Success
    console.log('\n--- Test 4: POST /api/v1/videos/status (Success) ---');
    const statusRes = await request(app)
      .post('/api/v1/videos/status')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ photoId: testPhotoId });

    console.log('Status:', statusRes.status);
    console.log('Response:', statusRes.body);
    
    if (statusRes.status === 200 && statusRes.body.success) {
      console.log('✅ Test 4 passed');
      console.log('   Video status:', statusRes.body.data.status);
    } else {
      console.log('❌ Test 4 failed');
    }

    // Test 5: Get Video URL - Success (if completed)
    console.log('\n--- Test 5: GET /api/v1/videos/:photoId (Get URL) ---');
    const urlRes = await request(app)
      .post(`/api/v1/videos/${testPhotoId}`)
      .set('Authorization', `Bearer ${authToken}`);

    console.log('Status:', urlRes.status);
    console.log('Response:', urlRes.body);
    
    if (statusRes.body.data.status === 'completed') {
      if (urlRes.status === 200 && urlRes.body.success) {
        console.log('✅ Test 5 passed');
        console.log('   Video URL:', urlRes.body.data.videoUrl?.substring(0, 50) + '...');
      } else {
        console.log('❌ Test 5 failed');
      }
    } else {
      console.log('⏭️  Test 5 skipped - Video not completed yet');
      console.log('   Current status:', statusRes.body.data.status);
    }

    // Test 6: Get Video URL - Invalid photoId
    console.log('\n--- Test 6: GET /api/v1/videos/:photoId (Invalid ID) ---');
    const invalidUrlRes = await request(app)
      .get('/api/v1/videos/invalid-id')
      .set('Authorization', `Bearer ${authToken}`);

    console.log('Status:', invalidUrlRes.status);
    console.log('Response:', invalidUrlRes.body);
    
    if (invalidUrlRes.status === 400) {
      console.log('✅ Test 6 passed - Validation error caught');
    } else {
      console.log('❌ Test 6 failed');
    }

    // Test 7: Generate Video Again - Should fail (duplicate)
    console.log('\n--- Test 7: POST /api/v1/videos/generate (Duplicate) ---');
    const duplicateRes = await request(app)
      .post('/api/v1/videos/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ photoId: testPhotoId });

    console.log('Status:', duplicateRes.status);
    console.log('Response:', duplicateRes.body);
    
    if (duplicateRes.status === 400) {
      console.log('✅ Test 7 passed - Duplicate generation prevented');
    } else {
      console.log('❌ Test 7 failed');
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await Photo.deleteOne({ _id: testPhotoId });
    await User.deleteOne({ _id: testUserId });
    console.log('✅ Test data cleaned');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🎉 Test completed!');
    process.exit(0);
  }
};

testVideoRoutes();
