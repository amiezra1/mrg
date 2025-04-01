// src/components/FileList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { FileText, Folder, Trash2, Edit2 } from 'lucide-react';
import { useFileManager } from '../context/FileManagerContext';
import RenameDialog from './RenameDialog';

export default function FileList({ items, onFileClick, parentId }) {
  const { deleteItem, renameItem, checkPermission } = useFileManager();
  const [itemToRename, setItemToRename] = useState(null);

  // הרשאות
  const [canDelete, setCanDelete] = useState(false);
  const [canRename, setCanRename] = useState(false);
  const [canEditRoot, setCanEditRoot] = useState(false);

  // בדיקת הרשאות בטעינה
  useEffect(() => {
    const checkPermissions = async () => {
      const deletePermission = await checkPermission('delete');
      const editRootPermission = await checkPermission('editRoot');

      setCanDelete(deletePermission);
      setCanRename(deletePermission); // אותן הרשאות כמו מחיקה
      setCanEditRoot(editRootPermission);
    };

    checkPermissions();
  }, [checkPermission]);

  // פונקציה לקבלת אייקון מתאים לסוג הקובץ
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();

    const extensionIcons = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      xls: '📊',
      xlsx: '📊',
      ppt: '📊',
      pptx: '📊',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      mp4: '🎬',
      mp3: '🎵',
      txt: '📄',
      zip: '🗜️',
      rar: '🗜️'
    };

    return extensionIcons[extension] || '📄';
  };

  // פונקציה לטיפול במחיקת פריט
  const handleDeleteItem = (e, item) => {
    e.preventDefault(); // למנוע כניסה לתיקייה במקרה של מחיקת תיקייה
    e.stopPropagation(); // למנוע צפייה בקובץ במקרה של מחיקת קובץ

    // בדיקה אם זו תיקייה ראשית
    const isRootFolder = !item.parentId || item.parentId === 'root';

    // בדיקת הרשאות
    if (isRootFolder && !canEditRoot) {
      alert('אין לך הרשאה למחוק תיקייה ראשית');
      return;
    }

    if (!canDelete) {
      alert('אין לך הרשאה למחוק פריטים');
      return;
    }

    if (window.confirm(`האם אתה בטוח שברצונך למחוק את ${item.type === 'folder' ? 'התיקייה' : 'הקובץ'} "${item.name}"?`)) {
      deleteItem(item.id, parentId, item.type)
        .catch(error => {
          console.error('Failed to delete item:', error);
          alert(`שגיאה במחיקת הפריט: ${error.message}`);
        });
    }
  };

  // פונקציה לפתיחת דיאלוג שינוי שם
  const handleRenameClick = (e, item) => {
    e.preventDefault(); // למנוע כניסה לתיקייה במקרה של שינוי שם תיקייה
    e.stopPropagation(); // למנוע צפייה בקובץ במקרה של שינוי שם קובץ

    // בדיקה אם זו תיקייה ראשית
    const isRootFolder = !item.parentId || item.parentId === 'root';

    // בדיקת הרשאות
    if (isRootFolder && !canEditRoot) {
      alert('אין לך הרשאה לשנות שם תיקייה ראשית');
      return;
    }

    if (!canRename) {
      alert('אין לך הרשאה לשנות שם פריטים');
      return;
    }

    setItemToRename(item);
  };

  // פונקציה לשינוי שם של פריט
  const handleRename = (itemId, newName) => {
    return renameItem(itemId, parentId, newName);
  };

  // בדיקה אם הרשימה ריקה
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        התיקייה ריקה. הוסף תיקיות או קבצים באמצעות הכפתורים למעלה.
      </div>
    );
  }

  // מיון הפריטים כך שהתיקיות יופיעו קודם
  const sortedItems = [...items].sort((a, b) => {
    // תיקיות לפני קבצים
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    // מיון לפי שם
    return a.name.localeCompare(b.name);
  });

  // בדיקה אם אפשר לערוך פריט ספציפי
  const canEditItem = (item) => {
    const isRootFolder = !item.parentId || item.parentId === 'root';
    if (isRootFolder) {
      return canEditRoot;
    }
    return canDelete; // אותן הרשאות כמו מחיקה
  };

  return (
    <>
      <div className="folders-grid">
        {sortedItems.map((item) => {
          const isItemEditable = canEditItem(item);

          return (
            <div
              key={item.id}
              className="relative"
            >
              {item.type === 'folder' ? (
                <Link
                  to={createPageUrl(`Folder?id=${item.id}`)}
                  className="folder-item"
                >
                  <img src="/Folder.png" alt="תיקייה" className="folder-icon" />
                  <span className="folder-name">{item.name}</span>

                  {/* כפתורי פעולות - מוצגים רק למשתמשים עם הרשאה */}
                  {isItemEditable && (
                    <div className="folder-actions">
                      <button
                        onClick={(e) => handleRenameClick(e, item)}
                        className="action-btn action-btn-edit"
                        aria-label="שנה שם תיקייה"
                      >
                        <Edit2 className="icon" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteItem(e, item)}
                        className="action-btn action-btn-delete"
                        aria-label="מחק תיקייה"
                      >
                        <Trash2 className="icon" />
                      </button>
                    </div>
                  )}
                </Link>
              ) : (
                <button
                  onClick={() => onFileClick(item)}
                  className="folder-item"
                >
                  <div className="folder-icon flex items-center justify-center">
                    <div className="text-4xl">{getFileIcon(item.name)}</div>
                  </div>
                  <span className="folder-name">{item.name}</span>
                  <span className="text-sm text-gray-300">{item.size}</span>

                  {/* כפתורי פעולות - מוצגים רק למשתמשים עם הרשאה */}
                  {isItemEditable && (
                    <div className="folder-actions">
                      <button
                        onClick={(e) => handleRenameClick(e, item)}
                        className="action-btn action-btn-edit"
                        aria-label="שנה שם קובץ"
                      >
                        <Edit2 className="icon" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteItem(e, item)}
                        className="action-btn action-btn-delete"
                        aria-label="מחק קובץ"
                      >
                        <Trash2 className="icon" />
                      </button>
                    </div>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* דיאלוג שינוי שם */}
      {itemToRename && (
        <RenameDialog
          isOpen={true}
          onClose={() => setItemToRename(null)}
          item={itemToRename}
          onRename={handleRename}
        />
      )}
    </>
  );
}