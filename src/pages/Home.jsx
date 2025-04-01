import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useFileManager } from '../context/FileManagerContext';

// מידע על האייקונים לכל תיקייה
const folderIcons = {
  'folder-1': '/Folder.png',
  'folder-2': '/Folder.png',
  'folder-3': '/Folder.png',
  'folder-4': '/Folder.png',
  'folder-5': '/Folder.png',
  'folder-6': '/Folder.png',
  'folder-7': '/Folder.png',
  'folder-8': '/Folder.png',
  'folder-9': '/Folder.png'
};

export default function Home() {
  const { getRootFolders } = useFileManager();
  const mainFolders = getRootFolders();

  const getFolderIcon = (folderId) => {
    // מנסה להוציא מספר תיקייה
    const folderNum = String(folderId).match(/\d+/);
    if (folderNum) {
      const iconPath = folderIcons[`folder-${folderNum[0]}`];
      return iconPath || "/Folder.png";
    }
    return "/Folder.png";
  };

  return (
    <div>
      {/* <h2 className="text-2xl font-bold mb-6">תיקיות ראשיות</h2> */}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {mainFolders.map((folder) => {
          // קבלת האייקון המתאים
          const folderIcon = getFolderIcon(folder.id);

          return (
            <Link
              key={folder.id}
              to={createPageUrl(`Folder?id=${folder.id}`)}
              className="flex flex-col items-center p-4 rounded-lg hover:bg-white/10 transition-colors"
            >
              <img
                src={folderIcon}
                alt="תיקייה"
                className="w-24 h-24 mb-3"
              />
              <span className="text-lg font-medium text-center">{folder.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}