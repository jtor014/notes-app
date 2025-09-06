import React from 'react';
import NoteItem from './NoteItem';

function NotesList({ notes, onEdit, onDelete, editingNoteId }) {
  if (notes.length === 0) {
    return (
      <div className="empty-state">
        <h3>No notes yet</h3>
        <p>Create your first note using the form above!</p>
      </div>
    );
  }

  return (
    <div className="notes-list">
      {notes.map((note) => (
        <NoteItem
          key={note.id}
          note={note}
          onEdit={onEdit}
          onDelete={onDelete}
          isEditing={editingNoteId === note.id}
        />
      ))}
    </div>
  );
}

export default NotesList;