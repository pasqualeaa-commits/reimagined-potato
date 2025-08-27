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

function App() {
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Effetto per controllare lo stato di login all'avvio dell'app
  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = localStorage.getItem('userToken');
      if (token) {
        try {
          const res = await axios.get('http://192.168.31.208:3001/api/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          setUser(res.data.user);
        } catch (err) {
          console.error('Sessione scaduta o non valida:', err);
          localStorage.removeItem('userToken');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkLoginStatus();
  }, []);

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
          <Route path="/register" element={<Register />} />
          <Route path="/profilo" element={<Profilo user={user} onLogout={handleLogout} onUpdateUser={setUser} />} />
          <Route path="/recupero-password" element={<RecuperoPassword />} />
          <Route path="/reset-password/:token" element={<ReimpostaPassword />} />
          <Route path='/about' element={<About />} />
          <Route path='/contact' element={<Contact />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;