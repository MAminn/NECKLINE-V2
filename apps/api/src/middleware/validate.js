const { z } = require('zod');

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join('; ');
      const err = new Error(message);
      err.statusCode = 400;
      return next(err);
    }

    // Replace inputs with the parsed output so handlers only ever see
    // schema-declared fields (with Zod defaults/coercion applied).
    if (result.data.body !== undefined) req.body = result.data.body;
    if (result.data.query !== undefined) req.query = result.data.query;
    if (result.data.params !== undefined) req.params = result.data.params;

    next();
  };
}

// Convenience for routes whose validator is a flat body schema (validates
// req.body directly). Wraps it as { body: schema } so it flows through the
// same validate() path and produces the identical 400 error shape.
function validateBody(schema) {
  return validate(z.object({ body: schema }));
}

module.exports = validate;
module.exports.validate = validate;
module.exports.validateBody = validateBody;
