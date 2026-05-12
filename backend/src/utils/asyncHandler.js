function asyncHandler(fn) {
  return function wrappedAsyncHandler(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error(`[ASYNC_ERROR] ${req.method} ${req.path}:`, {
        message: error?.message,
        stack: error?.stack,
        sqlError: error?.originalError?.message || error?.sql,
      });
      next(error);
    });
  };
}

module.exports = asyncHandler;
