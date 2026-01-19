import React from 'react';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <h1 className="hero-title">LalanTsara</h1>
        <p className="hero-subtitle">
          Voyez les problèmes routiers à Antananarivo pour mieux se préparer
        </p>
        <div className="hero-actions">
          <button className="btn-primary">Voir la carte</button>
          <button className="btn-secondary">En savoir plus</button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
