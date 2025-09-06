const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const db = require('./db');
const cache = require('./cache');
const logger = require('./logger');

const app = express();
const PORT = 3000;

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to API routes
app.use('/api', limiter);

// Body parsing with size limits
app.use(express.json({ limit: '1mb' }));

// Request ID and logging middleware
app.use(logger.addRequestId);
app.use(logger.httpLogger);

app.get('/health', async (req, res) => {
  const perf = logger.performance.start('health_check');
  try {
    const dbStatus = db.getConnectionStatus();
    const cacheStatus = cache.getConnectionStatus();
    
    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'connected' : 'disconnected',
      cache: cacheStatus ? 'connected' : 'disconnected'
    };
    
    perf.end({ status: 'success' });
    res.json(response);
  } catch (error) {
    req.logger.error('Health check failed', { error: error.message });
    perf.end({ status: 'error' });
    
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'error',
      cache: 'error',
      error: error.message
    });
  }
});

// Readiness probe - checks if all dependencies are available
app.get('/health/ready', async (req, res) => {
  try {
    const startTime = Date.now();
    const checks = {};
    let overallStatus = 'ready';
    
    // Check database connection
    try {
      const dbStatus = db.getConnectionStatus();
      if (dbStatus) {
        // Perform a simple query to verify database connectivity
        await db.getAllNotes();
        checks.database = { status: 'connected', responseTime: Date.now() - startTime };
      } else {
        checks.database = { status: 'disconnected', error: 'Database connection not established' };
        overallStatus = 'not_ready';
      }
    } catch (error) {
      checks.database = { status: 'error', error: error.message };
      overallStatus = 'not_ready';
    }
    
    // Check Redis connection
    try {
      const cacheStatus = cache.getConnectionStatus();
      if (cacheStatus) {
        // Verify Redis connectivity
        const testKey = 'health_check_' + Date.now();
        await cache.set(testKey, 'ok', 5);
        await cache.del(testKey);
        checks.cache = { status: 'connected', responseTime: Date.now() - startTime };
      } else {
        // Redis is optional, so this is a warning, not an error
        checks.cache = { status: 'disconnected', warning: 'Redis cache unavailable (degraded mode)' };
      }
    } catch (error) {
      checks.cache = { status: 'error', warning: 'Redis cache error: ' + error.message };
    }
    
    // Check memory usage
    const memUsage = process.memoryUsage();
    const memUsageMB = Math.round(memUsage.rss / 1024 / 1024);
    checks.memory = { 
      status: memUsageMB > 500 ? 'warning' : 'ok', 
      usage: `${memUsageMB}MB`,
      details: {
        rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB'
      }
    };
    
    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
      version: process.env.npm_package_version || '1.0.0'
    };
    
    const statusCode = overallStatus === 'ready' ? 200 : 503;
    res.status(statusCode).json(response);
    
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Liveness probe - simple check if the service is running
app.get('/health/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid
  });
});

// Cache middleware for notes list (60 second TTL)
const cacheNotesList = cache.createCacheMiddleware(
  cache.keyGenerators.notesList, 
  parseInt(process.env.CACHE_TTL) || 60
);

// Cache middleware for single note (300 second TTL)
const cacheSingleNote = cache.createCacheMiddleware(
  cache.keyGenerators.singleNote, 
  300
);

app.get('/api/notes', cacheNotesList, async (req, res) => {
  const perf = logger.performance.start('get_all_notes');
  try {
    req.logger.info('Fetching all notes');
    const notes = await db.getAllNotes();
    
    req.logger.info('Notes fetched successfully', { count: notes.length });
    perf.end({ status: 'success', count: notes.length });
    
    res.json(notes);
  } catch (error) {
    req.logger.error('Error fetching notes', { 
      error: error.message,
      stack: error.stack 
    });
    perf.end({ status: 'error' });
    
    res.status(500).json({ 
      error: 'Failed to fetch notes',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

app.get('/api/notes/:id', cacheSingleNote, async (req, res) => {
  const perf = logger.performance.start('get_single_note');
  try {
    req.logger.info('Fetching note by ID', { noteId: req.params.id });
    const note = await db.getNoteById(req.params.id);
    
    if (!note) {
      req.logger.warn('Note not found', { noteId: req.params.id });
      perf.end({ status: 'not_found' });
      return res.status(404).json({ error: 'Note not found' });
    }
    
    req.logger.info('Note fetched successfully', { noteId: note.id });
    perf.end({ status: 'success', noteId: note.id });
    
    res.json(note);
  } catch (error) {
    req.logger.error('Error fetching note', { 
      noteId: req.params.id,
      error: error.message,
      stack: error.stack 
    });
    perf.end({ status: 'error' });
    
    res.status(500).json({ 
      error: 'Failed to fetch note',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// Validation rules for creating notes
const validateNote = [
  body('title')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters')
    .trim()
    .escape(),
  body('content')
    .optional()
    .isLength({ max: 10000 })
    .withMessage('Content must not exceed 10,000 characters')
    .trim()
    .escape()
];

app.post('/api/notes', validateNote, async (req, res) => {
  const perf = logger.performance.start('create_note');
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.logger.warn('Note validation failed', { errors: errors.array() });
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { title, content } = req.body;
    req.logger.info('Creating note', { title: title.substring(0, 50) + '...' });
    
    const note = await db.createNote(title, content);
    
    // Invalidate cache after creating
    await cache.invalidateNotesCache();
    
    req.logger.info('Note created successfully', { noteId: note.id });
    perf.end({ status: 'success', noteId: note.id });
    
    res.status(201).json(note);
  } catch (error) {
    req.logger.error('Error creating note', { 
      error: error.message,
      stack: error.stack 
    });
    perf.end({ status: 'error' });
    
    res.status(500).json({ 
      error: 'Failed to create note',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

app.put('/api/notes/:id', validateNote, async (req, res) => {
  const perf = logger.performance.start('update_note');
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.logger.warn('Note validation failed', { 
        noteId: req.params.id,
        errors: errors.array() 
      });
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { title, content } = req.body;
    req.logger.info('Updating note', { 
      noteId: req.params.id,
      title: title.substring(0, 50) + '...' 
    });
    
    const note = await db.updateNote(req.params.id, title, content);
    if (!note) {
      req.logger.warn('Note not found for update', { noteId: req.params.id });
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Invalidate both specific note and list cache
    await cache.invalidateNotesCache(req.params.id);
    
    req.logger.info('Note updated successfully', { noteId: note.id });
    perf.end({ status: 'success', noteId: note.id });
    
    res.json(note);
  } catch (error) {
    req.logger.error('Error updating note', { 
      noteId: req.params.id,
      error: error.message,
      stack: error.stack 
    });
    perf.end({ status: 'error' });
    
    res.status(500).json({ 
      error: 'Failed to update note',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  const perf = logger.performance.start('delete_note');
  try {
    req.logger.info('Deleting note', { noteId: req.params.id });
    
    const note = await db.deleteNote(req.params.id);
    if (!note) {
      req.logger.warn('Note not found for deletion', { noteId: req.params.id });
      perf.end({ status: 'not_found' });
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Invalidate both specific note and list cache
    await cache.invalidateNotesCache(req.params.id);
    
    req.logger.info('Note deleted successfully', { noteId: note.id });
    perf.end({ status: 'success', noteId: note.id });
    
    res.json({ message: 'Note deleted successfully', note });
  } catch (error) {
    req.logger.error('Error deleting note', { 
      noteId: req.params.id,
      error: error.message,
      stack: error.stack 
    });
    perf.end({ status: 'error' });
    
    res.status(500).json({ 
      error: 'Failed to delete note',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// Performance monitoring endpoint
app.get('/api/stats', async (req, res) => {
  const perf = logger.performance.start('get_stats');
  try {
    const stats = cache.getStats();
    const keyCount = await cache.getKeyCount();
    
    req.logger.info('Stats requested', { keyCount });
    perf.end({ status: 'success' });
    
    res.json({
      ...stats,
      currentCacheKeys: keyCount,
      endpoints: {
        'GET /api/notes': 'Cached for 60s',
        'GET /api/notes/:id': 'Cached for 300s',
        'POST /api/notes': 'Invalidates list cache',
        'PUT /api/notes/:id': 'Invalidates specific note and list cache',
        'DELETE /api/notes/:id': 'Invalidates specific note and list cache'
      }
    });
  } catch (error) {
    req.logger.error('Error getting stats', { 
      error: error.message,
      stack: error.stack 
    });
    perf.end({ status: 'error' });
    
    res.status(500).json({ 
      error: 'Failed to get stats',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// Prometheus-compatible metrics endpoint
app.get('/metrics', async (req, res) => {
  const perf = logger.performance.start('get_metrics');
  try {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    const cacheStats = cache.getStats();
    
    // Format metrics in Prometheus format
    const metrics = [
      '# HELP notes_api_uptime_seconds Total uptime of the service in seconds',
      '# TYPE notes_api_uptime_seconds gauge',
      `notes_api_uptime_seconds ${uptime}`,
      '',
      '# HELP notes_api_memory_usage_bytes Memory usage in bytes',
      '# TYPE notes_api_memory_usage_bytes gauge',
      `notes_api_memory_usage_bytes{type="rss"} ${memUsage.rss}`,
      `notes_api_memory_usage_bytes{type="heap_total"} ${memUsage.heapTotal}`,
      `notes_api_memory_usage_bytes{type="heap_used"} ${memUsage.heapUsed}`,
      `notes_api_memory_usage_bytes{type="external"} ${memUsage.external}`,
      '',
      '# HELP notes_api_cache_hits_total Total number of cache hits',
      '# TYPE notes_api_cache_hits_total counter',
      `notes_api_cache_hits_total ${cacheStats.hits || 0}`,
      '',
      '# HELP notes_api_cache_misses_total Total number of cache misses',
      '# TYPE notes_api_cache_misses_total counter',
      `notes_api_cache_misses_total ${cacheStats.misses || 0}`,
      '',
      '# HELP notes_api_cache_hit_rate Cache hit rate percentage',
      '# TYPE notes_api_cache_hit_rate gauge',
      `notes_api_cache_hit_rate ${cacheStats.hitRate || 0}`,
      '',
      '# HELP notes_api_database_status Database connection status (1=connected, 0=disconnected)',
      '# TYPE notes_api_database_status gauge',
      `notes_api_database_status ${db.getConnectionStatus() ? 1 : 0}`,
      '',
      '# HELP notes_api_cache_status Cache connection status (1=connected, 0=disconnected)',
      '# TYPE notes_api_cache_status gauge',
      `notes_api_cache_status ${cache.getConnectionStatus() ? 1 : 0}`,
      ''
    ].join('\n');

    req.logger.info('Metrics requested');
    perf.end({ status: 'success' });
    
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
    
  } catch (error) {
    req.logger.error('Error generating metrics', { 
      error: error.message,
      stack: error.stack 
    });
    perf.end({ status: 'error' });
    
    res.status(500).json({ 
      error: 'Failed to generate metrics',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// Admin endpoint to clear cache
app.post('/api/cache/clear', async (req, res) => {
  const perf = logger.performance.start('clear_cache');
  try {
    req.logger.info('Cache clear requested');
    const success = await cache.flushAll();
    
    if (success) {
      req.logger.info('Cache cleared successfully');
      perf.end({ status: 'success' });
      res.json({ message: 'Cache cleared successfully' });
    } else {
      req.logger.warn('Failed to clear cache - operation returned false');
      perf.end({ status: 'failed' });
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  } catch (error) {
    req.logger.error('Error clearing cache', { 
      error: error.message,
      stack: error.stack 
    });
    perf.end({ status: 'error' });
    
    res.status(500).json({ 
      error: 'Failed to clear cache',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// Add error handling middleware (must be last)
app.use(logger.errorHandler);

// Global server instance for graceful shutdown
let server;

async function startServer() {
  try {
    logger.info('Starting Notes API server...');
    
    // Connect to database first
    await db.connectWithRetry();
    logger.info('Database connection established');
    
    // Connect to Redis (non-blocking if fails)
    await cache.connectToRedis();
    logger.info(`Cache connection: ${cache.getConnectionStatus() ? 'established' : 'unavailable (degraded mode)'}`);
    
    server = app.listen(PORT, () => {
      logger.info('Server started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV,
        healthEndpoints: {
          basic: `http://localhost:${PORT}/health`,
          ready: `http://localhost:${PORT}/health/ready`,
          live: `http://localhost:${PORT}/health/live`
        },
        apiEndpoint: `http://localhost:${PORT}/api/notes`,
        monitoringEndpoints: {
          stats: `http://localhost:${PORT}/api/stats`,
          metrics: `http://localhost:${PORT}/metrics`
        },
        adminEndpoints: {
          clearCache: `http://localhost:${PORT}/api/cache/clear`
        }
      });
    });
    
    // Graceful shutdown handling
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      
      try {
        // Close database connections
        if (db.close) {
          await db.close();
          logger.info('Database connections closed');
        }
        
        // Close Redis connections
        if (cache.client && cache.client()) {
          await cache.client().quit();
          logger.info('Cache connections closed');
        }
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', { error: error.message });
        process.exit(1);
      }
    });
  }
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

startServer();
