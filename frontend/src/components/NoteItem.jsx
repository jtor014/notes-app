import React from 'react';

function NoteItem({ note, onEdit, onDelete, isEditing }) {
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Unknown date';
    }
  };

  const getContentPreview = (content, maxLength = 200) => {
    if (!content) return 'No content';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className={`note-item ${isEditing ? 'editing' : ''}`}>
      <div className="note-header">
        <h3 className="note-title">{note.title}</h3>
        <div className="note-actions">
          <button
            className="button secondary"
            onClick={() => onEdit(note)}
            disabled={isEditing}
          >
            {isEditing ? 'Editing...' : 'Edit'}
          </button>
          <button
            className="button danger"
            onClick={() => onDelete(note.id)}
            disabled={isEditing}
          >
            Delete
          </button>
        </div>
      </div>
      
      <div className="note-content">
        {getContentPreview(note.content)}
      </div>
      
      <div className="note-meta">
        <div>
          Created: {formatDate(note.created_at)}
          {note.updated_at !== note.created_at && (
            <> • Updated: {formatDate(note.updated_at)}</>
          )}
        </div>
      </div>
    </div>
  );
}

export default NoteItem;