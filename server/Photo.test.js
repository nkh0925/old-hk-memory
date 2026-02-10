// testPhotoModel.js
import 'dotenv/config';
import mongoose from 'mongoose';
import Photo from './src/models/Photo.js';

async function testPhotoModel() {
  console.log('🧪 Testing Photo Model...\n');

  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Create photo without aiVideo
    console.log('Test 1: Create photo without aiVideo');
    const photo1 = await Photo.create({
      imageUrl: 'https://example.com/photo1.jpg',
      thumbnailUrl: 'https://example.com/thumb1.jpg',
      story: 'Old Hong Kong street in 1970s',
      location: {
        type: 'Point',
        coordinates: [114.1545, 22.2819],
        address: 'Central, Hong Kong'
      },
      district: new mongoose.Types.ObjectId(),
      districtCode: 'central',
      uploader: new mongoose.Types.ObjectId(),
      era: '1970s'
    });
    console.log('✅ Photo created with default aiVideo.status:', photo1.aiVideo.status);
    console.log('   aiVideo object:', photo1.aiVideo);

    // Test 2: Update aiVideo to pending
    console.log('\nTest 2: Update aiVideo to pending');
    photo1.aiVideo.status = 'pending';
    photo1.aiVideo.jobId = 'cgt-test-12345';
    photo1.aiVideo.prompt = photo1.story;
    await photo1.save();
    console.log('✅ aiVideo updated to pending');
    console.log('   jobId:', photo1.aiVideo.jobId);

    // Test 3: Update aiVideo to completed
    console.log('\nTest 3: Update aiVideo to completed');
    photo1.aiVideo.status = 'completed';
    photo1.aiVideo.url = 'https://blob.azure.com/videos/video1.mp4';
    photo1.aiVideo.duration = 10;
    photo1.aiVideo.generatedAt = new Date();
    await photo1.save();
    console.log('✅ aiVideo updated to completed');
    console.log('   url:', photo1.aiVideo.url);
    console.log('   duration:', photo1.aiVideo.duration);

    // Test 4: Query photos by aiVideo status
    console.log('\nTest 4: Query photos by aiVideo status');
    const completedPhotos = await Photo.find({ 'aiVideo.status': 'completed' });
    console.log('✅ Found', completedPhotos.length, 'completed videos');

    // Test 5: Update aiVideo to failed
    console.log('\nTest 5: Update aiVideo to failed');
    const photo2 = await Photo.create({
      imageUrl: 'https://example.com/photo2.jpg',
      thumbnailUrl: 'https://example.com/thumb2.jpg',
      story: 'Test photo',
      location: {
        type: 'Point',
        coordinates: [114.1545, 22.2819]
      },
      district: new mongoose.Types.ObjectId(),
      districtCode: 'central',
      uploader: new mongoose.Types.ObjectId()
    });
    photo2.aiVideo.status = 'failed';
    photo2.aiVideo.error = 'Image format not supported';
    await photo2.save();
    console.log('✅ aiVideo updated to failed');
    console.log('   error:', photo2.aiVideo.error);

    // Cleanup
    console.log('\nCleaning up test data...');
    await Photo.deleteMany({ _id: { $in: [photo1._id, photo2._id] } });
    console.log('✅ Test data cleaned');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🎉 Test completed!');
  }
}

testPhotoModel();
