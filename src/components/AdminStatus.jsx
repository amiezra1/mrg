import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { permissionsService } from '../services/permissions';
import { Button } from './ui/button';
import { ShieldCheck, LogOut } from 'lucide-react';

export default function AdminStatus() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  // בדיקת מצב אדמין בטעינת הקומפוננטה
  useEffect(() => {
    // קביעת סטייט ראשוני
    setIsAdmin(permissionsService.isAdminLoggedIn());

    // הגדרת מאזין לשינויים ב-localStorage
    const handleStorageChange = () => {
      setIsAdmin(permissionsService.isAdminLoggedIn());
    };

    // האזנה לשינויים ב-localStorage (יכול לקרות מחלונות אחרים)
    window.addEventListener('storage', handleStorageChange);

    // הוספת אינטרוול לבדיקת מצב אדמין כל 2 שניות
    const checkInterval = setInterval(() => {
      setIsAdmin(permissionsService.isAdminLoggedIn());
    }, 2000);

    // ניקוי האזנה ואינטרוול בעת סגירת הקומפוננטה
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkInterval);
    };
  }, []);

  // פונקציה להתנתקות מהרשאות מנהל
  const handleLogout = () => {
    permissionsService.setAdminLoggedIn(false);
    setIsAdmin(false);
  };

  // ניווט לדף הגדרות אדמין
  const goToAdminSettings = () => {
    navigate('/admin');
  };

  // אם לא מחובר כמנהל, לא מציגים כלום
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 bg-gray-900/80 p-2 rounded-md shadow-lg z-50 flex items-center">
      <ShieldCheck className="text-green-500 mr-2" size={20} />
      <span className="text-green-500 mr-2">מחובר כמנהל</span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={goToAdminSettings}
          className="text-xs"
        >
          הגדרות
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="text-xs"
        >
          <LogOut size={14} className="mr-1" />
          התנתק
        </Button>
      </div>
    </div>
  );
}