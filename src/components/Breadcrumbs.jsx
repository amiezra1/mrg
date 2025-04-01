import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { createPageUrl } from '../utils';
import { useFileManager } from '../context/FileManagerContext';

export default function Breadcrumbs({ currentFolderId }) {
  const { folders } = useFileManager();

  // מבנה הנתיבים - נחזיר את שרשרת התיקיות מהנוכחית ועד לראשית
  const buildBreadcrumbs = (folderId) => {
    const breadcrumbs = [];
    let currentId = folderId;

    // אם אין מזהה תיקייה, נחזיר רשימה ריקה
    if (!currentId) return breadcrumbs;

    // נחפש את התיקייה הנוכחית בכל התיקיות
    let currentFolder = null;

    // חיפוש בתיקיות הראשיות
    for (const folder of folders.root) {
      if (folder.id.toString() === currentId.toString()) {
        currentFolder = folder;
        break;
      }
    }

    // אם לא מצאנו בתיקיות הראשיות, נחפש בכל התיקיות
    if (!currentFolder) {
      for (const key in folders) {
        if (key !== 'root') {
          for (const folder of folders[key]) {
            if (folder.type === 'folder' && folder.id.toString() === currentId.toString()) {
              currentFolder = folder;
              break;
            }
          }
          if (currentFolder) break;
        }
      }
    }

    // אם מצאנו את התיקייה, נוסיף אותה לנתיבים
    if (currentFolder) {
      breadcrumbs.unshift({
        id: currentFolder.id,
        name: currentFolder.name
      });

      // אם יש הורה, נבנה את הנתיב אליו באופן רקורסיבי
      if (currentFolder.parentId) {
        const parentBreadcrumbs = buildBreadcrumbs(currentFolder.parentId);
        breadcrumbs.unshift(...parentBreadcrumbs);
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = buildBreadcrumbs(currentFolderId);

  return (
    <div className="breadcrumbs">
      <Link to="/" className="hover:text-white">
        דף הבית
      </Link>

      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.id}>
          <span className="breadcrumb-separator">
            <ChevronLeft className="icon" />
          </span>
          {index === breadcrumbs.length - 1 ? (
            <span className="breadcrumb-current">{crumb.name}</span>
          ) : (
            <Link
              to={createPageUrl(`Folder?id=${crumb.id}`)}
              className="hover:text-white"
            >
              {crumb.name}
            </Link>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
