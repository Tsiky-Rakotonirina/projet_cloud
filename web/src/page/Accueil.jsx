import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '@components/Container';
import Button from '@components/Button';
import { Map, MapPin, Navigation, Star } from 'lucide-react';

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
    fontSize: '28px',
    fontWeight: '700',
    color: 'white',
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
    fontSize: '72px',
    fontWeight: '800',
    color: 'white',
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
    transition: 'opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s',
    marginBottom: '24px',
    letterSpacing: '-2px',
    textShadow: '0 4px 24px rgba(0,0,0,0.3)'
  };

  const subtitleStyle = {
    fontSize: '24px',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: '56px',
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
    transition: 'opacity 0.8s ease 0.4s, transform 0.8s ease 0.4s',
    fontWeight: '400',
    maxWidth: '600px',
    lineHeight: '1.5'
  };
  const buttonContainerStyle = {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    justifyContent: 'center'
  };

  return (
    <Container>
      {/* Header */}
      <div style={headerStyle}>
        <div style={logoStyle}>
          <img src="/logo.svg" alt="Logo" style={{ width: '32px', height: '32px' }} />
          <span>Lalan-tsara</span>
        </div>
        <Button variant="outline" onClick={() => navigate('/manager/login')}>
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
            <Map size={24} style={{ marginRight: '8px' }} /> Voir la carte des rues
          </Button>
        </div>

      </div>
    </Container>
  );
};

export default Accueil;
