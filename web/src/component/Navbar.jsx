import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors } from '@assets/colors';
import Button from '@components/Button';

/**
 * Composant Navbar avec logo, liens et bouton de connexion
 */
const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: `1px solid rgba(226, 232, 240, 0.8)`
  };

  const containerStyle = {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '12px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const logoStyle = {
    fontSize: '20px',
    fontWeight: '700',
    color: colors.text,
    cursor: 'pointer',
    letterSpacing: '-0.3px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  };

  const logoIconStyle = {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: colors.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    fontSize: '16px'
  };

  const navLinksStyle = {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: '4px',
    borderRadius: '14px',
    border: `1px solid ${colors.border}`
  };

  const linkStyle = (isActive) => ({
    color: isActive ? '#FFFFFF' : colors.text,
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'none',
    padding: '10px 20px',
    borderRadius: '10px',
    transition: 'all 0.2s ease',
    backgroundColor: isActive ? colors.primary : 'transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  });

  const [hoveredLink, setHoveredLink] = React.useState(null);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav style={navStyle}>
      <div style={containerStyle}>
        {/* Logo */}
        <div style={logoStyle} onClick={() => navigate('/')}>
          <div style={logoIconStyle}>
            <i className="fas fa-road"></i>
          </div>
          <span>Lalan-tsara</span>
        </div>

        {/* Navigation Links */}
        <div style={navLinksStyle}>
          <div
            style={{
              ...linkStyle(isActive('/visiteur/carte')),
              ...(hoveredLink === 'carte' && !isActive('/visiteur/carte') ? {
                backgroundColor: colors.surface,
                color: colors.primary
              } : {})
            }}
            onClick={() => navigate('/visiteur/carte')}
            onMouseEnter={() => setHoveredLink('carte')}
            onMouseLeave={() => setHoveredLink(null)}
          >
            <i className="fas fa-map-marker-alt"></i> Carte
          </div>
          <div
            style={{
              ...linkStyle(isActive('/visiteur/tableau')),
              ...(hoveredLink === 'tableau' && !isActive('/visiteur/tableau') ? {
                backgroundColor: colors.surface,
                color: colors.primary
              } : {})
            }}
            onClick={() => navigate('/visiteur/tableau')}
            onMouseEnter={() => setHoveredLink('tableau')}
            onMouseLeave={() => setHoveredLink(null)}
          >
            <i className="fas fa-chart-bar"></i> Tableau
          </div>
        </div>

        {/* Login Button */}
        <Button 
          variant="outline" 
          size="small"
          onClick={() => navigate('/manager/login')}
        >
          <i className="fas fa-sign-in-alt" style={{ marginRight: '6px' }}></i>
          Se connecter
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
