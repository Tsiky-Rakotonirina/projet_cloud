import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';

import Login from '@pages/manager/Login';
import Synchronisation from '@pages/manager/Synchronisation';
import GestionUtilisateur from '@pages/manager/GestionUtilisateur';
import GestionSignalement from '@pages/manager/GestionSignalement';
import CarteWrapper from '@pages/manager/CarteWrapper';

/**
 * Composant pour protéger les routes manager
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/manager/login" replace />;
};

const ManagerRoute = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/synchronisation"
        element={
          <ProtectedRoute>
            <Synchronisation />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/utilisateurs"
        element={
          <ProtectedRoute>
            <GestionUtilisateur />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/carte"
        element={
          <ProtectedRoute>
            <CarteWrapper />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/signalements"
        element={
          <ProtectedRoute>
            <GestionSignalement />
          </ProtectedRoute>
        }
      />

      {/* Redirection par défaut */}
      <Route path="*" element={<Navigate to="/manager/login" replace />} />
    </Routes>
  );
};

export default ManagerRoute;
