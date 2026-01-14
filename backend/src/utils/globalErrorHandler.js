/**
 * Global Error Handler
 * The final safety net. catches everything.
 */
const globalErrorHandler = (err, req, res, next) => {
    // 1. Log the error (Critical for debugging)
    console.error('❌ [Global Error]:', err);

    // 2. Determine Status Code
    const statusCode = err.statusCode || 500;

    // 3. Send JSON Response (Never HTML, Never Crash)
    res.status(statusCode).json({
        success: false,
        error: {
            message: err.message || 'Internal Server Error',
            code: err.code || 'INTERNAL_ERROR',
            // Only show stack in development for security
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }
    });
};

module.exports = globalErrorHandler;
