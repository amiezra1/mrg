// src/services/permissions.js
// רמות הרשאה אפשריות
export const PERMISSION_LEVELS = {
  VIEWER: 'viewer',         // צפייה והורדה בלבד
  CONTRIBUTOR: 'contributor', // הוספה ומחיקה של תיקיות וקבצים (ללא תיקיות ראשיות)
  ADMIN: 'admin'            // הרשאות מלאות כולל עריכת תיקיות ראשיות
};

// מפתחות ל-LocalStorage
const STORAGE_KEYS = {
  ADMIN_LOGIN: 'filemanager_admin_login',
  PERMISSION_LEVEL: 'filemanager_permission_level',
  CURRENT_USER: 'filemanager_current_user'
};

// JSON של משתמשים לדוגמה - במערכת אמיתית יש להחליף בקריאת קובץ או API
const USERS_DATA = {
  "users": [
    {
      "username": "admin",
      "password": "admin123",
      "displayName": "מנהל מערכת",
      "role": "admin",
      "permissions": ["view", "add", "delete", "editRoot"]
    },
    {
      "username": "contributor",
      "password": "cont123",
      "displayName": "משתמש תורם",
      "role": "contributor",
      "permissions": ["view", "add", "delete"]
    },
    {
      "username": "viewer",
      "password": "view123",
      "displayName": "משתמש צופה",
      "role": "viewer",
      "permissions": ["view"]
    }
  ],
  "sharePointMapping": {
    "owners": "admin",
    "מנהלי מערכת": "admin",
    "contributors": "contributor",
    "תורמים": "contributor",
    "members": "contributor",
    "viewers": "viewer",
    "צופים": "viewer"
  }
};

// פונקציה למציאת משתמש לפי שם משתמש וסיסמה
const findUser = (username, password) => {
  return USERS_DATA.users.find(user =>
    user.username === username && user.password === password
  );
};

// פונקציה לקבלת הרשאות המשתמש מ-SharePoint
const fetchUserPermissions = async () => {
  try {
    // בדיקה אם יש כבר הרשאות שנשמרו בלוקל סטורג׳
    const savedPermission = localStorage.getItem(STORAGE_KEYS.PERMISSION_LEVEL);
    if (savedPermission) {
      console.log('Permissions loaded from localStorage:', savedPermission);
      return savedPermission;
    }

    // נסיון לבדוק אם אנחנו בסביבת SharePoint
    if (!window._spPageContextInfo) {
      console.log('Not in SharePoint environment, using default viewer permissions');
      return PERMISSION_LEVELS.VIEWER;
    }

    // קריאה לקבלת קבוצות המשתמש הנוכחי
    const response = await fetch(`${window._spPageContextInfo.webAbsoluteUrl}/_api/web/currentuser/groups`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json;odata=verbose'
      }
    });

    const data = await response.json();
    const userGroups = data.d.results.map(group => group.Title.toLowerCase());

    // קבלת שם המשתמש ב-SharePoint
    const spUsername = window._spPageContextInfo.userDisplayName;

    let permissionLevel;
    // בדיקת הרשאות על סמך הקבוצות
    for (const group of userGroups) {
      const mappedRole = USERS_DATA.sharePointMapping[group];
      if (mappedRole === 'admin') {
        permissionLevel = PERMISSION_LEVELS.ADMIN;
        break;
      } else if (mappedRole === 'contributor') {
        permissionLevel = PERMISSION_LEVELS.CONTRIBUTOR;
      }
    }

    // אם לא מצאנו תפקיד מתאים, נגדיר כצופה
    if (!permissionLevel) {
      permissionLevel = PERMISSION_LEVELS.VIEWER;
    }

    // שמירה בלוקל סטורג׳
    localStorage.setItem(STORAGE_KEYS.PERMISSION_LEVEL, permissionLevel);

    return permissionLevel;
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    // אם משהו משתבש, נחזיר רמת צפייה בלבד כדי להיות בטוחים
    return PERMISSION_LEVELS.VIEWER;
  }
};

class PermissionsService {
  constructor() {
    this._permissionLevel = null;
    this._permissionPromise = null;
    this._currentUser = null;
    this._isAdminLoggedIn = false;

    // בדיקה אם יש משתמש מחובר שמור
    try {
      const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (savedUser) {
        this._currentUser = JSON.parse(savedUser);

        if (this._currentUser && this._currentUser.role === 'admin') {
          this._isAdminLoggedIn = true;
        }

        console.log('User login state restored from localStorage', this._currentUser);
      }

      // בדיקה אם מנהל מחובר בנפרד (לתאימות לאחור)
      const isAdminLoggedIn = localStorage.getItem(STORAGE_KEYS.ADMIN_LOGIN) === 'true';
      if (isAdminLoggedIn) {
        this._isAdminLoggedIn = true;
        console.log('Admin login restored from localStorage');
      }
    } catch (e) {
      console.error('Error initializing permissions service:', e);
      this._isAdminLoggedIn = false;
      this._currentUser = null;
    }
  }

  // התחברות לפי שם משתמש וסיסמה
  login(username, password) {
    const user = findUser(username, password);

    if (user) {
      this._currentUser = user;
      this._permissionLevel = user.role;

      // שמירה בלוקל סטורג׳
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.PERMISSION_LEVEL, user.role);

      // אם המשתמש הוא מנהל, נגדיר גם את הרשאות האדמין
      if (user.role === 'admin') {
        this._isAdminLoggedIn = true;
        localStorage.setItem(STORAGE_KEYS.ADMIN_LOGIN, 'true');
      }

      console.log('User logged in successfully', user);
      return true;
    }

    return false;
  }

  // התנתקות
  logout() {
    this._currentUser = null;
    this._permissionLevel = null;
    this._isAdminLoggedIn = false;

    // ניקוי localStorage
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.PERMISSION_LEVEL);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_LOGIN);

    console.log('User logged out');
  }

  // קבלת המשתמש הנוכחי
  getCurrentUser() {
    return this._currentUser;
  }

  // פונקציה להגדרת התחברות מנהל באופן ישיר (לתאימות עם הקוד הקיים)
  setAdminLoggedIn(status) {
    this._isAdminLoggedIn = status;

    // שמירת המצב בלוקל סטורג׳
    if (status) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_LOGIN, 'true');

      // אם אין משתמש נוכחי, נגדיר משתמש ברירת מחדל של אדמין
      if (!this._currentUser) {
        const adminUser = USERS_DATA.users.find(user => user.role === 'admin');
        if (adminUser) {
          this._currentUser = adminUser;
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(adminUser));
        }
      }

      console.log('Admin login saved to localStorage');
    } else {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_LOGIN);

      // אם מנתקים את האדמין, נשאיר את המשתמש אבל נעדכן שאינו יותר מנהל
      if (this._currentUser && this._currentUser.role === 'admin') {
        this.logout();
      }

      console.log('Admin login removed from localStorage');
    }

    // מאפס את הרמה האוטומטית כדי לאפשר קבלה חדשה בפעם הבאה
    if (!status) {
      this._permissionLevel = null;
    }
  }

  // בדיקה אם מנהל מחובר
  isAdminLoggedIn() {
    return this._isAdminLoggedIn;
  }

  // קבלת רמת ההרשאה של המשתמש הנוכחי
  async getUserPermissionLevel() {
    // אם מנהל מחובר, תמיד תחזיר הרשאות מנהל
    if (this._isAdminLoggedIn) {
      return PERMISSION_LEVELS.ADMIN;
    }

    // אם יש משתמש מחובר, החזר את רמת ההרשאה שלו
    if (this._currentUser) {
      return this._currentUser.role;
    }

    // אם יש כבר רמת הרשאה שנקבעה, החזר אותה
    if (this._permissionLevel) {
      return this._permissionLevel;
    }

    // אם כבר יש בקשה בהמתנה, נחזיר אותה
    if (!this._permissionPromise) {
      this._permissionPromise = fetchUserPermissions().then(level => {
        this._permissionLevel = level;
        this._permissionPromise = null;
        return level;
      });
    }

    return this._permissionPromise;
  }

  // בדיקה אם למשתמש יש הרשאה לצפייה בקבצים
  async canViewFiles() {
    // מנהל מחובר יכול לצפות
    if (this._isAdminLoggedIn) {
      return true;
    }

    // אם יש משתמש מחובר, בדוק את ההרשאות שלו
    if (this._currentUser) {
      return this._currentUser.permissions.includes('view');
    }

    const level = await this.getUserPermissionLevel();
    return true; // כל הרמות יכולות לצפות
  }

  // בדיקה אם למשתמש יש הרשאה להוסיף קבצים או תיקיות
  async canAddItems() {
    // מנהל מחובר יכול להוסיף
    if (this._isAdminLoggedIn) {
      return true;
    }

    // אם יש משתמש מחובר, בדוק את ההרשאות שלו
    if (this._currentUser) {
      return this._currentUser.permissions.includes('add');
    }

    const level = await this.getUserPermissionLevel();
    return level === PERMISSION_LEVELS.CONTRIBUTOR || level === PERMISSION_LEVELS.ADMIN;
  }

  // בדיקה אם למשתמש יש הרשאה למחוק קבצים או תיקיות
  async canDeleteItems() {
    // מנהל מחובר יכול למחוק
    if (this._isAdminLoggedIn) {
      return true;
    }

    // אם יש משתמש מחובר, בדוק את ההרשאות שלו
    if (this._currentUser) {
      return this._currentUser.permissions.includes('delete');
    }

    const level = await this.getUserPermissionLevel();
    return level === PERMISSION_LEVELS.CONTRIBUTOR || level === PERMISSION_LEVELS.ADMIN;
  }

  // בדיקה אם למשתמש יש הרשאה לערוך תיקיות ראשיות
  async canEditRootFolders() {
    // מנהל מחובר יכול לערוך תיקיות ראשיות
    if (this._isAdminLoggedIn) {
      return true;
    }

    // אם יש משתמש מחובר, בדוק את ההרשאות שלו
    if (this._currentUser) {
      return this._currentUser.permissions.includes('editRoot');
    }

    const level = await this.getUserPermissionLevel();
    return level === PERMISSION_LEVELS.ADMIN;
  }

  // בדיקה אם קובץ/תיקייה היא תיקייה ראשית
  isRootFolder(itemPath) {
    if (!itemPath) return false;

    // הנחה: תיקיות ראשיות הן אלה שנמצאות ישירות תחת התיקייה הראשית
    const pathParts = itemPath.split('/').filter(Boolean);
    return pathParts.length === 1;
  }

  // בדיקה אם למשתמש יש הרשאה למחוק פריט ספציפי
  async canDeleteSpecificItem(itemPath) {
    // מנהל מחובר יכול למחוק כל פריט
    if (this._isAdminLoggedIn) {
      return true;
    }

    const isRoot = this.isRootFolder(itemPath);

    if (isRoot) {
      return await this.canEditRootFolders();
    } else {
      return await this.canDeleteItems();
    }
  }

  // בדיקה אם למשתמש יש הרשאה לשנות שם של פריט ספציפי
  async canRenameSpecificItem(itemPath) {
    // מנהל מחובר יכול לשנות שם לכל פריט
    if (this._isAdminLoggedIn) {
      return true;
    }

    const isRoot = this.isRootFolder(itemPath);

    if (isRoot) {
      return await this.canEditRootFolders();
    } else {
      return await this.canDeleteItems(); // אותה רמת הרשאה כמו מחיקה
    }
  }

  // פונקציה כללית לבדיקת הרשאה
  async checkPermission(permission) {
    // מנהל מחובר תמיד מקבל אישור
    if (this._isAdminLoggedIn) {
      return true;
    }

    // אם יש משתמש מחובר, בדוק את ההרשאות שלו ישירות
    if (this._currentUser) {
      return this._currentUser.permissions.includes(permission);
    }

    switch (permission) {
      case 'view':
        return await this.canViewFiles();
      case 'add':
        return await this.canAddItems();
      case 'delete':
        return await this.canDeleteItems();
      case 'editRoot':
        return await this.canEditRootFolders();
      default:
        return false;
    }
  }
}

// יצירת מופע יחיד של שירות ההרשאות
export const permissionsService = new PermissionsService();