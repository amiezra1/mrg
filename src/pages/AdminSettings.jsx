// src/pages/AdminSettings.jsx - עודכן לתמיכה בהתחברות עם שם משתמש
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useFileManager } from '../context/FileManagerContext';
import { permissionsService } from '../services/permissions';

export default function AdminSettings() {
  const navigate = useNavigate();
  const { getRootFolders } = useFileManager();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rootFolders, setRootFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderSettings, setFolderSettings] = useState({
    name: '',
    backgroundImage: '',
    folderIcon: ''
  });
  const [currentUser, setCurrentUser] = useState(null);

  // בדיקה אם כבר מחובר בעת טעינת הדף
  useEffect(() => {
    const adminLoggedIn = permissionsService.isAdminLoggedIn();
    const user = permissionsService.getCurrentUser();

    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
    } else if (adminLoggedIn) {
      // לצורך תאימות עם הקוד הקיים
      setIsLoggedIn(true);
    }
  }, []);

  // טעינת התיקיות הראשיות
  useEffect(() => {
    if (isLoggedIn) {
      const folders = getRootFolders();
      setRootFolders(folders);
    }
  }, [isLoggedIn, getRootFolders]);

  const handleLogin = () => {
    // נקה שגיאות קודמות
    setError('');

    if (!username.trim()) {
      setError('נא להזין שם משתמש');
      return;
    }

    if (!password.trim()) {
      setError('נא להזין סיסמה');
      return;
    }

    // נסה להתחבר באמצעות שירות ההרשאות
    const loginSuccess = permissionsService.login(username, password);

    if (loginSuccess) {
      setIsLoggedIn(true);
      const user = permissionsService.getCurrentUser();
      setCurrentUser(user);
      console.log('User logged in successfully:', user);
    } else {
      setError('שם משתמש או סיסמה שגויים');
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
    // בפרויקט אמיתי, תרצה לעדכן את הנתונים באחסון או ב-SharePoint
    alert(`הגדרות נשמרו עבור ${folderSettings.name}`);

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
  };

  // פונקציה להתנתקות
  const handleLogout = () => {
    // התנתקות דרך שירות ההרשאות
    permissionsService.logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
    navigate('/');
  };

  // פונקציה לחזרה לדף הבית בלי התנתקות
  const handleStayLoggedIn = () => {
    navigate('/');
  };

  if (!isLoggedIn) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg max-w-md mx-auto mt-8">
        <h2 className="text-2xl font-bold mb-6">כניסה למערכת</h2>
        <p className="mb-4">יש להזין את פרטי המשתמש שלך</p>

        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="block mb-1">שם משתמש</label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="שם משתמש"
              className="text-black"
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-1">סיסמה</label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="סיסמה"
              className="text-black"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLogin();
                }
              }}
            />
          </div>

          {error && <p className="text-red-500">{error}</p>}

          <div className="flex justify-between pt-2">
            <Button onClick={() => navigate('/')}>ביטול</Button>
            <Button onClick={handleLogin}>כניסה</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">הגדרות מנהל מערכת</h2>

        {currentUser && (
          <div className="bg-gray-700 p-2 rounded-md">
            <span className="text-sm text-gray-300">מחובר כ: </span>
            <span className="text-white font-bold">{currentUser.displayName || currentUser.username}</span>
            <span className="text-xs text-green-500 ml-2">({currentUser.role})</span>
          </div>
        )}
      </div>

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
                  className="w-full text-black"
                />
              </div>

              <div>
                <label className="block mb-1">נתיב לתמונת רקע</label>
                <Input
                  name="backgroundImage"
                  value={folderSettings.backgroundImage}
                  onChange={handleInputChange}
                  placeholder="/backgrounds/bg1.jpg"
                  className="w-full text-black"
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
                  className="w-full text-black"
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
        <div>
          <Button onClick={handleLogout} className="mr-2">התנתק וחזור לדף הבית</Button>
          <Button onClick={handleStayLoggedIn} variant="outline">חזרה לדף הבית (נשאר מחובר)</Button>
        </div>
        <p className="text-green-500">הרשאות מלאות זמינות</p>
      </div>
    </div>
  );
}