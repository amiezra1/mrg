import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';

export default function FilePreview({ file, onClose }) {
  const [textContent, setTextContent] = useState('טוען...');

  // פונקציה לקבלת סוג הקובץ
  const getFileType = (fileName) => {
    if (!fileName) return 'unknown';

    const extension = fileName.split('.').pop().toLowerCase();

    // קטגוריות של סוגי קבצים
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const textTypes = ['txt', 'md', 'html', 'css', 'js', 'jsx', 'py', 'java', 'c', 'cpp'];
    const documentTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

    if (imageTypes.includes(extension)) return 'image';
    if (textTypes.includes(extension)) return 'text';
    if (documentTypes.includes(extension)) return 'document';
    return 'unknown';
  };

  // כאשר הקובץ משתנה, נטען את התוכן שלו
  useEffect(() => {
    if (file instanceof File && getFileType(file.name) === 'text') {
      const reader = new FileReader();
      reader.onload = (e) => setTextContent(e.target.result);
      reader.onerror = () => setTextContent('שגיאה בקריאת הקובץ');
      reader.readAsText(file);
    }
  }, [file]);

  // אם אין קובץ, לא מציגים כלום
  if (!file) return null;

  const renderPreview = () => {
    const fileType = getFileType(file.name);

    switch (fileType) {
      case 'image':
        // אם זה קובץ שהועלה דרך input[type="file"]
        if (file instanceof File) {
          const imageUrl = URL.createObjectURL(file);
          return (
            <img
              src={imageUrl}
              alt={file.name}
              className="max-w-full max-h-[70vh] object-contain"
              onLoad={() => URL.revokeObjectURL(imageUrl)}
            />
          );
        }
        // אם זה מידע על קובץ בלבד
        return <div className="text-center">תצוגה מקדימה לא זמינה</div>;

      case 'text':
        if (file instanceof File) {
          return (
            <pre className="bg-gray-800 p-4 rounded-md max-h-[70vh] overflow-auto text-left">
              {textContent}
            </pre>
          );
        }
        return <div className="text-center">תצוגה מקדימה לא זמינה</div>;

      case 'document':
        return (
          <div className="text-center p-8">
            <div className="text-6xl mb-4">📄</div>
            <p>לא ניתן להציג תצוגה מקדימה לקובץ מסוג זה.</p>
            {file instanceof File && (
              <Button
                className="mt-4"
                onClick={() => {
                  const url = URL.createObjectURL(file);
                  window.open(url, '_blank');
                  setTimeout(() => URL.revokeObjectURL(url), 100);
                }}
              >
                הורד או פתח את הקובץ
              </Button>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center p-8">
            <div className="text-6xl mb-4">❓</div>
            <p>אין תצוגה מקדימה זמינה לסוג קובץ זה.</p>
          </div>
        );
    }
  };

  return (
    <div className="file-preview">
      <div className="preview-content">
        <div className="dialog-header">
          <h3 className="dialog-title">{file.name}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-full h-8 w-8 p-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="border border-gray-700 rounded-lg overflow-hidden mt-4">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
}