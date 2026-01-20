import React from 'react';
import { colors } from '@assets/colors';
import Grid from '@components/Grid';
import PointCard from '@components/PointCard';

/**
 * Composant liste pour afficher plusieurs points visiteurs
 */
const PointList = ({ points, onPointClick }) => {
  const emptyStyle = {
    textAlign: 'center',
    padding: '80px 40px',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '18px'
  };

  const emptyIconStyle = {
    fontSize: '64px',
    marginBottom: '16px',
    opacity: 0.5
  };

  if (!points || points.length === 0) {
    return (
      <div style={emptyStyle}>
        <div style={emptyIconStyle}><Map size={64} /></div>
        <p>Aucun point visiteur disponible</p>
      </div>
    );
  }

  return (
    <Grid gap="24px">
      {points.map((point, index) => (
        <PointCard
          key={point.id || index}
          point={point}
          onClick={() => onPointClick && onPointClick(point)}
        />
      ))}
    </Grid>
  );
};

export default PointList;
