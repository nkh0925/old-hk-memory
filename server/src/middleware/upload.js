import multer from 'multer';

// Configure memory storage
const storage = multer.memoryStorage();

// File filter - only allow specific image types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    // Accept file
    cb(null, true);
  } else {
    // Reject file
    cb(
      new Error('INVALID_FILE_TYPE'),
      false
    );
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB in bytes
  },
});

// Middleware wrapper to handle errors
const uploadSingle = (req, res, next) => {
  const singleUpload = upload.single('image');
  
  singleUpload(req, res, (err) => {
    if (err) {
      // Handle multer errors
      if (err.message === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'Only JPEG, PNG, and GIF images are allowed',
          },
        });
      }
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size cannot exceed 5MB',
          },
        });
      }
      
      // Handle other multer errors
      return res.status(400).json({
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: err.message || 'An error occurred during file upload',
        },
      });
    }
    
    // No error, proceed to next middleware
    next();
  });
};

export { uploadSingle };
