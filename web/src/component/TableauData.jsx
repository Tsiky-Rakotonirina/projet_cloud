import React from 'react';
import { colors } from '@assets/colors';
import Card from '@components/Card';
import { BarChart3 } from 'lucide-react';

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
    backgroundColor: colors.dark,
    color: 'white',
    padding: '16px 20px',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: `2px solid ${colors.primary}`
  };

  const tdStyle = {
    padding: '16px 20px',
    borderBottom: `1px solid rgba(135, 188, 222, 0.15)`,
    color: colors.tertiary
  };

  const trStyle = {
    transition: 'background-color 0.2s ease',
    backgroundColor: 'transparent'
  };

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

  if (!data || data.length === 0) {
    return (
      <div style={emptyStyle}>
        <div style={emptyIconStyle}><BarChart3 size={64} /></div>
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
                    ...(index === 0 ? { borderTopLeftRadius: '16px' } : {}),
                    ...(index === displayColumns.length - 1 ? { borderTopRightRadius: '16px' } : {})
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
