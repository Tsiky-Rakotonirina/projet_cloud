import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors } from '@assets/colors';
import Button from '@components/Button';
import { useAuth } from '@context/AuthContext';
import { RefreshCw, Users, AlertTriangle, Map } from 'lucide-react';

/**
 * Composant Navbar pour les managers
 */
const NavbarManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: colors.dark,
    borderBottom: `2px solid ${colors.secondary}`,
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
    color: isActive ? colors.secondary : 'white',
    fontSize: '16px',
    fontWeight: isActive ? '600' : '500',
    cursor: 'pointer',
    textDecoration: 'none',
    position: 'relative',
    padding: '8px 16px',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
    backgroundColor: isActive ? `${colors.secondary}20` : 'transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  });

  const [hoveredLink, setHoveredLink] = React.useState(null);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path);

  const userInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginRight: '16px'
  };

  const userNameStyle = {
    color: 'white',
    fontSize: '14px',
    fontWeight: '500'
  };

  return (
    <nav style={navStyle}>
      <div style={containerStyle}>
        {/* Logo - Sans lien */}
        <div style={logoStyle}>
          <img src="/logo.svg" alt="Logo" style={{ width: '32px', height: '32px' }} />
          <span>Lalan-tsara Admin</span>
        </div>

        {/* Navigation Links */}
        <div style={navLinksStyle}>
          <div
            style={{
              ...linkStyle(isActive('/manager/synchronisation')),
              ...(hoveredLink === 'sync' && !isActive('/manager/synchronisation') ? {
                backgroundColor: `${colors.secondary}15`,
                color: colors.secondary
              } : {})
            }}
            onClick={() => navigate('/manager/synchronisation')}
            onMouseEnter={() => setHoveredLink('sync')}
            onMouseLeave={() => setHoveredLink(null)}
          >
            <RefreshCw size={18} /> Synchronisation
          </div>
          <div
            style={{
              ...linkStyle(isActive('/manager/utilisateurs')),
              ...(hoveredLink === 'users' && !isActive('/manager/utilisateurs') ? {
                backgroundColor: `${colors.secondary}15`,
                color: colors.secondary
              } : {})
            }}
            onClick={() => navigate('/manager/utilisateurs')}
            onMouseEnter={() => setHoveredLink('users')}
            onMouseLeave={() => setHoveredLink(null)}
          >
            <Users size={18} /> Utilisateurs
          </div>
          <div
            style={{
              ...linkStyle(isActive('/manager/signalements')),
              ...(hoveredLink === 'reports' && !isActive('/manager/signalements') ? {
                backgroundColor: `${colors.secondary}15`,
                color: colors.secondary
              } : {})
            }}
            onClick={() => navigate('/manager/signalements')}
            onMouseEnter={() => setHoveredLink('reports')}
            onMouseLeave={() => setHoveredLink(null)}
          >
            <AlertTriangle size={18} /> Signalements
          </div>
          <div
            style={{
              ...linkStyle(isActive('/manager/carte')),
              ...(hoveredLink === 'map' && !isActive('/manager/carte') ? {
                backgroundColor: `${colors.secondary}15`,
                color: colors.secondary
              } : {})
            }}
            onClick={() => navigate('/manager/carte')}
            onMouseEnter={() => setHoveredLink('map')}
            onMouseLeave={() => setHoveredLink(null)}
          >
            <Map size={18} /> Voir la Carte
          </div>
        </div>

        {/* User Info & Logout */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {user && (
            <div style={userInfoStyle}>
              <span style={userNameStyle}>{user.nom || user.email}</span>
            </div>
          )}
          <Button 
            variant="outline" 
            size="small"
            onClick={handleLogout}
          >
            Se déconnecter
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default NavbarManager;
