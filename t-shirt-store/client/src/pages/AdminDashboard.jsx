// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import FeedbackPopup from '../components/FeedbackPopup';

const AdminDashboard = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    coverimage: '',
    images: {}
  });
  const [openOrderId, setOpenOrderId] = useState(null);

  // Stati per paginazione e filtro degli ordini
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 7;
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Stati per la paginazione dei prodotti
  const [productCurrentPage, setProductCurrentPage] = useState(1);
  const productsPerPage = 5;
  
  // Nuovi stati per la paginazione degli utenti
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const usersPerPage = 5;

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
    // Controllo se l'utente è un amministratore prima di caricare la dashboard
    if (!user || !user.isAdmin) {
      navigate('/');
      return;
    }

    fetchOrders();
    fetchProducts();
    fetchUsers();
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

  const fetchUsers = async () => {
    try {
      const res = await axios.get('https://reimagined-potato-1.onrender.com/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error('Errore nel recupero degli utenti:', err);
      setError('Impossibile caricare gli utenti.');
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

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo utente?')) {
      try {
        await axios.delete(`https://reimagined-potato-1.onrender.com/api/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPopup({ isVisible: true, message: 'Utente eliminato con successo!', type: 'success' });
        fetchUsers();
      } catch (err) {
        console.error('Errore durante l\'eliminazione dell\'utente:', err);
        const errorMessage = err.response?.data?.error || 'Errore durante l\'eliminazione dell\'utente.';
        setPopup({ isVisible: true, message: errorMessage, type: 'error' });
      }
    }
  };
  
  const handleSetAdminStatus = async (userId, isAdmin) => {
    if (user.id === userId) {
      setPopup({ isVisible: true, message: 'Non puoi modificare il tuo stato di amministratore.', type: 'error' });
      return;
    }

    if (window.confirm(`Sei sicuro di voler ${isAdmin ? 'declassare' : 'promuovere'} questo utente?`)) {
      try {
        await axios.put(`https://reimagined-potato-1.onrender.com/api/admin/users/${userId}/set-admin`, { is_admin: !isAdmin }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPopup({ isVisible: true, message: 'Stato amministratore aggiornato con successo!', type: 'success' });
        fetchUsers();
      } catch (err) {
        console.error('Errore durante l\'aggiornamento dello stato di amministratore:', err);
        const errorMessage = err.response?.data?.error || 'Errore durante l\'aggiornamento dello stato di amministratore.';
        setPopup({ isVisible: true, message: errorMessage, type: 'error' });
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
    
    const imagesString = JSON.stringify(newProduct.images);
    
    const productData = {
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        sizes: availableSizes,
        languages: availableLanguages,
        coverimage: newProduct.coverimage,
        images: imagesString
    };
    
    try {
      const response = await axios.post('https://reimagined-potato-1.onrender.com/api/products', productData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setPopup({ isVisible: true, message: 'Prodotto aggiunto con successo!', type: 'success' });
      
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

  // Filtra gli ordini in base allo stato selezionato e al numero d'ordine
  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = String(order.order_id).includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  // Calcoli per la paginazione degli ordini
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const renderOrderPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers.map(number => (
      <button
        key={number}
        onClick={() => setCurrentPage(number)}
        className={currentPage === number ? 'page-number active' : 'page-number'}
      >
        {number}
      </button>
    ));
  };
  
  // Calcoli per la paginazione dei prodotti
  const indexOfLastProduct = productCurrentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalProductPages = Math.ceil(products.length / productsPerPage);

  const renderProductPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalProductPages; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers.map(number => (
      <button
        key={number}
        onClick={() => setProductCurrentPage(number)}
        className={productCurrentPage === number ? 'page-number active' : 'page-number'}
      >
        {number}
      </button>
    ));
  };
  
  // Calcoli per la paginazione degli utenti
  const indexOfLastUser = userCurrentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalUserPages = Math.ceil(users.length / usersPerPage);

  const renderUserPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalUserPages; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers.map(number => (
      <button
        key={number}
        onClick={() => setUserCurrentPage(number)}
        className={userCurrentPage === number ? 'page-number active' : 'page-number'}
      >
        {number}
      </button>
    ));
  };


  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <div>
      <div className="admin-dashboard">
        <h2>Pannello di Amministrazione</h2>
        {error && <p className="error">{error}</p>}
        
        <h3>Gestione Ordini</h3>

        <div className="order-filters">
          <label htmlFor="status-filter">Filtra per Stato:</label>
          <select 
            id="status-filter" 
            value={filterStatus} 
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1); 
            }}
            className="status-select"
          >
            <option value="all">Tutti</option>
            {orderStatusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <label htmlFor="search-order">Cerca Ordine:</label>
          <input
            type="text"
            id="search-order"
            placeholder="N. ordine"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input"
          />
        </div>

        {currentOrders.length > 0 ? (
          <ul>
            {currentOrders.map(order => (
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
          <p>Nessun ordine trovato con questo stato o numero.</p>
        )}

        {/* Controlli per la paginazione degli ordini */}
        {filteredOrders.length > ordersPerPage && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="pagination-button prev"
            >
              &lt;
            </button>
            <div className="page-numbers">
              {renderOrderPageNumbers()}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="pagination-button next"
            >
              &gt;
            </button>
          </div>
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
        {currentProducts.length > 0 ? (
          <ul>
            {currentProducts.map(product => (
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
      
        {/* Controlli per la paginazione dei prodotti */}
        {products.length > productsPerPage && (
          <div className="pagination">
            <button
              onClick={() => setProductCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={productCurrentPage === 1}
              className="pagination-button prev"
            >
              &lt;
            </button>
            <div className="page-numbers">
              {renderProductPageNumbers()}
            </div>
            <button
              onClick={() => setProductCurrentPage(prev => Math.min(totalProductPages, prev + 1))}
              disabled={productCurrentPage === totalProductPages}
              className="pagination-button next"
            >
              &gt;
            </button>
          </div>
        )}
        
        <hr />
        
        <h3>Gestione Utenti</h3>
        
        <h4>Elenco Utenti</h4>
        {currentUsers.length > 0 ? (
          <ul>
            {currentUsers.map(userItem => (
              <li key={userItem.id}>
                <div>
                  <strong>{userItem.first_name} {userItem.last_name}</strong> - {userItem.email} 
                  {userItem.is_admin ? <span> (Amministratore)</span> : <span> (Utente Standard)</span>}
                  {user.id !== userItem.id && (
                    <>
                      <button className="delete-button" onClick={() => handleDeleteUser(userItem.id)}>
                        Elimina Utente
                      </button>
                      <button onClick={() => handleSetAdminStatus(userItem.id, userItem.is_admin)}>
                        {userItem.is_admin ? 'Declassa a Utente' : 'Promuovi a Admin'}
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Nessun utente trovato.</p>
        )}
        
        {/* Controlli per la paginazione degli utenti */}
        {users.length > usersPerPage && (
          <div className="pagination">
            <button
              onClick={() => setUserCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={userCurrentPage === 1}
              className="pagination-button prev"
            >
              &lt;
            </button>
            <div className="page-numbers">
              {renderUserPageNumbers()}
            </div>
            <button
              onClick={() => setUserCurrentPage(prev => Math.min(totalUserPages, prev + 1))}
              disabled={userCurrentPage === totalUserPages}
              className="pagination-button next"
            >
              &gt;
            </button>
          </div>
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