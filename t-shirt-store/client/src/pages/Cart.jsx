// Cart.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Cart = ({ cartItems, onRemoveFromCart, onUpdateQuantity }) => {
  return (
    <div className="cart-container max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-center">Il tuo Carrello</h2>
      {cartItems.length === 0 ? (
        <p className="text-center text-gray-600">Il carrello è vuoto. <Link to="/products" className="text-blue-500 hover:underline">Inizia a fare shopping!</Link></p>
      ) : (
        <>
          <div className="cart-items mb-8">
            {cartItems.map(item => {
              // Parsa la stringa 'images' in un oggetto JSON
              const parsedImages = item.images ? JSON.parse(item.images) : {};
              const imageUrl = parsedImages[item.language] || item.coverimage;

              return (
                <div key={`${item.id}-${item.size}-${item.language}`} className="cart-item flex items-center gap-4 border-b border-gray-200 py-4">
                  <img
                    src={imageUrl}
                    alt={item.name}
                    className="cart-item-image w-24 h-24 object-cover rounded-lg shadow-md"
                  />
                  <div className="cart-item-info flex-grow">
                    <h3 className="text-xl font-semibold m-0">{item.name}</h3>
                    <p className="text-gray-700 m-0">€{Number(item.price).toFixed(2)}</p>
                    <p className="text-gray-600 text-sm m-0">Taglia: {item.size}</p>
                    <p className="text-gray-600 text-sm m-0">Lingua: {item.language}</p>
                    <div className="quantity-controls flex items-center mt-2">
                      <button
                        onClick={() => onUpdateQuantity(item, item.quantity - 1)}
                        className="bg-gray-200 text-gray-700 rounded-md w-8 h-8 flex items-center justify-center hover:bg-gray-300 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >-</button>
                      <span className="px-4 text-lg">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item, item.quantity + 1)}
                        className="bg-gray-200 text-gray-700 rounded-md w-8 h-8 flex items-center justify-center hover:bg-gray-300 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >+</button>
                    </div>
                    <button
                      onClick={() => onRemoveFromCart(item)}
                      className="remove-button mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >Rimuovi</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="cart-summary text-right border-t-2 border-gray-300 pt-6 mt-6">
            <h3 className="text-2xl font-bold mb-4">Totale: €{cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0).toFixed(2)}</h3>
            <Link to="/checkout" className="checkout-button bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md inline-block transition duration-300">
              Procedi al Pagamento
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;