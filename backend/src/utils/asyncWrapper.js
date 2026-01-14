/**
 * Async Wrapper
 * Wraps async route handlers to ensure errors are passed to Express error handling.
 * Eliminates the need for try/catch in every single route.
 */
const asyncWrapper = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = asyncWrapper;
