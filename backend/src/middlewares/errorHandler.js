const { fail } = require("../views/apiResponse.view");

function notFoundHandler(req, res) {
  return fail(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  if (res.headersSent) {
    return next(err);
  }

  return fail(
    res,
    message,
    statusCode,
    process.env.NODE_ENV === "development" ? err.stack : null,
  );
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
