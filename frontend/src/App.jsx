import React, { useState, useEffect } from 'react';
import NotesList from './components/NotesList';
import NoteForm from './components/NoteForm';

const API_BASE_URL = '/api';

function App() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingNote, setEditingNote] = useState(null);

  // Fetch all notes from the API
  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/notes`);
      if (!response.ok) {
        throw new Error(`Failed to fetch notes: ${response.status}`);
      }
      const data = await response.json();
      setNotes(data);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Failed to load notes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load notes on component mount
  useEffect(() => {
    fetchNotes();
  }, []);

  // Create a new note
  const handleCreateNote = async (noteData) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create note: ${response.status}`);
      }

      const newNote = await response.json();
      setNotes(prevNotes => [newNote, ...prevNotes]);
      return true;
    } catch (err) {
      console.error('Error creating note:', err);
      setError('Failed to create note. Please try again.');
      return false;
    }
  };

  // Update an existing note
  const handleUpdateNote = async (noteId, noteData) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update note: ${response.status}`);
      }

      const updatedNote = await response.json();
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === noteId ? updatedNote : note
        )
      );
      setEditingNote(null);
      return true;
    } catch (err) {
      console.error('Error updating note:', err);
      setError('Failed to update note. Please try again.');
      return false;
    }
  };

  // Delete a note
  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete note: ${response.status}`);
      }

      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      if (editingNote && editingNote.id === noteId) {
        setEditingNote(null);
      }
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note. Please try again.');
    }
  };

  // Start editing a note
  const handleEditNote = (note) => {
    setEditingNote(note);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingNote(null);
  };

  return (
    <div className="container">
      <div className="header">
        <h1>📝 Notes App</h1>
        <p>A full-stack containerized notes application with Docker, React, Node.js, and PostgreSQL</p>
      </div>

      {error && (
        <div className="error">
          {error}
          <button 
            className="button secondary" 
            onClick={fetchNotes}
            style={{ marginLeft: '1rem' }}
          >
            Retry
          </button>
        </div>
      )}

      <NoteForm 
        onSubmit={handleCreateNote}
        editingNote={editingNote}
        onUpdate={handleUpdateNote}
        onCancel={handleCancelEdit}
      />

      {loading ? (
        <div className="loading">Loading notes...</div>
      ) : (
        <NotesList 
          notes={notes}
          onEdit={handleEditNote}
          onDelete={handleDeleteNote}
          editingNoteId={editingNote?.id}
        />
      )}
    </div>
  );
}

export default App;