import ErrorResponse from '../utils/errorResponse.js';

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  let statusCode = err.statusCode || 500;
  let code = err.code;
  let message = err.message || 'Server Error';
  let fieldErrors;

  // Log to console for dev
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 404;
    code = 'NOT_FOUND';
    message = `Resource not found with id of ${err.value}`;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE';
    const duplicateField = Object.keys(err.keyValue || {})[0];
    message = duplicateField
      ? `${duplicateField} already exists`
      : 'Duplicate field value entered';
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    fieldErrors = Object.fromEntries(
      Object.entries(err.errors).map(([field, value]) => [field, value.message])
    );
    message = 'Validation failed';
  }

  if (!code && statusCode === 401) code = 'UNAUTHORIZED';
  if (!code && statusCode === 403) code = 'FORBIDDEN';
  if (!code && statusCode === 404) code = 'NOT_FOUND';
  if (!code && statusCode === 500) code = 'SERVER_ERROR';

  const payload = {
    success: false,
    code,
    message,
  };

  if (fieldErrors) {
    payload.fieldErrors = fieldErrors;
  }

  res.status(statusCode).json(payload);
};

export default errorHandler;
