import React from 'react';
import { colors } from '@assets/colors';
import Card from '@components/Card';

/**
 * Composant tableau pour afficher les données visiteurs
 */
const TableauData = ({ data, columns }) => {
  const tableStyle = {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    fontSize: '14px'
  };

  const thStyle = {
    backgroundColor: colors.surface,
    color: colors.text,
    padding: '14px 20px',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: `1px solid ${colors.border}`
  };

  const tdStyle = {
    padding: '14px 20px',
    borderBottom: `1px solid ${colors.border}`,
    color: colors.text
  };

  const trStyle = {
    transition: 'background-color 0.2s ease',
    backgroundColor: 'transparent'
  };

  const emptyStyle = {
    textAlign: 'center',
    padding: '60px 40px',
    color: colors.tertiary,
    fontSize: '16px'
  };

  const emptyIconStyle = {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.4,
    color: colors.primary
  };

  if (!data || data.length === 0) {
    return (
      <div style={emptyStyle}>
        <div style={emptyIconStyle}><i className="fas fa-chart-bar"></i></div>
        <p>Aucune donnée disponible</p>
      </div>
    );
  }

  const displayColumns = columns || Object.keys(data[0]);

  return (
    <Card padding="0" hoverable={false}>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {displayColumns.map((col, index) => (
                <th 
                  key={index} 
                  style={{
                    ...thStyle,
                    ...(index === 0 ? { borderTopLeftRadius: '12px' } : {}),
                    ...(index === displayColumns.length - 1 ? { borderTopRightRadius: '12px' } : {})
                  }}
                >
                  {typeof col === 'object' ? col.label : col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                style={trStyle}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.primary}08`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {displayColumns.map((col, colIndex) => {
                  const key = typeof col === 'object' ? col.key : col;
                  return (
                    <td key={colIndex} style={tdStyle}>
                      {row[key] !== undefined ? row[key] : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default TableauData;
