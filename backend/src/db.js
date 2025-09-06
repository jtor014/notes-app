const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'notesdb',
  user: process.env.DB_USER || 'notesuser',
  password: process.env.DB_PASSWORD || 'notespass',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

let isConnected = false;

async function connectWithRetry(maxRetries = 10, delay = 3000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('✅ Successfully connected to PostgreSQL database');
      isConnected = true;
      return;
    } catch (err) {
      console.log(`⏳ Waiting for database... Attempt ${i + 1}/${maxRetries}`);
      if (i === maxRetries - 1) {
        console.error('❌ Failed to connect to database after maximum retries:', err.message);
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function query(text, params) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  }
}

async function getAllNotes() {
  const result = await query('SELECT * FROM notes ORDER BY created_at DESC');
  return result.rows;
}

async function getNoteById(id) {
  const result = await query('SELECT * FROM notes WHERE id = $1', [id]);
  return result.rows[0];
}

async function createNote(title, content) {
  const result = await query(
    'INSERT INTO notes (title, content) VALUES ($1, $2) RETURNING *',
    [title, content]
  );
  return result.rows[0];
}

async function updateNote(id, title, content) {
  const result = await query(
    'UPDATE notes SET title = $1, content = $2 WHERE id = $3 RETURNING *',
    [title, content, id]
  );
  return result.rows[0];
}

async function deleteNote(id) {
  const result = await query('DELETE FROM notes WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
}

function getConnectionStatus() {
  return isConnected;
}

module.exports = {
  connectWithRetry,
  query,
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  getConnectionStatus,
  pool
};