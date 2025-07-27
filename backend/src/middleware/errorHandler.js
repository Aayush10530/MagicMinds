/**
 * Error handling middleware for API requests
 */

const errorHandler = (err, req, res, next) => {
  // Log the error for debugging
  console.error('API Error:', err);
  
  // Determine status code
  const statusCode = err.statusCode || 500;
  
  // Format error response
  const errorResponse = {
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR'
    }
  };
  
  // Add stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }
  
  // Send error response
  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;