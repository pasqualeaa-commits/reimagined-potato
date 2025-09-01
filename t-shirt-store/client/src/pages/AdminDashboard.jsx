// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
  // Nuovo stato per gestire il menu a tendina
  const [openOrderId, setOpenOrderId] = useState(null);
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
        alert('Ordine eliminato con successo!');
        fetchOrders();
      } catch (err) {
        console.error('Errore durante l\'eliminazione dell\'ordine:', err);
        alert('Errore durante l\'eliminazione dell\'ordine.');
      }
    }
  };
  
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo prodotto?')) {
      try {
        await axios.delete(`https://reimagined-potato-1.onrender.com/api/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Prodotto eliminato con successo!');
        fetchProducts();
      } catch (err) {
        console.error('Errore durante l\'eliminazione del prodotto:', err);
        alert('Errore durante l\'eliminazione del prodotto.');
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
    let productData = {
        ...newProduct,
        sizes: availableSizes,
        languages: availableLanguages,
    };
    
    try {
      productData.price = parseFloat(newProduct.price);
      
      // Converti l'oggetto immagini in una stringa JSON prima dell'invio
      productData.images = JSON.stringify(newProduct.images);
      
      await axios.post('https://reimagined-potato-1.onrender.com/api/products', productData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Prodotto aggiunto con successo!');
      setNewProduct({
        name: '',
        description: '',
        price: '',
        coverimage: '',
        images: {}
      });
      fetchProducts();
    } catch (err) {
      console.error('Errore durante l\'aggiunta del prodotto:', err);
      alert('Errore durante l\'aggiunta del prodotto. Controlla il formato dei dati.');
    }
  };

  // Funzione per mostrare/nascondere i dettagli dell'ordine
  const toggleOrderDetails = (orderId) => {
    setOpenOrderId(openOrderId === orderId ? null : orderId);
  };

  // Funzione per aggiornare lo stato dell'ordine
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(`https://reimagined-potato-1.onrender.com/api/admin/orders/${orderId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Stato dell\'ordine aggiornato con successo!');
      fetchOrders(); // Ricarica gli ordini per vedere l'aggiornamento
    } catch (err) {
      console.error('Errore durante l\'aggiornamento dello stato:', err);
      alert('Errore durante l\'aggiornamento dello stato dell\'ordine.');
    }
  };

  if (!user || user.id !== 1) {
    return null;
  }

  return (
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
              {product.name} - Prezzo: €{product.price}
              <button className="delete-button" onClick={() => handleDeleteProduct(product.id)}>Elimina Prodotto</button>
            </li>
          ))}
        </ul>
      ) : (
        <p>Nessun prodotto trovato.</p>
      )}
    </div>
  );
};

export default AdminDashboard;