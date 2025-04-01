// src/pages/Folder.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { FolderPlus, Upload, ArrowLeft } from "lucide-react";
import { useFileManager } from '../context/FileManagerContext';
import { permissionsService } from '../services/permissions';
import Breadcrumbs from '../components/Breadcrumbs';
import FilePreview from '../components/FilePreview';
import FileList from '../components/FileList';
import FileSort from '../components/FileSort';
import FileSearch from '../components/FileSearch';

export default function FolderPage() {
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [folderContents, setFolderContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('name-asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFolderName, setCurrentFolderName] = useState('');

  // הרשאות
  const [canAdd, setCanAdd] = useState(false);
  const [isRootFolder, setIsRootFolder] = useState(false);
  const [canEditRoot, setCanEditRoot] = useState(false);

  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const folderId = urlParams.get('id');

  const { getFolderContents, createFolder, uploadFile, checkPermission } = useFileManager();

  // פונקציה לחילוץ שם התיקייה מה-ID
  const getFolderDisplayName = (id) => {
    if (!id) return '';

    // בדיקה אם זו תיקייה ראשית
    if (id.includes('folder-')) {
      const match = id.match(/folder-(\d+)/);
      if (match) {
        return `תיקייה ראשית ${match[1]}`;
      }
    }

    // אם לא תיקייה ראשית, מנסה לחלץ שם מהנתיב
    const pathParts = id.split('/');
    return pathParts[pathParts.length - 1];
  };

  // בדיקת הרשאות המשתמש
  useEffect(() => {
    const checkUserPermissions = async () => {
      try {
        // בדיקה ישירה אם המשתמש מחובר כמנהל
        const isAdmin = permissionsService.isAdminLoggedIn();

        if (isAdmin) {
          // אם מחובר כמנהל, הענק את כל ההרשאות ישירות
          setCanAdd(true);
          setCanEditRoot(true);
        } else {
          // אחרת בדוק הרשאות רגילות
          const hasAddPermission = await checkPermission('add');
          const hasEditRootPermission = await checkPermission('editRoot');
          setCanAdd(hasAddPermission);
          setCanEditRoot(hasEditRootPermission);
        }

        // בדיקה אם זו תיקייה ראשית
        if (folderId) {
          const folderParts = folderId.split('/').filter(Boolean);
          const isRoot = folderParts.length <= 1;
          setIsRootFolder(isRoot);
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
    };

    checkUserPermissions();
  }, [checkPermission, folderId]);

  // טעינת תכולת התיקייה
  useEffect(() => {
    const loadFolderContents = async () => {
      if (!folderId) return;

      setLoading(true);
      try {
        const contents = await getFolderContents(folderId);
        setFolderContents(contents);

        // קביעת שם התיקייה
        if (contents.length > 0 && contents[0].parentName) {
          // אם יש מידע על ההורה בתוכן
          setCurrentFolderName(contents[0].parentName);
        } else if (folderId.includes('folder-')) {
          // אם זו תיקייה ראשית
          const match = folderId.match(/folder-(\d+)/);
          if (match) {
            setCurrentFolderName(`תיקייה ראשית ${match[1]}`);
          } else {
            setCurrentFolderName(folderId);
          }
        } else {
          // במקרה שאין מידע בתוכן, אולי ניתן להוציא מהנתיב
          const pathParts = folderId.split('/');
          setCurrentFolderName(pathParts[pathParts.length - 1]);
        }
      } catch (error) {
        console.error('Error loading folder contents:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFolderContents();
  }, [folderId, getFolderContents]);

  // סינון ומיון הפריטים
  const filteredAndSortedItems = useMemo(() => {
    // סינון לפי מונח החיפוש
    let filtered = folderContents;
    if (searchTerm.trim()) {
      const normalizedSearchTerm = searchTerm.trim().toLowerCase();
      filtered = folderContents.filter(item =>
        item.name.toLowerCase().includes(normalizedSearchTerm)
      );
    }

    // מיון הפריטים
    return [...filtered].sort((a, b) => {
      // קודם כל, תיקיות לפני קבצים
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }

      // מיון לפי הפרמטר שנבחר
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'date-asc':
          return (a.createdAt || 0) - (b.createdAt || 0);
        case 'date-desc':
          return (b.createdAt || 0) - (a.createdAt || 0);
        default:
          return 0;
      }
    });
  }, [folderContents, searchTerm, sortBy]);

  // טיפול בהעלאת קובץ
  const handleFileUpload = (event) => {
    // בדיקת הרשאות - דלג על הבדיקה אם המשתמש הוא מנהל
    if (!permissionsService.isAdminLoggedIn()) {
      if (isRootFolder && !canEditRoot) {
        alert('אין לך הרשאה להעלאת קבצים לתיקייה ראשית');
        return;
      }

      if (!canAdd) {
        alert('אין לך הרשאה להעלאת קבצים');
        return;
      }
    }

    const files = event.target.files;
    if (files.length > 0) {
      const uploadPromises = [];

      for (let i = 0; i < files.length; i++) {
        uploadPromises.push(
          uploadFile(folderId, files[i])
            .catch(error => {
              console.error(`Error uploading file ${files[i].name}:`, error);
              alert(`שגיאה בהעלאת הקובץ ${files[i].name}: ${error.message}`);
            })
        );
      }

      // לאחר סיום כל ההעלאות, נרענן את תכולת התיקייה
      Promise.all(uploadPromises).then(() => {
        getFolderContents(folderId).then(contents => {
          setFolderContents(contents);
        });
      });
    }
  };

  // טיפול ביצירת תיקייה חדשה
  const handleCreateFolder = () => {
    // בדיקת הרשאות - דלג על הבדיקה אם המשתמש הוא מנהל
    if (!permissionsService.isAdminLoggedIn()) {
      if (isRootFolder && !canEditRoot) {
        alert('אין לך הרשאה ליצירת תיקיות בתיקייה ראשית');
        return;
      }

      if (!canAdd) {
        alert('אין לך הרשאה ליצירת תיקיות');
        return;
      }
    }

    if (newFolderName.trim()) {
      createFolder(folderId, newFolderName.trim())
        .then(() => {
          setNewFolderName('');
          setShowNewFolderInput(false);

          // רענון תכולת התיקייה לאחר יצירת תיקייה חדשה
          return getFolderContents(folderId);
        })
        .then(contents => {
          setFolderContents(contents);
        })
        .catch(error => {
          console.error('Error creating folder:', error);
          alert(`שגיאה ביצירת תיקייה: ${error.message}`);
        });
    }
  };

  // טיפול בלחיצה על קובץ
  const handleFileClick = (file) => {
    setPreviewFile(file);
  };

  // בדיקה אם להציג כפתורי הוספת תיקייה וקובץ
  const showAddButtons = permissionsService.isAdminLoggedIn() || (isRootFolder && canEditRoot) || (!isRootFolder && canAdd);

  // פונקצית דיבוג
  const debugPermissions = () => {
    const isAdmin = permissionsService.isAdminLoggedIn();
    alert(`
      מצב מנהל: ${isAdmin ? 'מחובר' : 'לא מחובר'}
      הרשאת הוספה: ${canAdd ? 'יש' : 'אין'}
      הרשאת עריכת תיקיות ראשיות: ${canEditRoot ? 'יש' : 'אין'}
      תיקייה ראשית: ${isRootFolder ? 'כן' : 'לא'}
      צריך להציג כפתורים: ${showAddButtons ? 'כן' : 'לא'}
    `);
  };

  return (
    <div>
      {/* נתיב ניווט */}
      <Breadcrumbs currentFolderId={folderId} />

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link to="/" className="mr-2">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 ml-1" />
              חזרה לדף הבית
            </Button>
          </Link>
          <h2 className="text-2xl font-bold">
            תיקייה: {loading ? 'טוען...' : currentFolderName || getFolderDisplayName(folderId)}
          </h2>
        </div>

        {/* כפתורי פעולה - מוצגים רק למשתמשים עם הרשאה מתאימה */}
        {showAddButtons && (
          <div className="flex gap-4">
            <Button
              onClick={() => setShowNewFolderInput(!showNewFolderInput)}
              className="gap-2"
            >
              <FolderPlus className="w-5 h-5" />
              תיקייה חדשה
            </Button>
            <Button
              onClick={() => document.getElementById('fileUpload').click()}
              className="gap-2"
            >
              <Upload className="w-5 h-5" />
              העלאת קובץ
            </Button>
            <input
              type="file"
              id="fileUpload"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        )}
      </div>

      {showNewFolderInput && (
        <div className="flex gap-2 mb-6">
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="שם התיקייה החדשה"
            className="max-w-xs"
          />
          <Button onClick={handleCreateFolder}>צור</Button>
        </div>
      )}

      {/* סרגל חיפוש ומיון */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <FileSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        <FileSort
          currentSort={sortBy}
          onSortChange={setSortBy}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      ) : (
        <FileList
          items={filteredAndSortedItems}
          onFileClick={handleFileClick}
          parentId={folderId}
        />
      )}

      {/* תצוגה מקדימה של קובץ */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {/* כפתור דיבוג הרשאות */}
      <div className="mt-4 text-center">
        <Button onClick={debugPermissions} variant="outline" size="sm">
          בדיקת הרשאות
        </Button>
      </div>
    </div>
  );
}