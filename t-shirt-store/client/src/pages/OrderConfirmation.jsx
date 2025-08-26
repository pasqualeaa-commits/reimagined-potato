import React from "react";

const OrderConfirmation = () => (
  <div className="p-8 text-center">
    <h2 className="text-2xl font-bold mb-4">Ordine Confermato!</h2>
    <p className="mb-4">Grazie per il tuo acquisto. Riceverai una mail con i dettagli dell’ordine.</p>
    <a href="/" className="text-blue-600 underline">Torna alla Home</a>
  </div>
);

export default OrderConfirmation;