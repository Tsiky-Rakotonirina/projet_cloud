import React from 'react';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <img src="/logo.svg" alt="LalanTsara Logo" className="logo" />
        </div>
        <div className="navbar-actions">
          <button className="btn-login">Se Connecter</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
