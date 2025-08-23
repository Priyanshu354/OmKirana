const handleError = (res, error, message = "Server Error") => {
  console.error(error); // logs full stack for debugging
  const response = { message };
  if (process.env.NODE_ENV !== "production") {
    response.error = error.message; // include actual error only in development
  }
  res.status(500).json(response);
};

module.exports = handleError;