const { validationResult } = require("express-validator");
const { fail } = require("../views/apiResponse.view");

function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Log validation errors for debugging
    const errs = errors.array();
    console.error("Validation failed for", req.path, errs);
    const msg = errs.map((e) => `${e.param}: ${e.msg}`).join("; ");
    return fail(res, `Validation failed: ${msg}`, 422, errs);
  }

  return next();
}

module.exports = {
  validateRequest,
};
