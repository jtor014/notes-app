const express = require('express');
const db = require('./db');

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
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'error',
      error: error.message
    });
  }
});

app.get('/api/notes', async (req, res) => {
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

app.get('/api/notes/:id', async (req, res) => {
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
    res.json({ message: 'Note deleted successfully', note });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ 
      error: 'Failed to delete note',
      message: error.message 
    });
  }
});

async function startServer() {
  try {
    await db.connectWithRetry();
    
    app.listen(PORT, () => {
      console.log(`\n🚀 Server is running on port ${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`📝 Notes API: http://localhost:${PORT}/api/notes`);
      console.log(`🔗 Database: Connected to PostgreSQL\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();