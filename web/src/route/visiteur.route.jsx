import { Routes, Route } from 'react-router-dom';

import PointsPage from '@pages/visiteur/PointsPage';
import TableauPage from '@pages/visiteur/TableauPage';

const VisiteurRoute = () => {

  return (
    <Routes>
      <Route path="/carte" element={<PointsPage />} />
      
      <Route path="/tableau" element={<TableauPage />} />
    </Routes>
  );
};

export default VisiteurRoute;