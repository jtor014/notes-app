const express = require('express');
const db = require('./db');
const cache = require('./cache');

const app = express();
const PORT = 3000;

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/health', async (req, res) => {
  try {
    const dbStatus = db.getConnectionStatus();
    const cacheStatus = cache.getConnectionStatus();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'connected' : 'disconnected',
      cache: cacheStatus ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'error',
      cache: 'error',
      error: error.message
    });
  }
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
  try {
    const notes = await db.getAllNotes();
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ 
      error: 'Failed to fetch notes',
      message: error.message 
    });
  }
});

app.get('/api/notes/:id', cacheSingleNote, async (req, res) => {
  try {
    const note = await db.getNoteById(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ 
      error: 'Failed to fetch note',
      message: error.message 
    });
  }
});

app.post('/api/notes', async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const note = await db.createNote(title, content);
    
    // Invalidate cache after creating
    await cache.invalidateNotesCache();
    
    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ 
      error: 'Failed to create note',
      message: error.message 
    });
  }
});

app.put('/api/notes/:id', async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const note = await db.updateNote(req.params.id, title, content);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Invalidate both specific note and list cache
    await cache.invalidateNotesCache(req.params.id);
    
    res.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ 
      error: 'Failed to update note',
      message: error.message 
    });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    const note = await db.deleteNote(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Invalidate both specific note and list cache
    await cache.invalidateNotesCache(req.params.id);
    
    res.json({ message: 'Note deleted successfully', note });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ 
      error: 'Failed to delete note',
      message: error.message 
    });
  }
});

// Performance monitoring endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const stats = cache.getStats();
    const keyCount = await cache.getKeyCount();
    
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
    console.error('Error getting stats:', error);
    res.status(500).json({ 
      error: 'Failed to get stats',
      message: error.message 
    });
  }
});

// Admin endpoint to clear cache
app.post('/api/cache/clear', async (req, res) => {
  try {
    const success = await cache.flushAll();
    if (success) {
      res.json({ message: 'Cache cleared successfully' });
    } else {
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ 
      error: 'Failed to clear cache',
      message: error.message 
    });
  }
});

async function startServer() {
  try {
    // Connect to database first
    await db.connectWithRetry();
    
    // Connect to Redis (non-blocking if fails)
    await cache.connectToRedis();
    
    app.listen(PORT, () => {
      console.log(`\n🚀 Server is running on port ${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`📝 Notes API: http://localhost:${PORT}/api/notes`);
      console.log(`📊 Stats endpoint: http://localhost:${PORT}/api/stats`);
      console.log(`🔗 Database: Connected to PostgreSQL`);
      console.log(`⚡ Cache: ${cache.getConnectionStatus() ? 'Connected to Redis' : 'Redis unavailable (degraded mode)'}\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();