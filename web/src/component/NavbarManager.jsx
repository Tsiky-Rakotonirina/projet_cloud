import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors } from '@assets/colors';
import Button from '@components/Button';
import { useAuth } from '@context/AuthContext';

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
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'none',
    padding: '9px 16px',
    borderRadius: '10px',
    transition: 'all 0.2s ease',
    backgroundColor: isActive ? colors.primary : 'transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  });

  const [hoveredLink, setHoveredLink] = React.useState(null);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path);

  const userInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  };

  const userNameStyle = {
    color: colors.tertiary,
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  };

  return (
    <nav style={navStyle}>
      <div style={containerStyle}>
        {/* Logo - Sans lien */}
        <div style={logoStyle}>
          <div style={logoIconStyle}>
            <i className="fas fa-road"></i>
          </div>
          <span>Lalan-tsara</span>
        </div>

        {/* Navigation Links */}
        <div style={navLinksStyle}>
          <div
            style={{
              ...linkStyle(isActive('/manager/synchronisation')),
              ...(hoveredLink === 'sync' && !isActive('/manager/synchronisation') ? {
                backgroundColor: colors.surface,
                color: colors.primary
              } : {})
            }}
            onClick={() => navigate('/manager/synchronisation')}
            onMouseEnter={() => setHoveredLink('sync')}
            onMouseLeave={() => setHoveredLink(null)}
          >
            <i className="fas fa-sync-alt"></i> Sync
          </div>
          <div
            style={{
              ...linkStyle(isActive('/manager/utilisateurs')),
              ...(hoveredLink === 'users' && !isActive('/manager/utilisateurs') ? {
                backgroundColor: colors.surface,
                color: colors.primary
              } : {})
            }}
            onClick={() => navigate('/manager/utilisateurs')}
            onMouseEnter={() => setHoveredLink('users')}
            onMouseLeave={() => setHoveredLink(null)}
          >
            <i className="fas fa-users"></i> Utilisateurs
          </div>
          <div
            style={{
              ...linkStyle(isActive('/manager/signalements')),
              ...(hoveredLink === 'reports' && !isActive('/manager/signalements') ? {
                backgroundColor: colors.surface,
                color: colors.primary
              } : {})
            }}
            onClick={() => navigate('/manager/signalements')}
            onMouseEnter={() => setHoveredLink('reports')}
            onMouseLeave={() => setHoveredLink(null)}
          >
            <i className="fas fa-flag"></i> Signalements
          </div>
          <div
            style={{
              ...linkStyle(isActive('/manager/carte')),
              ...(hoveredLink === 'carte' && !isActive('/manager/carte') ? {
                backgroundColor: colors.surface,
                color: colors.primary
              } : {})
            }}
            onClick={() => navigate('/manager/carte')}
            onMouseEnter={() => setHoveredLink('carte')}
            onMouseLeave={() => setHoveredLink(null)}
          >
            <i className="fas fa-map-marker-alt"></i> Carte
          </div>
          <div
            style={{
              ...linkStyle(isActive('/manager/tableau')),
              ...(hoveredLink === 'tableau' && !isActive('/manager/tableau') ? {
                backgroundColor: colors.surface,
                color: colors.primary
              } : {})
            }}
            onClick={() => navigate('/manager/tableau')}
            onMouseEnter={() => setHoveredLink('tableau')}
            onMouseLeave={() => setHoveredLink(null)}
          >
            <i className="fas fa-chart-bar"></i> Tableau
          </div>
        </div>

        {/* User Info & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user && (
            <span style={userNameStyle}>
              <i className="fas fa-user-circle" style={{ color: colors.primary, fontSize: '16px' }}></i>
              {user.nom || user.email}
            </span>
          )}
          <Button 
            variant="outline" 
            size="small"
            onClick={handleLogout}
          >
            <i className="fas fa-sign-out-alt" style={{ marginRight: '6px' }}></i>
            Déconnexion
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default NavbarManager;
