import React from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '@components/Container';
import Button from '@components/Button';
import { colors } from '@assets/colors';

const NotFound = () => {
  const navigate = useNavigate();

  const contentStyle = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    padding: '40px'
  };

  const errorCodeStyle = {
    fontSize: '140px',
    fontWeight: '800',
    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '24px',
    letterSpacing: '-4px'
  };

  const titleStyle = {
    fontSize: '32px',
    color: colors.text,
    marginBottom: '16px',
    fontWeight: '700',
    letterSpacing: '-0.5px'
  };

  const messageStyle = {
    fontSize: '17px',
    color: colors.tertiary,
    marginBottom: '48px',
    maxWidth: '480px',
    lineHeight: '1.6'
  };

  const iconStyle = {
    fontSize: '72px',
    marginBottom: '32px',
    color: colors.primary
  };

  return (
    <Container>
      <div style={contentStyle}>
        <div style={iconStyle}>
          <i className="fas fa-map-marker-alt"></i>
        </div>
        <div style={errorCodeStyle}>404</div>
        <h1 style={titleStyle}>Page non trouvée</h1>
        <p style={messageStyle}>
          Oups ! La page que vous recherchez n'existe pas ou a été déplacée.
          Retournez à l'accueil pour continuer votre navigation.
        </p>
        <Button size="large" onClick={() => navigate('/')}>
          <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
          Revenir à l'accueil
        </Button>
      </div>
    </Container>
  );
};

export default NotFound;
