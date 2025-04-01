import React, { createContext, useState, useContext, useEffect } from 'react';
import { sharePointService } from '../services/sharepoint';
import { permissionsService } from '../services/permissions';

// יצירת הקונטקסט
const FileManagerContext = createContext();

// נתוני תיקיות ראשיות עם מאפיינים מותאמים
const rootFoldersCustomData = {
  '1': {
    backgroundImage: '/background.png',
    folderIcon: '/Folder.png',
    name: 'תיקייה ראשית 1'
  },
  '2': {
    backgroundImage: '/background.png',
    folderIcon: '/Folder.png',
    name: 'תיקייה ראשית 2'
  },
  '3': {
    backgroundImage: '/background.png',
    folderIcon: '/Folder.png',
    name: 'תיקייה ראשית 3'
  },
  '4': {
    backgroundImage: '/background.png',
    folderIcon: '/Folder.png',
    name: 'תיקייה ראשית 4'
  },
  '5': {
    backgroundImage: '/background.png',
    folderIcon: '/Folder.png',
    name: 'תיקייה ראשית 5'
  },
  '6': {
    backgroundImage: '/background.png',
    folderIcon: '/Folder.png',
    name: 'תיקייה ראשית 6'
  },
  '7': {
    backgroundImage: '/background.png',
    folderIcon: '/Folder.png',
    name: 'תיקייה ראשית 7'
  },
  '8': {
    backgroundImage: '/background.png',
    folderIcon: '/Folder.png',
    name: 'תיקייה ראשית 8'
  },
  '9': {
    backgroundImage: '/background.png',
    folderIcon: '/Folder.png',
    name: 'תיקייה ראשית 9'
  }
};

// פונקציית עזר לשמירת נתונים לדיסק
const saveDataToLocalStorage = (data) => {
  try {
    localStorage.setItem('filemanager_folders', JSON.stringify(data));
    console.log('Data saved to localStorage');
    return true;
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
    return false;
  }
};

// פונקציית עזר לטעינת נתונים מהדיסק
const loadDataFromLocalStorage = () => {
  try {
    const data = localStorage.getItem('filemanager_folders');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
    return null;
  }
};

export function FileManagerProvider({ children }) {
  const [folders, setFolders] = useState({
    root: [], // תיקיות ראשיות
    // תוכן התיקיות יתווסף דינמית
  });

  const [loading, setLoading] = useState(true);

  // טעינת נתונים התחלתיים
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // ראשית בודקים אם יש נתונים בלוקל סטורג'
        const savedData = loadDataFromLocalStorage();
        if (savedData && Object.keys(savedData).length > 0) {
          console.log('Data loaded from localStorage');
          setFolders(savedData);
          setLoading(false);
          return;
        }

        // אם אין נתונים בלוקל סטורג', מנסים להביא מ-SharePoint
        console.log('No data in localStorage, trying to load from SharePoint');
        let rootFolders = await sharePointService.getRootFolders();

        // הוספת מידע מותאם לתיקיות ראשיות
        rootFolders = rootFolders.map((folder, index) => {
          const folderId = index + 1; // מספר התיקייה (1-9)
          const customData = rootFoldersCustomData[folderId];

          return {
            ...folder,
            name: customData?.name || `תיקייה ראשית ${folderId}`,
            folderIcon: customData?.folderIcon || '/Folder.png',
            backgroundImage: customData?.backgroundImage || '/background.png'
          };
        });

        // יצירת מפתחות עבור כל תיקייה ראשית
        const folderState = { root: rootFolders };
        rootFolders.forEach(folder => {
          folderState[folder.id] = [];
        });

        setFolders(folderState);
        saveDataToLocalStorage(folderState);
      } catch (error) {
        console.error('Error loading initial data:', error);

        // במקרה של שגיאה, טען נתוני ברירת מחדל
        const defaultFolders = Array.from({ length: 9 }, (_, i) => ({
          id: `folder-${i + 1}`,
          name: `תיקייה ראשית ${i + 1}`,
          type: 'folder',
          parentId: null,
          folderIcon: '/Folder.png',
          backgroundImage: '/background.png'
        }));

        const folderState = { root: defaultFolders };
        defaultFolders.forEach(folder => {
          folderState[folder.id] = [];
        });

        setFolders(folderState);
        saveDataToLocalStorage(folderState);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // פונקציה לקבלת מידע על תיקייה
  const getFolderInfo = (folderId) => {
    if (!folderId) return { backgroundImage: '/background.png', folderIcon: '/Folder.png', name: '' };

    // מנסה להוציא מספר תיקייה ראשית
    const folderNum = String(folderId).match(/\d+/);
    if (folderNum && rootFoldersCustomData[folderNum[0]]) {
      return {
        ...rootFoldersCustomData[folderNum[0]],
        name: rootFoldersCustomData[folderNum[0]].name || `תיקייה ראשית ${folderNum[0]}`
      };
    }

    // אם זו לא תיקייה ראשית, מנסה למצוא את התיקייה בכל התיקיות
    for (const key in folders) {
      if (key !== 'root') {
        const found = folders[key]?.find(item =>
          item.type === 'folder' && item.id?.toString() === folderId?.toString()
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

    return { backgroundImage: '/background.png', folderIcon: '/Folder.png', name: folderId };
  };

  // פונקציה ליצירת תיקייה חדשה - מחזירה Promise
  const createFolder = async (parentId, folderName) => {
    try {
      console.log(`Creating folder ${folderName} in parent ${parentId}`);

      // ניסיון ליצור תיקייה בשרת
      let newFolderId;
      try {
        newFolderId = await sharePointService.createFolder(parentId, folderName);
      } catch (spError) {
        console.warn('SharePoint folder creation failed, using local ID:', spError);
        // אם נכשל, נשתמש במזהה מקומי
        newFolderId = `folder-${Date.now()}`;
      }

      // יצירת אובייקט התיקייה החדשה
      const newFolder = {
        id: newFolderId,
        name: folderName,
        type: 'folder',
        parentId,
        createdAt: Date.now()
      };

      // עדכון המצב המקומי
      const updatedFolders = { ...folders };

      // הוספת התיקייה לתיקיית האב
      if (!updatedFolders[parentId]) {
        updatedFolders[parentId] = [];
      }
      updatedFolders[parentId] = [...updatedFolders[parentId], newFolder];

      // יצירת מקום לתכולת התיקייה החדשה
      updatedFolders[newFolderId] = [];

      // עדכון המצב
      setFolders(updatedFolders);

      // שמירה בלוקל סטורג'
      saveDataToLocalStorage(updatedFolders);

      console.log(`Folder created successfully: ${newFolderId}`);
      return newFolderId;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  };

  // פונקציה להעלאת קובץ - מחזירה Promise
  const uploadFile = async (folderId, file) => {
    try {
      console.log(`Uploading file ${file.name} to folder ${folderId}`);

      // ניסיון להעלות קובץ לשרת
      let uploadedFile;
      try {
        uploadedFile = await sharePointService.uploadFile(folderId, file);
      } catch (spError) {
        console.warn('SharePoint file upload failed, using local data:', spError);
        // אם נכשל, ניצור אובייקט קובץ מקומי
        uploadedFile = {
          id: `file-${Date.now()}`,
          name: file.name,
          type: 'file',
          size: file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown',
          parentId: folderId,
          createdAt: Date.now()
        };
      }

      // עדכון המצב המקומי
      const updatedFolders = { ...folders };

      // הוספת הקובץ לתיקייה
      if (!updatedFolders[folderId]) {
        updatedFolders[folderId] = [];
      }
      updatedFolders[folderId] = [...updatedFolders[folderId], uploadedFile];

      // עדכון המצב
      setFolders(updatedFolders);

      // שמירה בלוקל סטורג'
      saveDataToLocalStorage(updatedFolders);

      console.log(`File uploaded successfully: ${uploadedFile.id}`);
      return uploadedFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  // פונקציה לקבלת תכולת תיקייה - מחזירה Promise
  const getFolderContents = async (folderId) => {
    try {
      console.log(`Getting contents of folder ${folderId}`);

      // בדיקה אם יש תכולה מקומית בזיכרון
      if (folders[folderId]) {
        return folders[folderId];
      }

      // אם אין תכולה בזיכרון, מנסים להביא מהשרת
      let contents;
      try {
        contents = await sharePointService.getFolderContents(folderId);
      } catch (spError) {
        console.warn('SharePoint folder contents fetch failed, using empty array:', spError);
        contents = [];
      }

      // עדכון המצב המקומי
      const updatedFolders = { ...folders, [folderId]: contents };
      setFolders(updatedFolders);

      // שמירה בלוקל סטורג'
      saveDataToLocalStorage(updatedFolders);

      return contents;
    } catch (error) {
      console.error('Error fetching folder contents:', error);
      return [];
    }
  };

  // פונקציה לקבלת כל התיקיות הראשיות
  const getRootFolders = () => {
    return folders.root || [];
  };

  // פונקציה למחיקת פריט (תיקייה או קובץ) - מחזירה Promise
  const deleteItem = async (itemId, parentId, itemType) => {
    try {
      console.log(`Deleting ${itemType} ${itemId} from parent ${parentId}`);

      // ניסיון למחוק מהשרת
      try {
        await sharePointService.deleteItem(itemId, itemType);
      } catch (spError) {
        console.warn('SharePoint item deletion failed, continuing with local deletion:', spError);
      }

      // עדכון המצב המקומי
      const updatedFolders = { ...folders };

      // מחיקת הפריט מתיקיית האב
      if (updatedFolders[parentId]) {
        updatedFolders[parentId] = updatedFolders[parentId].filter(item => item.id !== itemId);
      }

      // אם זו תיקייה, מחיקת התכולה שלה
      if (itemType === 'folder' && updatedFolders[itemId]) {
        delete updatedFolders[itemId];
      }

      // עדכון המצב
      setFolders(updatedFolders);

      // שמירה בלוקל סטורג'
      saveDataToLocalStorage(updatedFolders);

      console.log(`Item deleted successfully: ${itemId}`);
      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  };

  // פונקציה לשינוי שם של פריט - מחזירה Promise
  const renameItem = async (itemId, parentId, newName) => {
    try {
      console.log(`Renaming item ${itemId} to ${newName}`);

      // ניסיון לשנות שם בשרת
      try {
        await sharePointService.renameItem(itemId, newName);
      } catch (spError) {
        console.warn('SharePoint item rename failed, continuing with local rename:', spError);
      }

      // עדכון המצב המקומי
      const updatedFolders = { ...folders };

      // שינוי שם הפריט בתיקיית האב
      if (updatedFolders[parentId]) {
        updatedFolders[parentId] = updatedFolders[parentId].map(item => {
          if (item.id === itemId) {
            return { ...item, name: newName };
          }
          return item;
        });
      }

      // עדכון המצב
      setFolders(updatedFolders);

      // שמירה בלוקל סטורג'
      saveDataToLocalStorage(updatedFolders);

      console.log(`Item renamed successfully: ${itemId} -> ${newName}`);
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