// components/Header.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaBars, FaTimes } from 'react-icons/fa';

const Header = ({ cartCount, user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen((v) => !v);
  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = () => {
    onLogout();
    navigate('/');
    closeMenu();
  };

  return (
    <header className="header">
      {/* Hamburger a sinistra */}
      <button onClick={toggleMenu} className="menu-toggle" aria-label="Apri menu">
        {isMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Titolo al centro */}
      <div className="shop-name-container">
        <Link to="/" className="shop-name">Lost in Translation</Link>
      </div>

      {/* Lato destro: carrello + (menu UL che si apre in mobile) */}
      <nav className="navbar">
        <ul className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
              <li><Link to="/products" className="nav-link" onClick={closeMenu}>Prodotti</Link></li>
              <li><Link to="/contact" className="nav-link" onClick={closeMenu}>Contattaci</Link></li>
              <li><Link to="/about" className="nav-link" onClick={closeMenu}>Chi Siamo</Link></li>
              {user && user.id === 1 && (
                <li><Link to="/admin" className="nav-link" onClick={closeMenu}>Admin</Link></li>
              )}
          {!user ? (
            <>
              <li><Link to="/login" className="nav-link" onClick={closeMenu}>Login</Link></li>
              <li><Link to="/register" className="nav-link" onClick={closeMenu}>Registrati</Link></li>
            </>
          ) : (
            <>
              <li><Link to="/profilo" className="nav-link" onClick={closeMenu}>Profilo</Link></li>
              <li><button onClick={handleLogout} className="logout-button">Logout</button></li>
            </>
          )}
        </ul>
         <Link to="/cart" className="cart-link" onClick={closeMenu} aria-label="Carrello">
          <FaShoppingCart />
          {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
        </Link>
      </nav>
    </header>
  );
};

export default Header;