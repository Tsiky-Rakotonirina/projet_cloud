class ApiResponse {
  constructor(success = true, message = '', data = null, meta = {}) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.meta = {
      timestamp: new Date().toISOString(),
      ...meta,
    };
  }

  static success(message = '', data = null, meta = {}) {
    return new ApiResponse(true, message, data, meta);
  }

  static error(message = '', data = null, meta = {}) {
    return new ApiResponse(false, message, data, meta);
  }
}

module.exports = ApiResponse;
