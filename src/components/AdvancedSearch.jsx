// AdminSettings.jsx - קובץ מלא ומתוקן

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useFileManager } from '../context/FileManagerContext';

export default function AdminSettings() {
  const navigate = useNavigate();
  const { getRootFolders, createFolder, uploadFile, getFolderContents, deleteItem, renameItem } = useFileManager();

  const [isPasswordCorrect, setIsPasswordCorrect] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rootFolders, setRootFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderSettings, setFolderSettings] = useState({
    name: '',
    backgroundImage: '',
    folderIcon: ''
  });

  // סיסמת מנהל
  const adminPassword = 'admin123';

  // טעינת התיקיות הראשיות
  useEffect(() => {
    if (isPasswordCorrect) {
      const folders = getRootFolders();
      setRootFolders(folders);
    }
  }, [isPasswordCorrect, getRootFolders]);

  const handleLogin = () => {
    if (password === adminPassword) {
      setIsPasswordCorrect(true);
      setError('');
    } else {
      setError('סיסמה שגויה');
    }
  };

  const handleFolderSelect = (folder) => {
    setSelectedFolder(folder);
    setFolderSettings({
      name: folder.name,
      backgroundImage: folder.backgroundImage || '',
      folderIcon: folder.folderIcon || ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFolderSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveSettings = () => {
    // כאן יש לבצע שמירה של ההגדרות
    // לדוגמה פשוטה - עדכון בזיכרון המקומי (לא יישמר לאחר רענון)
    const updatedFolders = rootFolders.map(folder => {
      if (folder.id === selectedFolder.id) {
        return {
          ...folder,
          name: folderSettings.name,
          backgroundImage: folderSettings.backgroundImage,
          folderIcon: folderSettings.folderIcon
        };
      }
      return folder;
    });

    setRootFolders(updatedFolders);
    alert(`הגדרות נשמרו עבור ${folderSettings.name}`);
  };

  // פונקציה לניהול קבצים ותיקיות עם הרשאות מנהל (עוקפת בדיקות הרשאה)
  const handleAdminFileOperation = (operation, params) => {
    // כמנהל, אנחנו מדלגים על בדיקות הרשאה
    switch (operation) {
      case 'createFolder':
        return createFolder(params.parentId, params.folderName);
      case 'uploadFile':
        return uploadFile(params.folderId, params.file);
      case 'deleteItem':
        return deleteItem(params.itemId, params.parentId, params.itemType);
      case 'renameItem':
        return renameItem(params.itemId, params.parentId, params.newName);
      default:
        return null;
    }
  };

  if (!isPasswordCorrect) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg max-w-md mx-auto mt-8">
        <h2 className="text-2xl font-bold mb-6">הגדרות מנהל מערכת</h2>
        <p className="mb-4">יש להזין סיסמת מנהל כדי לגשת להגדרות המערכת</p>

        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="סיסמת מנהל"
          className="mb-4"
        />

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="flex justify-between">
          <Button onClick={() => navigate('/')}>ביטול</Button>
          <Button onClick={handleLogin}>כניסה</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-6">הגדרות מנהל מערכת</h2>

      <div className="mb-6">
        <h3 className="text-xl font-medium mb-3">הגדרות תיקיות ראשיות</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {rootFolders.map(folder => (
            <div
              key={folder.id}
              onClick={() => handleFolderSelect(folder)}
              className={`p-3 border rounded-md cursor-pointer ${selectedFolder?.id === folder.id ? 'border-blue-500 bg-blue-900/50' : 'border-gray-700'
                }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={folder.folderIcon || '/Folder.png'}
                  alt={folder.name}
                  className="w-10 h-10"
                />
                <span>{folder.name}</span>
              </div>
            </div>
          ))}
        </div>

        {selectedFolder && (
          <div className="bg-gray-900 p-4 rounded-lg">
            <h4 className="text-lg font-medium mb-4">הגדרות תיקייה: {selectedFolder.name}</h4>

            <div className="space-y-4">
              <div>
                <label className="block mb-1">שם התיקייה</label>
                <Input
                  name="name"
                  value={folderSettings.name}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block mb-1">נתיב לתמונת רקע</label>
                <Input
                  name="backgroundImage"
                  value={folderSettings.backgroundImage}
                  onChange={handleInputChange}
                  placeholder="/backgrounds/bg1.jpg"
                  className="w-full"
                />
                <p className="text-sm text-gray-400 mt-1">הזן את הנתיב לתמונת הרקע, לדוגמה: /backgrounds/bg1.jpg</p>
              </div>

              <div>
                <label className="block mb-1">נתיב לאייקון התיקייה</label>
                <Input
                  name="folderIcon"
                  value={folderSettings.folderIcon}
                  onChange={handleInputChange}
                  placeholder="/icons/folder1.png"
                  className="w-full"
                />
                <p className="text-sm text-gray-400 mt-1">הזן את הנתיב לאייקון התיקייה, לדוגמה: /icons/folder1.png</p>
              </div>

              <div className="flex justify-end mt-4">
                <Button onClick={handleSaveSettings}>שמור הגדרות</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <Button onClick={() => navigate('/')}>חזרה לדף הבית</Button>
      </div>
    </div>
  );
}