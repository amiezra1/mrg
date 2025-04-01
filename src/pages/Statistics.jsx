// src/pages/Statistics.jsx
import React, { useState, useEffect } from 'react';
import { sharePointService } from '../services/sharepoint';
import { Chart } from 'react-chartjs-2';

export default function Statistics() {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStatistics = async () => {
      setLoading(true);
      try {
        // כאן תוכל להוסיף קריאות API לקבלת נתונים סטטיסטיים
        // לדוגמה - כמות קבצים לפי תיקייה, סוגי קבצים, וכדומה

        const rootFolders = await sharePointService.getRootFolders();
        const folderStats = [];

        for (const folder of rootFolders) {
          const contents = await sharePointService.getFolderContents(folder.id);
          const fileCount = contents.filter(item => item.type === 'file').length;
          const folderCount = contents.filter(item => item.type === 'folder').length;

          folderStats.push({
            name: folder.name,
            files: fileCount,
            folders: folderCount
          });
        }

        setStatsData({
          folderStats,
          // נתונים נוספים...
        });
      } catch (error) {
        console.error('Error loading statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, []);

  if (loading) {
    return <div>טוען נתונים...</div>;
  }

  return (
    <div className="statistics-page">
      <h1 className="text-2xl font-bold mb-6">סטטיסטיקות מערכת</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-black/20 p-4 rounded-lg">
          <h2 className="text-xl mb-4">קבצים לפי תיקייה</h2>
          <div className="h-64">
            <Chart
              type="bar"
              data={{
                labels: statsData.folderStats.map(stat => stat.name),
                datasets: [
                  {
                    label: 'קבצים',
                    data: statsData.folderStats.map(stat => stat.files),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)'
                  },
                  {
                    label: 'תיקיות',
                    data: statsData.folderStats.map(stat => stat.folders),
                    backgroundColor: 'rgba(255, 206, 86, 0.5)'
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false
              }}
            />
          </div>
        </div>

        {/* גרפים נוספים... */}
      </div>
    </div>
  );
}