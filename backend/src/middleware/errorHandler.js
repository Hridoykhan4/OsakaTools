export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || "Internal server error";

  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join("; ");
  } else if (err.name === "CastError") {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    message = `A record with this ${Object.keys(err.keyValue || {}).join(", ") || "value"} already exists`;
  } else if (err.name === "MulterError") {
    status = 400;
  }

  if (status >= 500) {
    // Log the stack server-side only; never return internals to clients.
    console.error(`[error] ${req.method} ${req.originalUrl}:`, err.stack || err.message);
    if (process.env.NODE_ENV === "production") message = "Internal server error";
  }
  res.status(status).json({ message });
}
