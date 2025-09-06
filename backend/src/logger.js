const winston = require('winston');

// Create a logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
    // Use JSON format for production, pretty format for development
    process.env.NODE_ENV === 'production' 
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, metadata }) => {
            let log = `${timestamp} [${level}] ${message}`;
            if (Object.keys(metadata).length > 0) {
              log += ` ${JSON.stringify(metadata)}`;
            }
            return log;
          })
        )
  ),
  defaultMeta: { 
    service: 'notes-backend',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    new winston.transports.Console()
  ]
});

// Add request ID tracking
logger.addRequestId = (req, res, next) => {
  req.requestId = generateRequestId();
  // Add request ID to all subsequent logs in this request
  req.logger = logger.child({ requestId: req.requestId });
  next();
};

// Generate a simple request ID
function generateRequestId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Log HTTP requests
logger.httpLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  req.logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    requestId: req.requestId
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    
    req.logger.info('HTTP Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: duration,
      requestId: req.requestId
    });
    
    originalEnd.apply(res, args);
  };
  
  next();
};

// Log errors
logger.errorHandler = (err, req, res, next) => {
  const requestId = req.requestId || 'unknown';
  
  logger.error('Unhandled Error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    requestId,
    statusCode: err.status || 500
  });
  
  // Send error response
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message,
    requestId
  });
};

// Performance monitoring
logger.performance = {
  start: (operation) => {
    return {
      operation,
      startTime: Date.now(),
      end: function(metadata = {}) {
        const duration = Date.now() - this.startTime;
        logger.info('Performance Metric', {
          operation: this.operation,
          duration: `${duration}ms`,
          ...metadata
        });
        return duration;
      }
    };
  }
};

module.exports = logger;