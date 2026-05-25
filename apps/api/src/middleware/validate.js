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

    next();
  };
}

module.exports = validate;
