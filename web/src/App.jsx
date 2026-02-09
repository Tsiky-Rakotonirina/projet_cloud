import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '@context/AuthContext';
import { SyncProgressProvider } from '@context/SyncProgressContext';
import SyncProgressBar from '@components/SyncProgressBar';
import AppRoutes from '@routes';

function App() {
  
  return (
    <AuthProvider>
      <SyncProgressProvider>
        <Router>
          {/* Barre de progression globale - visible sur toutes les pages */}
          <SyncProgressBar />
          <AppRoutes />
        </Router>
      </SyncProgressProvider>
    </AuthProvider>
  );
}

export default App;