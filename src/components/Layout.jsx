import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useFileManager } from '../context/FileManagerContext';
import AdminStatus from '../components/AdminStatus';

export default function Layout({ children }) {
  const location = useLocation();
  const { getFolderInfo } = useFileManager();
  const [currentBackground, setCurrentBackground] = useState('/background.png');

  // עדכון תמונת הרקע בהתאם לתיקייה הנוכחית
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(location.search);
      const folderId = urlParams.get('id');

      if (folderId && getFolderInfo) {
        const info = getFolderInfo(folderId);
        setCurrentBackground(info.backgroundImage || '/background.png');
      } else {
        setCurrentBackground('/background.png');
      }
    } catch (error) {
      console.error('Error updating background:', error);
      setCurrentBackground('/background.png');
    }
  }, [location, getFolderInfo]);

  return (
    <div className="min-h-screen relative">
      {/* רקע דינמי עם הצללה */}
      <div
        className="fixed inset-0 z-0 transition-all duration-500"
        style={{
          backgroundImage: `url('${currentBackground}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* תצוגת סטטוס מנהל מערכת */}
      <AdminStatus />

      {/* כותרת */}
      <header className="relative z-10 pt-8 pb-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">

            {/* כותרת ולוגו */}
            <div className="flex items-center">
              <h1 className="text-5xl font-bold text-right">
                אתר מרכז גיוס <br />פיקוד דרום
                <img src="/l_masha.png" alt="לוגו מרכז גיוס" className="inline-block mr-2 h-12" />
              </h1>
            </div>

            {/* לוגואים של יחידות */}
            <div className="flex items-center gap-3">
              <img src="/80.png" alt="יחידה" className="h-[50px]" />
              <img src="/162.png" alt="יחידה" className="h-[50px]" />
              <img src="/143.png" alt="יחידה" className="h-[50px]" />
              <img src="/252.png" alt="יחידה" className="h-[50px]" />
              <img src="/65.png" alt="יחידה" className="h-[50px]" />
            </div>


          </div>
        </div>

        {/* פס לבן מפריד */}
        <div className="h-[10px] bg-white mt-4" />
      </header>

      {/* תוכן ראשי */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        {children}
      </main>

      {/* פוטר עם לינק למנהל */}
      <footer className="relative z-10 container mx-auto px-4 py-4 mt-8">
        <div className="flex justify-center">
          <Link
            to="/admin"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            הגדרות מנהל מערכת
          </Link>
        </div>
      </footer>
    </div>
  );
}