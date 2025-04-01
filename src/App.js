// App.js - קובץ מלא ומתוקן
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import FolderPage from './pages/Folder';
import AdminSettings from './pages/AdminSettings';
import { FileManagerProvider } from './context/FileManagerContext';

function App() {
  return (
    <Router>
      <FileManagerProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/Folder" element={<FolderPage />} />
            <Route path="/admin" element={<AdminSettings />} />
          </Routes>
        </Layout>
      </FileManagerProvider>
    </Router>
  );
}

export default App;