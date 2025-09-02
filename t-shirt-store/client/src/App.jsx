// App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route } from 'react-router-dom';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Home from './pages/Home';
import OrderConfirmation from './pages/OrderConfirmation';
import Header from './components/Header';
import Footer from './components/Footer';
import './App.css';
import Register from './pages/Register';
import Login from './pages/Login';
import Profilo from './pages/Profilo';
import RecuperoPassword from './pages/RecuperoPassword';
import ReimpostaPassword from './pages/ReimpostaPassword';
import About from './pages/About';
import Contact from './pages/Contact';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cartItems');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Inizializza l'utente dai dati salvati in localStorage
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [loading, setLoading] = useState(true);

  // Effetto per controllare lo stato di login all'avvio dell'app
  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = localStorage.getItem('userToken');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          // Verifica che il token sia ancora valido
          const res = await axios.get('https://reimagined-potato-1.onrender.com/api/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          // Se l'API restituisce dati diversi da quelli salvati, aggiorna
          const apiUser = res.data;
          if (JSON.stringify(apiUser) !== savedUser) {
            localStorage.setItem('user', JSON.stringify(apiUser));
            setUser(apiUser);
          }
        } catch (err) {
          console.error('Sessione scaduta o non valida:', err);
          // Rimuovi tutti i dati di sessione se il token non è valido
          localStorage.removeItem('userToken');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else if (token && !savedUser) {
        // Se c'è solo il token ma non i dati utente, recuperali
        try {
          const res = await axios.get('https://reimagined-potato-1.onrender.com/api/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const userData = res.data;
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
        } catch (err) {
          console.error('Errore nel recupero dei dati utente:', err);
          localStorage.removeItem('userToken');
          setUser(null);
        }
      }
      
      setLoading(false);
    };

    checkLoginStatus();
  }, []);

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const onAddToCart = (product, options) => {
    const imageForCart = product.images[options.language] || product.coverImage;

    const existingItem = cartItems.find(
      (item) => item.id === product.id && item.size === options.size && item.language === options.language
    );

    if (existingItem) {
      setCartItems(
        cartItems.map((item) =>
          item.id === product.id && item.size === options.size && item.language === options.language
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCartItems([
        ...cartItems,
        {
          ...product,
          image: imageForCart,
          size: options.size,
          language: options.language,
          quantity: 1,
        },
      ]);
    }
  };

  const onRemoveFromCart = (itemToRemove) => {
    setCartItems(cartItems.filter((item) => item !== itemToRemove));
  };

  const onUpdateQuantity = (itemToUpdate, newQuantity) => {
    if (newQuantity <= 0) {
      onRemoveFromCart(itemToUpdate);
    } else {
      setCartItems(
        cartItems.map((item) =>
          item === itemToUpdate ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const onClearCart = () => {
    setCartItems([]);
  };

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleLogin = (userData) => {
    // Salva sia l'utente che il token quando si effettua il login
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };
  
  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("user");
    setUser(null);
  };

  if (loading) {
    return <div>Caricamento...</div>;
  }

  return (
    <div className="app">
      <Header cartCount={cartItemCount} user={user} onLogout={handleLogout} />
      <main>
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/products" element={<ProductList onAddToCart={onAddToCart} />} />
          <Route
            path="/product/:productId"
            element={<ProductDetail onAddToCart={onAddToCart} />}
          />
          <Route
            path="/cart"
            element={
              <Cart
                cartItems={cartItems}
                onRemoveFromCart={onRemoveFromCart}
                onUpdateQuantity={onUpdateQuantity}
              />
            }
          />
          <Route
            path="/checkout"
            element={
              <Checkout
                cartItems={cartItems}
                onClearCart={onClearCart}
                user={user}
              />
            }
          />
          <Route path="/conferma-ordine" element={<OrderConfirmation />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register onLogin={handleLogin} />} />
          <Route path="/profilo" element={<Profilo user={user} onLogout={handleLogout} onUpdateUser={setUser} />} />
          <Route path="/recupero-password" element={<RecuperoPassword />} />
          <Route path="/reset-password/:token" element={<ReimpostaPassword />} />
          <Route path='/about' element={<About />} />
          <Route path='/contact' element={<Contact />} />
          <Route path="/admin" element={<AdminDashboard user={user} />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;