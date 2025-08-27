import React from 'react';
import { Link } from 'react-router-dom';

const Contact = ({ user }) => (
  <div className="contact-container p-8 flex flex-col items-center justify-center text-center">
    <h2 className="text-4xl font-bold mb-4">
      {user
        ? `Benvenuto nel Nostro Negozio, ${user.firstName}!`
        : 'Qui dovrebbero apparire i contatti'}
    </h2>
    <p className="text-lg mb-8">Scopri la nostra fantastica selezione di prodotti.</p>
    <Link to="/products" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300">
      Guarda i Prodotti
    </Link>
    <div className="mt-4">
      {/* Mostra i link di login e registrazione solo se l'utente NON è loggato */}
      {!user && (
        <>
          <Link to="/login" className="btn mr-2">Login/</Link>
          <Link to="/register" className="btn">Registrati</Link>
        </>
      )}
    </div>
  </div>
);

export default Contact;