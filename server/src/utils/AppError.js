class AppError extends Error {
  constructor(code, message, statusCode = 500) {
    super(message);
    
    this.code = code;
    this.message = message;
    this.statusCode = statusCode;
    this.success = false;
    
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message
      }
    };
  }
}

export default AppError;
