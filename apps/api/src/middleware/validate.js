function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const message = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
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

module.exports = validate;
