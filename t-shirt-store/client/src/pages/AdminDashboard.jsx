// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import FeedbackPopup from '../components/FeedbackPopup';

const AdminDashboard = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    coverimage: '',
    images: {}
  });
  const [openOrderId, setOpenOrderId] = useState(null);

  // Stati per il popup di feedback
  const [popup, setPopup] = useState({
    isVisible: false,
    message: '',
    type: '' // 'success' o 'error'
  });

  const navigate = useNavigate();
  const token = localStorage.getItem('userToken');

  const availableSizes = ['S', 'M', 'L', 'XL'];
  const availableLanguages = ['Italiano', 'English', 'Français', 'Español', 'Deutsch'];
  const orderStatusOptions = ['pending', 'shipped', 'delivered', 'cancelled'];

  useEffect(() => {
    if (!user || user.id !== 1) {
      navigate('/');
      return;
    }

    fetchOrders();
    fetchProducts();
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('https://reimagined-potato-1.onrender.com/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (err) {
      console.error('Errore nel recupero degli ordini:', err);
      setError('Impossibile caricare gli ordini.');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('https://reimagined-potato-1.onrender.com/api/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Errore nel recupero dei prodotti:', err);
      setError('Impossibile caricare i prodotti.');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo ordine?')) {
      try {
        await axios.delete(`https://reimagined-potato-1.onrender.com/api/admin/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPopup({ isVisible: true, message: 'Ordine eliminato con successo!', type: 'success' });
        fetchOrders();
      } catch (err) {
        console.error('Errore durante l\'eliminazione dell\'ordine:', err);
        setPopup({ isVisible: true, message: 'Errore durante l\'eliminazione dell\'ordine.', type: 'error' });
      }
    }
  };
  
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo prodotto?')) {
      try {
        await axios.delete(`https://reimagined-potato-1.onrender.com/api/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPopup({ isVisible: true, message: 'Prodotto eliminato con successo!', type: 'success' });
        fetchProducts();
      } catch (err) {
        console.error('Errore durante l\'eliminazione del prodotto:', err);
        setPopup({ isVisible: true, message: 'Errore durante l\'eliminazione del prodotto.', type: 'error' });
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleImageChange = (lang, url) => {
    setNewProduct(prevState => ({
      ...prevState,
      images: {
        ...prevState.images,
        [lang]: url
      }
    }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    // Costruisci la stringa JSON per le immagini (colonna TEXT)
    const imagesString = JSON.stringify(newProduct.images);
    
    const productData = {
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        sizes: availableSizes,
        languages: availableLanguages,
        coverimage: newProduct.coverimage,
        images: imagesString // ✅ Stringa JSON per colonna TEXT
    };
    
    console.log('Dati prodotto da inviare:', productData);
    console.log('Tipo di images:', typeof productData.images);
    console.log('Contenuto images:', productData.images);
    
    try {
      const response = await axios.post('https://reimagined-potato-1.onrender.com/api/products', productData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Risposta dal server:', response.data);
      setPopup({ isVisible: true, message: 'Prodotto aggiunto con successo!', type: 'success' });
      
      // Reset form
      setNewProduct({
        name: '',
        description: '',
        price: '',
        coverimage: '',
        images: {}
      });
      
      fetchProducts();
    } catch (err) {
      console.error('Errore durante l\'aggiunta del prodotto:', err.response?.data || err);
      const errorMessage = err.response?.data?.error || err.response?.data?.details || 'Errore durante l\'aggiunta del prodotto.';
      setPopup({ isVisible: true, message: errorMessage, type: 'error' });
    }
  };

  const toggleOrderDetails = (orderId) => {
    setOpenOrderId(openOrderId === orderId ? null : orderId);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(`https://reimagined-potato-1.onrender.com/api/admin/orders/${orderId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPopup({ isVisible: true, message: 'Stato dell\'ordine aggiornato con successo!', type: 'success' });
      fetchOrders();
    } catch (err) {
      console.error('Errore durante l\'aggiornamento dello stato:', err);
      setPopup({ isVisible: true, message: 'Errore durante l\'aggiornamento dello stato dell\'ordine.', type: 'error' });
    }
  };

  const handleClosePopup = () => {
    setPopup({ isVisible: false, message: '', type: '' });
  };

  if (!user || user.id !== 1) {
    return null;
  }

  return (
    <div>
      <div className="admin-dashboard">
        <h2>Pannello di Amministrazione</h2>
        {error && <p className="error">{error}</p>}
        
        <h3>Gestione Ordini</h3>
        {orders.length > 0 ? (
          <ul>
            {orders.map(order => (
              <li key={order.order_id}>
                <div className="order-summary">
                  <span>Ordine #{order.order_id} - Totale: €{order.total_amount} - Stato: {order.status}</span>
                  <button onClick={() => toggleOrderDetails(order.order_id)}>
                    {openOrderId === order.order_id ? 'Chiudi Dettagli' : 'Mostra Dettagli'}
                  </button>
                  <button className="delete-button" onClick={() => handleDeleteOrder(order.order_id)}>Elimina Ordine</button>
                </div>

                {openOrderId === order.order_id && (
                  <div className="order-details">
                    <h4>Dettagli Cliente</h4>
                    <p>Nome: {order.customer_first_name} {order.customer_last_name}</p>
                    <p>Email: {order.customer_email}</p>
                    <p>Indirizzo: {order.customer_address}, {order.customer_city}, {order.customer_province}, {order.customer_zip_code}, {order.customer_country}</p>
                    <p>Telefono: {order.customer_phone_number}</p>
                    
                    <h4>Prodotti Ordinati</h4>
                    <ul>
                      {order.items.map((item, index) => (
                        <li key={index}>
                          - {item.product_name} ({item.size}, {item.language}) x {item.quantity} - €{item.price}
                        </li>
                      ))}
                    </ul>

                    <h4>Cambia Stato</h4>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                    >
                      {orderStatusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>Nessun ordine trovato.</p>
        )}
        
        <h3>Gestione Prodotti</h3>
        
        <form onSubmit={handleAddProduct} className="add-product-form">
          <h4>Aggiungi Nuovo Prodotto</h4>
          <div className="form-row">
              <input
                type="text"
                name="name"
                placeholder="Nome Prodotto"
                value={newProduct.name}
                onChange={handleChange}
                required
              />
              <textarea
                name="description"
                placeholder="Descrizione"
                value={newProduct.description}
                onChange={handleChange}
              ></textarea>
              <input
                type="number"
                step="0.01"
                name="price"
                placeholder="Prezzo"
                value={newProduct.price}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="coverimage"
                placeholder="URL Immagine di copertina"
                value={newProduct.coverimage}
                onChange={handleChange}
              />
          </div>

          <div className="form-row">
              <h5>Immagini per ogni lingua:</h5>
              {availableLanguages.map(lang => (
                  <input
                      key={lang}
                      type="text"
                      name={`image-${lang}`}
                      placeholder={`URL Immagine (${lang})`}
                      value={newProduct.images[lang] || ''}
                      onChange={(e) => handleImageChange(lang, e.target.value)}
                  />
              ))}
          </div>

          <button type="submit" className="add-product-button">Aggiungi Prodotto</button>
        </form>
        
        <h4>Elenco Prodotti</h4>
        {products.length > 0 ? (
          <ul>
            {products.map(product => (
              <li key={product.id}>
                <div>
                  <strong>{product.name}</strong> - Prezzo: €{product.price}
                  <br />
                  <small>{product.description}</small>
                  <br />
                  <button className="delete-button" onClick={() => handleDeleteProduct(product.id)}>
                    Elimina Prodotto
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Nessun prodotto trovato.</p>
        )}
      </div>

      {/* Rendering condizionale del popup */}
      {popup.isVisible && (
        <FeedbackPopup
          message={popup.message}
          type={popup.type}
          onClose={handleClosePopup}
        />
      )}
    </div>
  );
};

export default AdminDashboard;