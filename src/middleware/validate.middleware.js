// Wraps a zod schema so a route just does validate(schema) as middleware.
// On failure, sends a 400 with a field -> message map the frontend can show
// next to the right input.
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fields = {};
      for (const issue of result.error.issues) {
        fields[issue.path[0]] = issue.message;
      }
      return res.status(400).json({ message: 'Check the highlighted fields.', fields });
    }
    req.body = result.data;
    next();
  };
}

module.exports = validate;
