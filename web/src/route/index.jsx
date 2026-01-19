import { Routes, Route } from 'react-router-dom';

import NotFound from '@pages/NotFound';
import Accueil from '@pages/Accueil';

import ManagerRoute from './manager.route';
import VisiteurRoute from './visiteur.route';

const AppRoutes = () => {

  return (
    <Routes>
      <Route path="/" element={<Accueil />} />

      <Route path="manager/*" element={<ManagerRoute />} />
      
      <Route path="visiteur/*" element={<VisiteurRoute />} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
