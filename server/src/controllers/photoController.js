import Photo from '../models/Photo.js';
import User from '../models/User.js';
import District from '../models/District.js';
import { uploadPhoto as uploadToAzure, deleteBlob } from '../services/azureBlobService.js';
import mongoose from 'mongoose';
/**
 * Async handler wrapper to avoid repetitive try-catch blocks
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Upload a new photo
 * POST /photos/upload
 * @access Private (requires authentication)
 */
export const uploadPhoto = asyncHandler(async (req, res) => {
  const { longitude, latitude, address, districtCode, story, era } = req.body;

  // 1. Validate required fields
  const missingFields = [];
  if (longitude === undefined || longitude === null) missingFields.push('longitude');
  if (latitude === undefined || latitude === null) missingFields.push('latitude');
  if (!districtCode) missingFields.push('districtCode');

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Missing required fields: ${missingFields.join(', ')}`
      }
    });
  }

  // 2. Validate file exists
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Image file is required'
      }
    });
  }

  // Validate era if provided
  const validEras = ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s', 'unknown'];
  if (era && !validEras.includes(era)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid era. Must be one of: ${validEras.join(', ')}`
      }
    });
  }

  // Validate story length if provided
  if (story && story.length > 2000) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Story must not exceed 2000 characters'
      }
    });
  }

  // Validate coordinates
  const lng = parseFloat(longitude);
  const lat = parseFloat(latitude);

  if (isNaN(lng) || isNaN(lat)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Longitude and latitude must be valid numbers'
      }
    });
  }

  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid coordinates range'
      }
    });
  }

  // Find district by code
  const district = await District.findOne({ code: districtCode });

  if (!district) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `District with code '${districtCode}' not found`
      }
    });
  }

  // 3. Upload image to Azure Blob
  let imageUrl;
  try {
    const uploadResult = await uploadToAzure(req.file);
    imageUrl = uploadResult.url;  // Extract the url string from the result object
  } catch (uploadError) {
    console.error('Azure upload error:', uploadError);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to upload image to storage'
      }
    });
  }

  // 4. Create Photo document
  const photo = await Photo.create({
    imageUrl,
    location: {
      type: 'Point',
      coordinates: [lng, lat],
      address: address || undefined
    },
    district: district._id,
    districtCode,
    uploader: req.user._id,
    story: story || undefined,
    era: era || 'unknown'
  });

  // 5. Increment User.photosCount
  await User.findByIdAndUpdate(
    req.user._id,
    { $inc: { photosCount: 1 } }
  );

  // 6. Increment District.photosCount
  await District.findByIdAndUpdate(
    district._id,
    { $inc: { photosCount: 1 } }
  );

  // 7. Return created photo
  res.status(201).json({
    success: true,
    data: {
      id: photo._id,
      imageUrl: photo.imageUrl,
      story: photo.story,
      location: photo.location,
      districtCode: photo.districtCode,
      era: photo.era,
      status: photo.status,
      createdAt: photo.createdAt
    },
    message: 'Photo uploaded successfully'
  });
});

/**
 * Get current user's photos
 * POST /photos/my
 */
export const getMyPhotos = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.body;
    const userId = req.user.id || req.user._id;
    
    const skip = (page - 1) * limit;
    
    const [photos, total] = await Promise.all([
      Photo.find({ uploader: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('district', 'code name')
        .lean(),
      Photo.countDocuments({ uploader: userId })
    ]);
    
    // Transform photos
    const transformedPhotos = photos.map(photo => ({
      id: photo._id.toString(),
      imageUrl: photo.imageUrl,
      thumbnailUrl: photo.thumbnailUrl || photo.imageUrl,
      district: photo.district,
      era: photo.era,
      createdAt: photo.createdAt,
    }));
    
    res.json({
      success: true,
      data: transformedPhotos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('getMyPhotos error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
* Get photos list with filters and pagination
* POST /photos/list
* @access Public
*/
export const getPhotos = asyncHandler(async (req, res) => {
 const { district, page = 1, limit = 20 } = req.body;

 // 1. Parse and validate page, limit
 const pageNum = parseInt(page);
 const limitNum = parseInt(limit);

 if (isNaN(pageNum) || pageNum < 1) {
   return res.status(400).json({
     success: false,
     error: {
       code: 'VALIDATION_ERROR',
       message: 'Page must be a positive integer'
     }
   });
 }

 if (isNaN(limitNum) || limitNum < 1) {
   return res.status(400).json({
     success: false,
     error: {
       code: 'VALIDATION_ERROR',
       message: 'Limit must be a positive integer'
     }
   });
 }

 if (limitNum > 100) {
   return res.status(400).json({
     success: false,
     error: {
       code: 'VALIDATION_ERROR',
       message: 'Limit must not exceed 100'
     }
   });
 }

 // 2. Build query: { status: 'approved' }
 const query = { status: 'approved' };

 // 3. If district provided, add { districtCode: district }
 if (district) {
   query.districtCode = district;
 }

 // Calculate skip for pagination
 const skip = (pageNum - 1) * limitNum;

 // 4 & 5. Populate and sort
 const photos = await Photo.find(query)
   .populate('uploader', 'username avatar')
   .populate('district', 'code name')
   .sort({ createdAt: -1 })
   .skip(skip)
   .limit(limitNum)
   .lean();

 // 7. Get total count
 const total = await Photo.countDocuments(query);
 const totalPages = Math.ceil(total / limitNum);

 // 8. Format response data
 const formattedPhotos = photos.map(photo => ({
   id: photo._id,
   imageUrl: photo.imageUrl,
   thumbnailUrl: photo.thumbnailUrl,
   story: photo.story,
   location: {
     coordinates: photo.location?.coordinates,
     address: photo.location?.address
   },
   district: photo.district ? {
     code: photo.district.code,
     name: photo.district.name
   } : null,
   uploader: photo.uploader ? {
     id: photo.uploader._id,
     username: photo.uploader.username,
     avatar: photo.uploader.avatar
   } : null,
   era: photo.era,
   hasArVideo: photo.arVideo?.status === 'ready',
   viewCount: photo.viewCount || 0,
   createdAt: photo.createdAt
 }));

 // Return photos array + pagination
 res.status(200).json({
   success: true,
   data: formattedPhotos,
   pagination: {
     page: pageNum,
     limit: limitNum,
     total,
     totalPages
   }
 });
});

/**
 * Get photo markers for map display
 * POST /photos/map
 * @access Public
 */
export const getMapMarkers = asyncHandler(async (req, res) => {
  const { district } = req.body;

  // 1. Build query: { status: 'approved' }
  const query = { status: 'approved' };

  // 2. If district provided, add { districtCode: district }
  if (district) {
    query.districtCode = district;
  }

  // 3. Select only needed fields for performance
  const photos = await Photo.find(query)
    .select('_id location.coordinates thumbnailUrl imageUrl arVideo.status')
    .lean();

  // 4. Format minimal response for map performance
  const markers = photos.map(photo => ({
    id: photo._id,
    coordinates: photo.location?.coordinates || null,
    thumbnailUrl: photo.thumbnailUrl || photo.imageUrl,
    hasArVideo: photo.arVideo?.status === 'ready'
  }));

  res.status(200).json({
    success: true,
    data: markers
  });
});

/**
 * Get photo detail by ID
 * POST /photos/detail
 * @access Public
 */
export const getPhotoDetail = asyncHandler(async (req, res) => {
  const { id } = req.body;

  // 1. Validate id exists
  if (!id) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Photo id is required'
      }
    });
  }

  // Validate id is valid ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid photo id format'
      }
    });
  }

  // 2 & 3. Find photo by _id with status 'approved' and populate
  const photo = await Photo.findOne({ _id: id, status: 'approved' })
    .populate('uploader', '_id username avatar')
    .populate('district', 'code name')
    .lean();

  // 4. If not found, return 404
  if (!photo) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Photo not found or not approved'
      }
    });
  }

  // 5. Increment viewCount by 1
  await Photo.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

  // 6. Return full photo data
  res.status(200).json({
    success: true,
    data: {
      id: photo._id,
      imageUrl: photo.imageUrl,
      thumbnailUrl: photo.thumbnailUrl,
      story: photo.story,
      location: {
        coordinates: photo.location?.coordinates,
        address: photo.location?.address
      },
      district: photo.district ? {
        code: photo.district.code,
        name: photo.district.name
      } : null,
      uploader: photo.uploader ? {
        id: photo.uploader._id,
        username: photo.uploader.username,
        avatar: photo.uploader.avatar
      } : null,
      era: photo.era,
      arVideo: {
        url: photo.arVideo?.url,
        status: photo.arVideo?.status
      },
      viewCount: (photo.viewCount || 0) + 1,
      createdAt: photo.createdAt
    }
  });
});

/**
 * Get nearby photos based on coordinates
 * POST /photos/nearby
 * @access Public
 */
export const getNearbyPhotos = asyncHandler(async (req, res) => {
  const { lng, lat, radius = 50 } = req.body;

  // 1. Validate lng, lat exist
  if (lng === undefined || lng === null) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Longitude (lng) is required'
      }
    });
  }

  if (lat === undefined || lat === null) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Latitude (lat) is required'
      }
    });
  }

  // Validate lng, lat are valid numbers
  const longitude = parseFloat(lng);
  const latitude = parseFloat(lat);

  if (isNaN(longitude) || isNaN(latitude)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Longitude and latitude must be valid numbers'
      }
    });
  }

  // Validate coordinate ranges
  if (longitude < -180 || longitude > 180) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Longitude must be between -180 and 180'
      }
    });
  }

  if (latitude < -90 || latitude > 90) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Latitude must be between -90 and 90'
      }
    });
  }

  // 2. Validate radius is positive number, default 50, cap at 500
  let maxDistance = parseFloat(radius);
  if (isNaN(maxDistance) || maxDistance <= 0) {
    maxDistance = 50;
  }
  maxDistance = Math.min(maxDistance, 500);

  // 3 & 6. Use $geoNear aggregation to get distance
  const photos = await Photo.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        distanceField: 'distance',
        maxDistance: maxDistance,
        spherical: true,
        query: { status: 'approved' }
      }
    },
    {
      $limit: 10
    },
    {
      $lookup: {
        from: 'users',
        localField: 'uploader',
        foreignField: '_id',
        as: 'uploader',
        pipeline: [
          { $project: { username: 1 } }
        ]
      }
    },
    {
      $unwind: {
        path: '$uploader',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: 1,
        imageUrl: 1,
        story: 1,
        distance: { $round: ['$distance', 1] },
        arVideo: {
          url: '$arVideo.url',
          status: '$arVideo.status'
        },
        uploader: {
          username: '$uploader.username'
        }
      }
    }
  ]);

  // Format response
  const formattedPhotos = photos.map(photo => ({
    id: photo._id,
    imageUrl: photo.imageUrl,
    story: photo.story,
    distance: photo.distance,
    arVideo: {
      url: photo.arVideo?.url || null,
      status: photo.arVideo?.status || null
    },
    uploader: {
      username: photo.uploader?.username || null
    }
  }));

  res.status(200).json({
    success: true,
    data: formattedPhotos
  });
});

/**
 * Get current user's uploaded photos
 * POST /users/photos
 * @access Private (requires authentication)
 */
export const getUserPhotos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.body;

  // 1. Get user id from req.user._id
  const userId = req.user._id;

  // 2. Parse page, limit with defaults
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Page must be a positive integer'
      }
    });
  }

  if (isNaN(limitNum) || limitNum < 1) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Limit must be a positive integer'
      }
    });
  }

  if (limitNum > 100) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Limit must not exceed 100'
      }
    });
  }

  // 3. Query photos where uploader = req.user._id (any status)
  const query = { uploader: userId };

  // Calculate skip for pagination
  const skip = (pageNum - 1) * limitNum;

  // 4, 5, 6. Find photos with populate, sort, and pagination
  const photos = await Photo.find(query)
    .populate('district', 'code name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  // 7. Get total count
  const total = await Photo.countDocuments(query);
  const totalPages = Math.ceil(total / limitNum);

  // Format response data
  const formattedPhotos = photos.map(photo => ({
    id: photo._id,
    imageUrl: photo.imageUrl,
    thumbnailUrl: photo.thumbnailUrl,
    district: photo.district ? {
      code: photo.district.code,
      name: photo.district.name
    } : null,
    status: photo.status,
    viewCount: photo.viewCount || 0,
    createdAt: photo.createdAt
  }));

  res.status(200).json({
    success: true,
    data: formattedPhotos,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages
    }
  });
});

/**
 * Delete a photo
 * POST /photos/delete
 * @access Private (requires authentication)
 */
export const deletePhoto = asyncHandler(async (req, res) => {
  const { id } = req.body;

  // 1. Validate id exists
  if (!id) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Photo id is required'
      }
    });
  }

  // Validate id is valid ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid photo id format'
      }
    });
  }

  // 2. Find photo by _id
  const photo = await Photo.findById(id);

  // 3. If not found, return 404
  if (!photo) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Photo not found'
      }
    });
  }

  // 4 & 5. Check ownership
  if (photo.uploader.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to delete this photo'
      }
    });
  }

  // 6 & 7. Delete blobs from Azure (don't fail if blob deletion fails)
  try {
    // Delete main image
    if (photo.imageUrl) {
      await deleteBlob(photo.imageUrl);
    }
    
    // Delete thumbnail if exists
    if (photo.thumbnailUrl) {
      await deleteBlob(photo.thumbnailUrl);
    }
  } catch (blobError) {
    // Log error but continue with DB deletion
    console.error('Azure blob deletion error:', blobError);
  }

  // 8. Decrement User.photosCount by 1
  await User.findByIdAndUpdate(
    req.user._id,
    { $inc: { photosCount: -1 } }
  );

  // 9. Decrement District.photosCount by 1
  if (photo.district) {
    await District.findByIdAndUpdate(
      photo.district,
      { $inc: { photosCount: -1 } }
    );
  }

  // 10. Delete photo document
  await Photo.findByIdAndDelete(id);

  // 11. Return success
  res.status(200).json({
    success: true,
    message: 'Photo deleted'
  });
});

export default {
  uploadPhoto,
  getPhotos,
  getMapMarkers,
  getPhotoDetail,
  getNearbyPhotos,
  getUserPhotos,
  deletePhoto
};
