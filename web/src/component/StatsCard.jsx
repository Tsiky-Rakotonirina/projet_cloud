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
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger
  };

  const selectedColor = colorMap[color] || color || colors.primary;

  const valueStyle = {
    fontSize: '36px',
    fontWeight: '700',
    color: colors.text,
    marginBottom: '8px',
    letterSpacing: '-1px'
  };

  const titleStyle = {
    fontSize: '13px',
    color: colors.tertiary,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: '0.5px',
    opacity: 0.8
  };

  const iconContainerStyle = {
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    backgroundColor: `${selectedColor}15`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    color: selectedColor
  };

  const trendStyle = {
    fontSize: '12px',
    fontWeight: '600',
    color: trend > 0 ? colors.success : trend < 0 ? colors.danger : colors.tertiary,
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };

  return (
    <Card padding="24px" hoverable={false}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={valueStyle}>{value}</div>
          <div style={titleStyle}>{title}</div>
          {trend !== undefined && (
            <div style={trendStyle}>
              <i className={`fas fa-arrow-${trend > 0 ? 'up' : trend < 0 ? 'down' : 'right'}`}></i>
              {Math.abs(trend)}%
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
