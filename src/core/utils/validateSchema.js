module.exports = (schema, req) => {
  const { error, value } = schema.validate(req);

  if (error != null) {
    console.error(error);
    const humanErr = error.details.map(detail => detail.message).join(', ');
    const err = new Error(humanErr);
    err.name = 'BadRequest';
    throw err;
  }

  return value;
};
