// Checkout.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { getNames } from 'country-list';

const Checkout = ({ cartItems, onClearCart, user }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    province: '',
    zipCode: '',
    country: '',
    email: '',
    phoneNumber: ''
  });
  const [errors, setErrors] = useState({});
  const [saveInfo, setSaveInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const countries = getNames().sort((a, b) => {
      if (a === 'Italy') return -1;
      if (b === 'Italy') return 1;
      return a.localeCompare(b);
    });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        address: user.address || '',
        city: user.city || '',
        province: user.province || '',
        zipCode: user.zipCode || '',
        country: user.country || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedValue = value;

    if (name === 'province') {
      updatedValue = value.toUpperCase().slice(0, 2);
    } else if (name === 'zipCode') {
      updatedValue = value.replace(/\D/g, '').slice(0, 5);
    }

    setFormData(prevFormData => ({ ...prevFormData, [name]: updatedValue }));
    setErrors(prevErrors => ({ ...prevErrors, [name]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = 'Il nome è richiesto.';
    if (!formData.lastName) newErrors.lastName = 'Il cognome è richiesto.';
    if (!formData.address) newErrors.address = 'L\'indirizzo è richiesto.';
    if (!formData.city) newErrors.city = 'La città è richiesta.';
    if (!formData.province) newErrors.province = 'La provincia è richiesta.';
    if (!formData.zipCode) newErrors.zipCode = 'Il CAP è richiesto.';
    if (!formData.country) newErrors.country = 'La nazione è richiesta.';
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Il numero di telefono è richiesto.';
    if (!formData.email) {
      newErrors.email = 'L\'email è richiesta.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'L\'email non è valida.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const orderData = {
        customerData: formData,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
          size: item.size,
          language: item.language || 'it'
        })),
        totalAmount: cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
        userId: user ? user.id : null,
        saveInfo: saveInfo
      };

      await axios.post('https://reimagined-potato-1.onrender.com/api/orders', orderData);
      
      onClearCart();
      navigate('/conferma-ordine');
    } catch (err) {
      console.error("Errore durante il checkout:", err);
      setErrors({ server: 'Errore durante l\'elaborazione del tuo ordine. Riprova più tardi.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveInfoChange = (e) => {
    setSaveInfo(e.target.checked);
  };

  return (
    <div className="container mx-auto p-4 flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-2/3">
        <h2 className="text-2xl font-bold mb-4">Checkout</h2>
        {/* Frase e pulsanti sopra il form se NON loggato */}
        {!user && (
          <div className="checkout-login-bar mb-6 flex flex-col items-center">
  <span className="text-lg font-semibold mb-3" style={{ color: "#2563eb" }}>
    Vuoi risparmiare tempo? <br />
    Fai il login oppure registrati per salvare i tuoi dati!
  </span>
  <div className="flex gap-4 mt-2">
    <Link to="/login" state={{ from: { pathname: location.pathname } }}>
      <button type="button" className="login-register-btn">
        Login
      </button>
    </Link>
    <Link to="/register" state={{ from: { pathname: location.pathname } }}>
      <button type="button" className="login-register-btn">
        Registrati
      </button>
    </Link>
  </div>
</div>
        )}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-bold mb-4">Dati di Spedizione</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="firstName" className="block text-gray-700 text-sm font-bold mb-2">Nome:</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`form-input ${errors.firstName ? 'border-red-500' : ''}`}
              />
              {errors.firstName && <p className="text-red-500 text-xs italic">{errors.firstName}</p>}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-gray-700 text-sm font-bold mb-2">Cognome:</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`form-input ${errors.lastName ? 'border-red-500' : ''}`}
              />
              {errors.lastName && <p className="text-red-500 text-xs italic">{errors.lastName}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="address" className="block text-gray-700 text-sm font-bold mb-2">Indirizzo:</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={`form-input ${errors.address ? 'border-red-500' : ''}`}
            />
            {errors.address && <p className="text-red-500 text-xs italic">{errors.address}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="city" className="block text-gray-700 text-sm font-bold mb-2">Città:</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={`form-input ${errors.city ? 'border-red-500' : ''}`}
              />
              {errors.city && <p className="text-red-500 text-xs italic">{errors.city}</p>}
            </div>
            <div>
              <label htmlFor="province" className="block text-gray-700 text-sm font-bold mb-2">Provincia:</label>
              <input
                type="text"
                id="province"
                name="province"
                maxLength="2"
                value={formData.province}
                onChange={handleChange}
                className={`form-input ${errors.province ? 'border-red-500' : ''}`}
              />
              {errors.province && <p className="text-red-500 text-xs italic">{errors.province}</p>}
            </div>
            <div>
              <label htmlFor="zipCode" className="block text-gray-700 text-sm font-bold mb-2">CAP:</label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                maxLength="5"
                value={formData.zipCode}
                onChange={handleChange}
                className={`form-input ${errors.zipCode ? 'border-red-500' : ''}`}
              />
              {errors.zipCode && <p className="text-red-500 text-xs italic">{errors.zipCode}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="country" className="block text-gray-700 text-sm font-bold mb-2">Nazione:</label>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              className={`form-select ${errors.country ? 'border-red-500' : ''}`}
            >
              <option value="">Seleziona una nazione</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            {errors.country && <p className="text-red-500 text-xs italic">{errors.country}</p>}
          </div>
          <div>
            <label htmlFor="phoneNumber" className="block text-gray-700 text-sm font-bold mb-2">Numero di Telefono:</label>
            <input
              type="text"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className={`form-input ${errors.phoneNumber ? 'border-red-500' : ''}`}
            />
            {errors.phoneNumber && <p className="text-red-500 text-xs italic">{errors.phoneNumber}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${errors.email ? 'border-red-500' : ''}`}
            />
            {errors.email && <p className="text-red-500 text-xs italic">{errors.email}</p>}
          </div>
          {/* Flag "Salva info" solo se loggato */}
          {user && (
            <div>
              <label className="flex items-center space-x-2 mt-4">
                <input
                  type="checkbox"
                  checked={saveInfo}
                  onChange={handleSaveInfoChange}
                  className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                />
                <span className="text-gray-900 text-sm">Salva le mie informazioni per il prossimo acquisto</span>
              </label>
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline mt-4"
            disabled={isLoading}
          >
            {isLoading ? 'Elaborazione...' : 'Paga e Ordina'}
          </button>
          {errors.server && <p className="text-red-500 text-center mt-2">{errors.server}</p>}
        </form>
      </div>
    </div>
  );
};

export default Checkout;