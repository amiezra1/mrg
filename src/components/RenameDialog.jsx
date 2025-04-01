import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export default function RenameDialog({ isOpen, onClose, item, onRename }) {
  const [newName, setNewName] = useState(item?.name || '');
  const [error, setError] = useState('');

  if (!isOpen || !item) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!newName.trim()) {
      setError('נא להזין שם חדש');
      return;
    }

    // בדיקה שהשם לא זהה לשם הנוכחי
    if (newName.trim() === item.name) {
      onClose();
      return;
    }

    onRename(item.id, newName.trim())
      .then(() => {
        onClose();
      })
      .catch(error => {
        console.error('Failed to rename item:', error);
        setError('שגיאה בשינוי השם');
      });
  };

  return (
    <div className="dialog-backdrop">
      <div className="dialog">
        <div className="dialog-header">
          <h3 className="dialog-title">
            שינוי שם {item.type === 'folder' ? 'תיקייה' : 'קובץ'}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-full h-8 w-8 p-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="dialog-body">
            <label htmlFor="newName" className="block mb-2">שם חדש:</label>
            <Input
              id="newName"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setError('');
              }}
              className="w-full text-black"
              error={!!error}
              autoFocus
            />
            {error && <p className="text-red-500 mt-1 text-sm">{error}</p>}
          </div>

          <div className="dialog-footer">
            <Button type="button" variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button type="submit">
              שינוי שם
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}