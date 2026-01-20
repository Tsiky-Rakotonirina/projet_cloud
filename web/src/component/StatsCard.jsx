import React from 'react';
import { colors } from '@assets/colors';
import Card from '@components/Card';

/**
 * Composant carte statistique élégante
 */
const StatsCard = ({ title, value, icon, color, trend }) => {
  const colorMap = {
    primary: colors.primary,
    secondary: colors.secondary,
    tertiary: colors.tertiary,
    dark: colors.dark
  };

  const selectedColor = colorMap[color] || color || colors.primary;

  const valueStyle = {
    fontSize: '40px',
    fontWeight: '700',
    color: selectedColor,
    marginBottom: '8px',
    letterSpacing: '-1px'
  };

  const titleStyle = {
    fontSize: '13px',
    color: colors.tertiary,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: '0.5px'
  };

  const iconContainerStyle = {
    width: '56px',
    height: '56px',
    borderRadius: '8px',
    backgroundColor: `${selectedColor}20`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px'
  };

  const trendStyle = {
    fontSize: '12px',
    fontWeight: '600',
    color: trend > 0 ? '#10B981' : trend < 0 ? '#EF4444' : colors.tertiary,
    marginTop: '8px'
  };

  return (
    <Card padding="24px" hoverable={false}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={valueStyle}>{value}</div>
          <div style={titleStyle}>{title}</div>
          {trend !== undefined && (
            <div style={trendStyle}>
              {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'} {Math.abs(trend)}%
            </div>
          )}
        </div>
        {icon && (
          <div style={iconContainerStyle}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatsCard;
