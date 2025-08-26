// components/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart } from 'react-icons/fa';

const Header = ({ cartCount, user }) => (
  <header className="header flex items-center justify-between px-8 py-4">
    {/* Sinistra: nome negozio */}
    <div>
      <Link
        to="/"
        className="shop-name"
      >
        Ancora Non So.com
      </Link>
    </div>
    {/* Centro: benvenuto utente */}
    <div>
      {user && (
        <Link to="/profilo" className="font-bold text-blue-600 hover:underline text-lg">
          Benvenuto {user.firstName}!
        </Link>
      )}
    </div>
    {/* Destra: menu carrello, login/registrati */}
    <nav className="navbar flex items-center space-x-4">
      {!user && (
        <>
          <Link to="/login" className="mx-2 text-blue-600 hover:underline">Login</Link>
          <Link to="/register" className="mx-2 text-blue-600 hover:underline">Registrati</Link>
        </>
      )}
      <Link
        to="/cart"
        className="px-4 py-2 bg-gray-100 rounded shadow hover:bg-blue-100 text-gray-700 no-underline transition duration-300 flex items-center relative"
      >
        <FaShoppingCart className="text-2xl mr-2" />
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </Link>
    </nav>
  </header>
);

export default Header;
