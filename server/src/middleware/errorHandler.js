import AppError from '../utils/AppError.js';

/**
 * Global Error Handler Middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Details:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code
    });
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message
      },
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: messages.join(', ')
      },
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Handle MongoDB duplicate key error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = field === 'email' 
      ? 'Email already registered' 
      : `Duplicate value for ${field}`;
    
    return res.status(409).json({
      success: false,
      error: {
        code: 'EMAIL_EXISTS',
        message
      },
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Handle JWT JsonWebTokenError
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token'
      },
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Handle JWT TokenExpiredError
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Token expired'
      },
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Handle Mongoose CastError (Invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: `Invalid ${err.path}: ${err.value}`
      },
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Generic/Unknown errors
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message || 'Internal server error';

  return res.status(statusCode).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message
    },
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default errorHandler;
