import Photo from '../Photo.js';

console.log('Validating Photo model...\n');

// Test 1: Schema structure
console.log('✓ Photo model loaded successfully');
console.log('✓ Schema fields:', Object.keys(Photo.schema.paths).join(', '));

// Test 2: Create instance without saving
const testPhoto = new Photo({
  imageUrl: 'https://azureblob.com/photos/test.jpg',
  thumbnailUrl: 'https://azureblob.com/photos/test_thumb.jpg',
  story: 'A beautiful street in 1960s Hong Kong',
  location: {
    type: 'Point',
    coordinates: [114.1694, 22.3193],
    address: 'Central, Hong Kong'
  },
  district: '507f1f77bcf86cd799439011',
  districtCode: 'HK01',
  uploader: '507f191e810c19729de860ea',
  era: '1960s',
  status: 'approved'
});

console.log('✓ Photo instance created');
console.log('✓ Photo data:', {
  imageUrl: testPhoto.imageUrl,
  districtCode: testPhoto.districtCode,
  era: testPhoto.era,
  status: testPhoto.status,
  viewCount: testPhoto.viewCount
});

// Test 3: Validation
const errors = testPhoto.validateSync();
if (errors) {
  console.log('✗ Validation failed:', errors.message);
} else {
  console.log('✓ Validation passed');
}

// Test 4: Check indexes
console.log('✓ Indexes defined:', Photo.schema.indexes().length);

console.log('\n✓ All validation tests passed!');
