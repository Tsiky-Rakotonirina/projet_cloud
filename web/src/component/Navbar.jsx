import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors } from '@assets/colors';
import Button from '@components/Button';
import { Map, MapPin, BarChart3 } from 'lucide-react';

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
    backgroundColor: colors.darker,
    borderBottom: `2px solid ${colors.primary}`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
  };

  const containerStyle = {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '16px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const logoStyle = {
    fontSize: '24px',
    fontWeight: '700',
    color: 'white',
    cursor: 'pointer',
    letterSpacing: '-0.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const navLinksStyle = {
    display: 'flex',
    gap: '32px',
    alignItems: 'center'
  };

  const linkStyle = (isActive) => ({
    color: isActive ? colors.primary : 'white',
    fontSize: '16px',
    fontWeight: isActive ? '600' : '500',
    cursor: 'pointer',
    textDecoration: 'none',
    position: 'relative',
    padding: '8px 16px',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
    backgroundColor: isActive ? `${colors.primary}20` : 'transparent',
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
          <img src="/logo.svg" alt="Logo" style={{ width: '32px', height: '32px' }} />
          <span>Lalan-tsara</span>
        </div>

        {/* Navigation Links */}
        <div style={navLinksStyle}>
          <div
            style={{
              ...linkStyle(isActive('/visiteur/carte')),
              ...(hoveredLink === 'carte' && !isActive('/visiteur/carte') ? {
                backgroundColor: `${colors.primary}15`,
                color: colors.primary
              } : {})
            }}
            onClick={() => navigate('/visiteur/carte')}
            onMouseEnter={() => setHoveredLink('carte')}
            onMouseLeave={() => setHoveredLink(null)}
          >
            <MapPin size={18} /> Carte
          </div>
          <div
            style={{
              ...linkStyle(isActive('/visiteur/tableau')),
              ...(hoveredLink === 'tableau' && !isActive('/visiteur/tableau') ? {
                backgroundColor: `${colors.primary}15`,
                color: colors.primary
              } : {})
            }}
            onClick={() => navigate('/visiteur/tableau')}
            onMouseEnter={() => setHoveredLink('tableau')}
            onMouseLeave={() => setHoveredLink(null)}
          >
            <BarChart3 size={18} /> Tableau
          </div>
        </div>

        {/* Login Button */}
        <Button 
          variant="outline" 
          size="small"
          onClick={() => navigate('/login')}
        >
          Se connecter
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
