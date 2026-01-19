import React from 'react';

/**
 * Composant grille responsive
 */
const Grid = ({ 
  children, 
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = '24px',
  style = {}
}) => {
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(280px, 1fr))`,
    gap: gap,
    width: '100%',
    ...style
  };

  return (
    <div style={gridStyle}>
      {children}
    </div>
  );
};

export default Grid;
