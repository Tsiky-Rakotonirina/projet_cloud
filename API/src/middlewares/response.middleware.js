const ApiResponse = require('../utils/response');

const responseMiddleware = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function (body) {
    if (body instanceof ApiResponse || (body && body.success !== undefined && body.meta)) {
      return originalJson(body);
    }

    const response = new ApiResponse(
      true,
      body.message || 'Succès',
      body.data || body,
      {
        path: req.originalUrl,
        method: req.method,
      }
    );

    return originalJson(response);
  };

  res.sendSuccess = (message = '', data = null, statusCode = 200) => {
    const response = ApiResponse.success(message, data, {
      path: req.originalUrl,
      method: req.method,
    });
    return res.status(statusCode).json(response);
  };

  res.sendError = (message = '', data = null, statusCode = 400) => {
    const response = ApiResponse.error(message, data, {
      path: req.originalUrl,
      method: req.method,
    });
    return res.status(statusCode).json(response);
  };

  next();
};

module.exports = responseMiddleware;
