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
    fontSize: '160px',
    fontWeight: '800',
    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '24px',
    letterSpacing: '-4px',
    textShadow: '0 8px 32px rgba(135, 188, 222, 0.3)'
  };

  const titleStyle = {
    fontSize: '36px',
    color: 'white',
    marginBottom: '16px',
    fontWeight: '700',
    letterSpacing: '-0.5px'
  };

  const messageStyle = {
    fontSize: '18px',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '48px',
    maxWidth: '500px',
    lineHeight: '1.6'
  };

  const iconStyle = {
    fontSize: '80px',
    marginBottom: '32px',
    opacity: 0.5
  };

  return (
    <Container>
      <div style={contentStyle}>
        <div style={iconStyle}><MapOff size={80} /></div>
        <div style={errorCodeStyle}>404</div>
        <h1 style={titleStyle}>Page non trouvée</h1>
        <p style={messageStyle}>
          Oups ! La page que vous recherchez n'existe pas ou a été déplacée.
          Retournez à l'accueil pour continuer votre navigation.
        </p>
        <Button size="large" onClick={() => navigate('/')}>
          ← Revenir à l'accueil
        </Button>
      </div>
    </Container>
  );
};

export default NotFound;
