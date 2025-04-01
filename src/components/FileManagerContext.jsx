// FileManagerContext.jsx - גרסה פשוטה
import React, { createContext, useState, useContext, useEffect } from 'react';
import { sharePointService } from '../services/sharepoint';
import { permissionsService } from '../services/permissions';

// יצירת הקונטקסט
const FileManagerContext = createContext();

export function FileManagerProvider({ children }) {
  const [folders, setFolders] = useState({
    root: [] // תיקיות ראשיות - יתמלא באתחול
  });

  const [loading, setLoading] = useState(true);

  // טעינת נתונים התחלתיים
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);

      try {
        console.log('Loading root folders...');
        const rootFolders = await sharePointService.getRootFolders();
        console.log('Root folders loaded:', rootFolders);

        // יצירת המבנה הראשוני של התיקיות
        const folderState = {
          root: rootFolders
        };

        // יצירת מפתחות ריקים עבור תוכן כל תיקייה
        rootFolders.forEach(folder => {
          folderState[folder.id] = [];
        });

        setFolders(folderState);
      } catch (error) {
        console.error('Error loading initial data:', error);

        // במקרה של שגיאה, טען תיקיות ברירת מחדל
        const defaultFolders = Array.from({ length: 9 }, (_, i) => ({
          id: `folder-${i + 1}`,
          name: `תיקייה ראשית ${i + 1}`,
          type: 'folder',
          parentId: null,
          folderIcon: '/Folder.png',
          backgroundImage: '/background.png'
        }));

        const folderState = {
          root: defaultFolders
        };

        defaultFolders.forEach(folder => {
          folderState[folder.id] = [];
        });

        setFolders(folderState);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // פונקציה לקבלת מידע על תיקייה
  const getFolderInfo = (folderId) => {
    if (!folderId) return {
      backgroundImage: '/background.png',
      folderIcon: '/Folder.png',
      name: ''
    };

    // בדיקה אם זו תיקייה ראשית
    const rootFolder = folders.root.find(f => f.id === folderId);
    if (rootFolder) {
      return {
        backgroundImage: rootFolder.backgroundImage || '/background.png',
        folderIcon: rootFolder.folderIcon || '/Folder.png',
        name: rootFolder.name
      };
    }

    // אם זו לא תיקייה ראשית, מנסה למצוא את התיקייה בכל התיקיות
    for (const key in folders) {
      if (key !== 'root') {
        const found = folders[key]?.find(item =>
          item.type === 'folder' && item.id === folderId
        );
        if (found) {
          return {
            backgroundImage: found.backgroundImage || '/background.png',
            folderIcon: found.folderIcon || '/Folder.png',
            name: found.name
          };
        }
      }
    }

    return {
      backgroundImage: '/background.png',
      folderIcon: '/Folder.png',
      name: folderId
    };
  };

  // פונקציה ליצירת תיקייה חדשה
  const createFolder = async (parentId, folderName) => {
    try {
      // יצירת התיקייה בשרת
      const newFolderId = await sharePointService.createFolder(parentId, folderName);

      // יצירת אובייקט התיקייה החדשה
      const newFolder = {
        id: newFolderId,
        name: folderName,
        type: 'folder',
        parentId,
        createdAt: Date.now()
      };

      // עדכון המצב המקומי
      setFolders(prevFolders => {
        // הוספת התיקייה לתיקיית האב
        const parentFolderItems = [...(prevFolders[parentId] || []), newFolder];

        // עדכון המצב
        return {
          ...prevFolders,
          [parentId]: parentFolderItems,
          [newFolderId]: [] // תיקייה חדשה ריקה
        };
      });

      return newFolderId;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  };

  // פונקציה להעלאת קובץ
  const uploadFile = async (folderId, file) => {
    try {
      // העלאת הקובץ לשרת
      const uploadedFile = await sharePointService.uploadFile(folderId, file);

      // עדכון המצב המקומי
      setFolders(prevFolders => {
        // הוספת הקובץ לתיקייה
        const folderItems = [...(prevFolders[folderId] || []), uploadedFile];

        // עדכון המצב
        return {
          ...prevFolders,
          [folderId]: folderItems
        };
      });

      return uploadedFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  // פונקציה לקבלת תכולת תיקייה
  const getFolderContents = async (folderId) => {
    try {
      // אם יש כבר נתונים בזיכרון, השתמש בהם
      if (folders[folderId] && folders[folderId].length > 0) {
        return folders[folderId];
      }

      // אחרת, טען מהשרת
      const contents = await sharePointService.getFolderContents(folderId);

      // עדכון המצב המקומי
      setFolders(prevFolders => ({
        ...prevFolders,
        [folderId]: contents
      }));

      return contents;
    } catch (error) {
      console.error(`Error fetching folder contents for ${folderId}:`, error);
      return [];
    }
  };

  // פונקציה לקבלת כל התיקיות הראשיות
  const getRootFolders = () => {
    // וידוא שמחזירים תמיד משהו, גם אם הזיכרון ריק
    if (!folders.root || folders.root.length === 0) {
      console.log('Root folders are empty, returning default folders');
      return Array.from({ length: 9 }, (_, i) => ({
        id: `folder-${i + 1}`,
        name: `תיקייה ראשית ${i + 1}`,
        type: 'folder',
        parentId: null,
        folderIcon: '/Folder.png',
        backgroundImage: '/background.png'
      }));
    }

    return folders.root;
  };

  // פונקציה למחיקת פריט
  const deleteItem = async (itemId, parentId, itemType) => {
    try {
      // מחיקת הפריט מהשרת
      await sharePointService.deleteItem(itemId, itemType);

      // עדכון המצב המקומי
      setFolders(prevFolders => {
        // מחיקת הפריט מתיקיית האב
        const updatedParentContents = (prevFolders[parentId] || [])
          .filter(item => item.id !== itemId);

        const newFolders = {
          ...prevFolders,
          [parentId]: updatedParentContents
        };

        // אם זו תיקייה, מחיקת התכולה שלה
        if (itemType === 'folder' && newFolders[itemId]) {
          delete newFolders[itemId];
        }

        return newFolders;
      });

      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  };

  // פונקציה לשינוי שם של פריט
  const renameItem = async (itemId, parentId, newName) => {
    try {
      // שינוי השם בשרת
      await sharePointService.renameItem(itemId, newName);

      // עדכון המצב המקומי
      setFolders(prevFolders => {
        // עדכון השם בתיקיית האב
        const updatedParentContents = (prevFolders[parentId] || []).map(item => {
          if (item.id === itemId) {
            return { ...item, name: newName };
          }
          return item;
        });

        return {
          ...prevFolders,
          [parentId]: updatedParentContents
        };
      });

      return true;
    } catch (error) {
      console.error('Error renaming item:', error);
      throw error;
    }
  };

  // פונקציה לבדיקת הרשאות
  const checkPermission = async (permission) => {
    return await permissionsService.checkPermission(permission);
  };

  // ערך להעברה ל-Context
  const value = {
    folders,
    loading,
    getFolderInfo,
    createFolder,
    uploadFile,
    getFolderContents,
    getRootFolders,
    deleteItem,
    renameItem,
    checkPermission
  };

  return (
    <FileManagerContext.Provider value={value}>
      {children}
    </FileManagerContext.Provider>
  );
}

export function useFileManager() {
  return useContext(FileManagerContext);
}