import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '@components/Container';
import Button from '@components/Button';
import { colors } from '@assets/colors';

const Accueil = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const headerStyle = {
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
    transition: 'opacity 0.6s ease, transform 0.6s ease'
  };

  const logoStyle = {
    fontSize: '24px',
    fontWeight: '700',
    color: colors.text,
    letterSpacing: '-0.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  };

  const heroStyle = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    padding: '40px'
  };

  const titleStyle = {
    fontSize: '56px',
    fontWeight: '800',
    color: colors.text,
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
    transition: 'opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s',
    marginBottom: '20px',
    letterSpacing: '-1.5px'
  };

  const subtitleStyle = {
    fontSize: '20px',
    color: colors.tertiary,
    marginBottom: '48px',
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
    transition: 'opacity 0.8s ease 0.4s, transform 0.8s ease 0.4s',
    fontWeight: '400',
    maxWidth: '550px',
    lineHeight: '1.6'
  };

  const buttonContainerStyle = {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
    transition: 'opacity 0.8s ease 0.6s, transform 0.8s ease 0.6s'
  };

  // Decorative shapes
  const shapeStyle1 = {
    position: 'absolute',
    top: '10%',
    right: '10%',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: `radial-gradient(circle, ${colors.primary}15 0%, transparent 70%)`,
    pointerEvents: 'none'
  };

  const shapeStyle2 = {
    position: 'absolute',
    bottom: '15%',
    left: '5%',
    width: '250px',
    height: '250px',
    borderRadius: '50%',
    background: `radial-gradient(circle, ${colors.secondary}20 0%, transparent 70%)`,
    pointerEvents: 'none'
  };

  return (
    <Container>
      {/* Decorative shapes */}
      <div style={shapeStyle1}></div>
      <div style={shapeStyle2}></div>

      {/* Header */}
      <div style={headerStyle}>
        <div style={logoStyle}>
          <i className="fas fa-road" style={{ color: colors.primary }}></i>
          <span>Lalan-tsara</span>
        </div>
        <Button variant="outline" onClick={() => navigate('/manager/login')}>
          <i className="fas fa-sign-in-alt" style={{ marginRight: '8px' }}></i>
          Se connecter
        </Button>
      </div>

      {/* Hero Section */}
      <div style={heroStyle}>
        <h1 style={titleStyle}>Bienvenue dans Lalan-tsara</h1>
        <p style={subtitleStyle}>
          Découvrez les meilleurs itinéraires et points d'intérêt de votre région
        </p>
       
        <div style={buttonContainerStyle}>
          <Button size="large" onClick={() => navigate('/visiteur/carte')}>
            <i className="fas fa-map-marked-alt" style={{ marginRight: '8px' }}></i>
            Voir la carte des rues
          </Button>
        </div>
      </div>
    </Container>
  );
};

export default Accueil;
