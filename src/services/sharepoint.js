// sharepoint.js - קובץ מעודכן עם תמיכה בתיקיות בעברית
import axios from 'axios';

// קבועים עבור SharePoint
const SITE_URL = window._spPageContextInfo ? window._spPageContextInfo.webAbsoluteUrl : 'https://hitacil.sharepoint.com/sites/marag_t';
// הנתיב המדויק לתיקיית data
const DATA_FOLDER_PATH = '/sites/marag_t/Shared Documents/data';

// פונקציית עזר לקבלת נתיב API
const getApiPath = (endpoint) => {
  return `${SITE_URL}/_api/${endpoint}`;
};

export class SharePointService {
  constructor() {
    // בדיקה אם אנחנו בסביבת SharePoint
    this.isInSharePoint = !!window._spPageContextInfo;

    if (!this.isInSharePoint) {
      console.warn('SharePoint context not detected. Using fallback mode.');
    } else {
      console.log('SharePoint context detected. Using SharePoint API.');
    }
  }

  // פונקציה להבאת רשימת התיקיות הראשיות מתיקיית data
  async getRootFolders() {
    try {
      console.log(`Fetching root folders from ${DATA_FOLDER_PATH}...`);

      // בקשת API כדי לקבל את כל התיקיות בתיקיית data
      const response = await axios.get(
        getApiPath(`web/GetFolderByServerRelativeUrl('${DATA_FOLDER_PATH}')/Folders`),
        {
          headers: {
            'Accept': 'application/json;odata=verbose'
          }
        }
      );

      console.log('SharePoint API response:', response);

      // מיפוי התיקיות למבנה המתאים
      let rootFolders = response.data.d.results
        .filter(folder => !folder.Name.startsWith('_') && !folder.Name.startsWith('.'))
        .map((folder, index) => {
          console.log(`Processing folder: ${folder.Name}, URL: ${folder.ServerRelativeUrl}`);
          return {
            id: folder.ServerRelativeUrl,
            name: folder.Name,  // שימוש בשם המקורי של התיקייה
            type: 'folder',
            parentId: null,
            serverRelativeUrl: folder.ServerRelativeUrl,
            folderIcon: '/Folder.png',
            backgroundImage: '/background.png'
          };
        });

      console.log(`Found ${rootFolders.length} folders in SharePoint data folder:`, rootFolders);

      // אם צריך להשלים ל-9 תיקיות
      if (rootFolders.length < 9) {
        const numberOfExistingFolders = rootFolders.length;
        const additionalFolders = Array.from({ length: 9 - numberOfExistingFolders }, (_, i) => ({
          id: `${DATA_FOLDER_PATH}/folder-${i + numberOfExistingFolders + 1}`,
          name: `תיקייה ראשית ${i + numberOfExistingFolders + 1}`,
          type: 'folder',
          parentId: null,
          serverRelativeUrl: `${DATA_FOLDER_PATH}/folder-${i + numberOfExistingFolders + 1}`,
          folderIcon: '/Folder.png',
          backgroundImage: '/background.png',
          isVirtual: true // סימון שזו תיקייה וירטואלית שלא קיימת בפועל
        }));

        console.log(`Adding ${additionalFolders.length} virtual folders to reach 9 total`);
        rootFolders = [...rootFolders, ...additionalFolders];
      }

      // מגביל למקסימום 9 תיקיות
      rootFolders = rootFolders.slice(0, 9);

      console.log('Final root folders list:', rootFolders);
      return rootFolders;
    } catch (error) {
      console.error('Error fetching root folders:', error);

      // במקרה של שגיאה, מחזיר תיקיות ברירת מחדל
      const defaultFolders = Array.from({ length: 9 }, (_, i) => ({
        id: `${DATA_FOLDER_PATH}/folder-${i + 1}`,
        name: `תיקייה ראשית ${i + 1}`,
        type: 'folder',
        parentId: null,
        serverRelativeUrl: `${DATA_FOLDER_PATH}/folder-${i + 1}`,
        folderIcon: '/Folder.png',
        backgroundImage: '/background.png',
        isVirtual: true
      }));

      console.log('Returning default folders due to error');
      return defaultFolders;
    }
  }

  // פונקציה להבאת תכולת תיקייה
  async getFolderContents(folderPath) {
    try {
      console.log(`Fetching contents of folder: ${folderPath}`);

      // בדיקה אם זו תיקייה וירטואלית
      if (folderPath && folderPath.isVirtual) {
        console.log('This is a virtual folder, returning empty contents');
        return [];
      }

      // קבלת תיקיות בתוך התיקייה הנוכחית
      const foldersResponse = await axios.get(
        getApiPath(`web/GetFolderByServerRelativeUrl('${folderPath}')/Folders`),
        {
          headers: {
            'Accept': 'application/json;odata=verbose'
          }
        }
      );

      // קבלת קבצים בתוך התיקייה הנוכחית
      const filesResponse = await axios.get(
        getApiPath(`web/GetFolderByServerRelativeUrl('${folderPath}')/Files`),
        {
          headers: {
            'Accept': 'application/json;odata=verbose'
          }
        }
      );

      // מיפוי תיקיות למבנה שהאפליקציה מצפה לו
      const folders = foldersResponse.data.d.results
        .filter(folder => !folder.Name.startsWith('_') && !folder.Name.startsWith('.'))
        .map(folder => ({
          id: folder.ServerRelativeUrl,
          name: folder.Name,
          type: 'folder',
          parentId: folderPath,
          serverRelativeUrl: folder.ServerRelativeUrl,
          createdAt: new Date(folder.TimeCreated).getTime()
        }));

      // מיפוי קבצים למבנה שהאפליקציה מצפה לו
      const files = filesResponse.data.d.results.map(file => ({
        id: file.ServerRelativeUrl,
        name: file.Name,
        type: 'file',
        size: this.formatFileSize(file.Length),
        parentId: folderPath,
        serverRelativeUrl: file.ServerRelativeUrl,
        createdAt: new Date(file.TimeCreated).getTime()
      }));

      // מיזוג תיקיות וקבצים לרשימה אחת
      const contents = [...folders, ...files];
      console.log(`Found ${contents.length} items in folder ${folderPath}:`, contents);
      return contents;
    } catch (error) {
      console.error(`Error fetching contents for folder ${folderPath}:`, error);
      return [];
    }
  }

  // יצירת תיקייה חדשה
  async createFolder(parentPath, folderName) {
    try {
      // בדיקה אם זו תיקייה וירטואלית
      if (parentPath && typeof parentPath === 'object' && parentPath.isVirtual) {
        console.log('Cannot create folder inside a virtual folder');
        throw new Error('Cannot create folder inside a virtual folder');
      }

      console.log(`Creating folder ${folderName} in ${parentPath}`);

      // קבלת digest value (נדרש לפעולות POST)
      const digestResponse = await axios.post(
        getApiPath('contextinfo'),
        {},
        {
          headers: {
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose'
          }
        }
      );

      const formDigestValue = digestResponse.data.d.GetContextWebInformation.FormDigestValue;

      // יצירת תיקייה חדשה
      const response = await axios.post(
        getApiPath('web/folders'),
        {
          '__metadata': { 'type': 'SP.Folder' },
          'ServerRelativeUrl': `${parentPath}/${folderName}`
        },
        {
          headers: {
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': formDigestValue
          }
        }
      );

      console.log(`Folder created: ${response.data.d.ServerRelativeUrl}`);
      return response.data.d.ServerRelativeUrl;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  // העלאת קובץ
  async uploadFile(folderPath, file) {
    try {
      // בדיקה אם זו תיקייה וירטואלית
      if (folderPath && typeof folderPath === 'object' && folderPath.isVirtual) {
        console.log('Cannot upload to a virtual folder');
        throw new Error('Cannot upload to a virtual folder');
      }

      console.log(`Uploading file ${file.name} to ${folderPath}`);

      // קבלת digest value
      const digestResponse = await axios.post(
        getApiPath('contextinfo'),
        {},
        {
          headers: {
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose'
          }
        }
      );

      const formDigestValue = digestResponse.data.d.GetContextWebInformation.FormDigestValue;

      // קריאת הקובץ כ-ArrayBuffer
      const fileData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });

      // העלאת הקובץ לשרת
      const response = await axios.post(
        getApiPath(`web/GetFolderByServerRelativeUrl('${folderPath}')/Files/add(url='${file.name}',overwrite=true)`),
        fileData,
        {
          headers: {
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/octet-stream',
            'X-RequestDigest': formDigestValue
          }
        }
      );

      console.log(`File uploaded: ${response.data.d.ServerRelativeUrl}`);
      return {
        id: response.data.d.ServerRelativeUrl,
        name: file.name,
        type: 'file',
        size: this.formatFileSize(file.size),
        parentId: folderPath,
        serverRelativeUrl: response.data.d.ServerRelativeUrl,
        createdAt: Date.now()
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // מחיקת פריט (תיקייה או קובץ)
  async deleteItem(itemPath, itemType) {
    try {
      // בדיקה אם זה פריט וירטואלי
      if (itemPath && typeof itemPath === 'object' && itemPath.isVirtual) {
        console.log('Cannot delete a virtual item');
        throw new Error('Cannot delete a virtual item');
      }

      console.log(`Deleting ${itemType} at ${itemPath}`);

      // קבלת digest value
      const digestResponse = await axios.post(
        getApiPath('contextinfo'),
        {},
        {
          headers: {
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose'
          }
        }
      );

      const formDigestValue = digestResponse.data.d.GetContextWebInformation.FormDigestValue;

      // קביעת נתיב API בהתאם לסוג הפריט
      const apiEndpoint = itemType === 'folder'
        ? getApiPath(`web/GetFolderByServerRelativeUrl('${itemPath}')/recycle`)
        : getApiPath(`web/GetFileByServerRelativeUrl('${itemPath}')/recycle`);

      // מחיקת הפריט (העברה לסל המחזור)
      await axios.post(
        apiEndpoint,
        {},
        {
          headers: {
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': formDigestValue
          }
        }
      );

      console.log(`Item deleted (recycled): ${itemPath}`);
      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }

  // שינוי שם של פריט
  async renameItem(itemPath, newName) {
    try {
      // בדיקה אם זה פריט וירטואלי
      if (itemPath && typeof itemPath === 'object' && itemPath.isVirtual) {
        console.log('Cannot rename a virtual item');
        throw new Error('Cannot rename a virtual item');
      }

      console.log(`Renaming item at ${itemPath} to ${newName}`);

      // קבלת digest value
      const digestResponse = await axios.post(
        getApiPath('contextinfo'),
        {},
        {
          headers: {
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose'
          }
        }
      );

      const formDigestValue = digestResponse.data.d.GetContextWebInformation.FormDigestValue;

      // חילוץ נתיב ההורה והשם הנוכחי
      const pathParts = itemPath.split('/');
      const oldName = pathParts.pop();
      const parentPath = pathParts.join('/');

      // קביעה אם מדובר בתיקייה או קובץ
      const isFolder = !oldName.includes('.');
      const apiEndpoint = isFolder
        ? getApiPath(`web/GetFolderByServerRelativeUrl('${itemPath}')/moveto(newurl='${parentPath}/${newName}')`)
        : getApiPath(`web/GetFileByServerRelativeUrl('${itemPath}')/moveto(newurl='${parentPath}/${newName}',flags=1)`);

      // שינוי שם הפריט
      await axios.post(
        apiEndpoint,
        {},
        {
          headers: {
            'Accept': 'application/json;odata=verbose',
            'X-RequestDigest': formDigestValue
          }
        }
      );

      console.log(`Item renamed: ${itemPath} -> ${newName}`);
      return true;
    } catch (error) {
      console.error('Error renaming item:', error);
      throw error;
    }
  }

  // פונקציית עזר לפורמט גודל קובץ
  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }
}

// יצירת מופע יחיד של השירות
export const sharePointService = new SharePointService();
