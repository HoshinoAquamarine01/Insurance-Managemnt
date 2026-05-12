function success(res, data, message = "OK", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function fail(res, message = "Error", statusCode = 400, errors = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}

module.exports = {
  success,
  fail,
};
