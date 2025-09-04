// OrderConfirmation.jsx
import React from "react";
import { useLocation, Link } from "react-router-dom";

const OrderConfirmation = () => {
  const location = useLocation();
  const order = location.state?.order;

  if (!order) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Errore</h2>
        <p className="mb-4">Dettagli dell'ordine non trovati. Si prega di contattare il supporto.</p>
        <Link to="/" className="text-blue-600 underline">Torna alla Home</Link>
      </div>
    );
  }

  return (
    <div className="p-8 text-center max-w-2xl mx-auto bg-gray-50 rounded-lg shadow-lg mt-10">
      <h2 className="text-4xl font-extrabold text-blue-600 mb-4">Ordine Confermato! 🎉</h2>
      <p className="text-gray-700 mb-6">Grazie per il tuo acquisto. Riceverai una mail con i dettagli dell’ordine.</p>

      <div className="bg-white p-6 rounded-md shadow-inner text-left border border-gray-200">

        <h4 className="text-xl font-medium mt-6 mb-2 text-gray-800">Articoli Ordinati</h4>
        <ul className="list-disc list-inside space-y-2 pl-4">
          {order.items.map((item, index) => (
            <li key={index} className="text-gray-700">
              <span className="font-semibold">{item.product_name}</span> ({item.size}, {item.language}) - Quantità: {item.quantity} - Prezzo: €{Number(item.price).toFixed(2)}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <Link to="/" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105">
          Torna alla Home
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;