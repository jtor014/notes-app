import React, { useState, useEffect } from 'react';

function NoteForm({ onSubmit, editingNote, onUpdate, onCancel }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when editing note changes
  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title);
      setContent(editingNote.content || '');
    } else {
      setTitle('');
      setContent('');
    }
  }, [editingNote]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Please enter a title for your note');
      return;
    }

    setIsSubmitting(true);

    const noteData = {
      title: title.trim(),
      content: content.trim()
    };

    let success = false;

    if (editingNote) {
      success = await onUpdate(editingNote.id, noteData);
    } else {
      success = await onSubmit(noteData);
    }

    if (success && !editingNote) {
      // Only clear form for new notes, not for edits
      setTitle('');
      setContent('');
    }

    setIsSubmitting(false);
  };

  const handleCancel = () => {
    setTitle('');
    setContent('');
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="note-form">
      <h2>{editingNote ? 'Edit Note' : 'Create New Note'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter note title..."
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter note content..."
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <button 
            type="submit" 
            className="button"
            disabled={isSubmitting || !title.trim()}
          >
            {isSubmitting 
              ? (editingNote ? 'Updating...' : 'Creating...') 
              : (editingNote ? 'Update Note' : 'Create Note')
            }
          </button>
          
          {editingNote && (
            <button 
              type="button" 
              className="button secondary"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default NoteForm;