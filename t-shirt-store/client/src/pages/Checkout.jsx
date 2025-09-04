// Checkout.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getNames } from 'country-list';
import FeedbackPopup from "../components/FeedbackPopup";

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
  const [paymentMethod, setPaymentMethod] = useState(''); // Nuovo stato per il metodo di pagamento
  const [isLoading, setIsLoading] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const allCountries = getNames().sort((a, b) => a.localeCompare(b));
  const italyIndex = allCountries.findIndex(country => country === 'Italy');
  if (italyIndex > -1) {
    allCountries.splice(italyIndex, 1);
  }
  const countries = ['Italy', '--------------------', ...allCountries];

  // Opzioni metodi di pagamento
  const paymentMethods = [
    { value: 'cash_on_delivery', label: 'Pago alla consegna' },
    { value: 'paypal', label: 'PayPal' }
  ];

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address || '',
        city: user.city || '',
        province: user.province || '',
        zipCode: user.zipCode || '',
        country: user.country || '',
        email: user.email,
        phoneNumber: user.phoneNumber || ''
      });
      setSaveInfo(true);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedValue = value;

    if (name === 'province') {
      updatedValue = value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2);
    } else if (name === 'zipCode') {
      updatedValue = value.replace(/\D/g, '').slice(0, 5);
    }

    setFormData(prevData => ({ ...prevData, [name]: updatedValue }));
  };

  const handleSaveInfoChange = (e) => {
    setSaveInfo(e.target.checked);
  };

  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  const validate = () => {
    let newErrors = {};
    if (!formData.firstName) newErrors.firstName = "Il nome è richiesto.";
    if (!formData.lastName) newErrors.lastName = "Il cognome è richiesto.";
    if (!formData.email) {
      newErrors.email = "L'email è richiesta.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "L'indirizzo email non è valido.";
    }
    if (!paymentMethod) {
      newErrors.paymentMethod = "Seleziona un metodo di pagamento.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setPopupMessage("Si prega di correggere gli errori nel modulo.");
      setPopupType("error");
      setIsPopupVisible(true);
      return;
    }
    
    setIsLoading(true);
    setIsPopupVisible(false);

    const orderData = {
      customerData: formData,
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        image: item.coverImage,
        size: item.size,
        language: item.language,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: parseFloat(subtotal),
      paymentMethod: paymentMethod, // Aggiunto metodo di pagamento
      userId: user ? user.id : null,
      saveInfo: saveInfo
    };

    try {
      const token = localStorage.getItem('userToken');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const res = await axios.post("https://reimagined-potato-1.onrender.com/api/orders", orderData, config);
      
      setPopupMessage("Ordine confermato con successo! Verrai reindirizzato a breve.");
      setPopupType("success");
      setIsPopupVisible(true);

      setTimeout(() => {
        navigate('/conferma-ordine', { state: { order: orderData } });
      }, 2000);
      onClearCart();

    } catch (err) {
      console.error('Errore durante la conferma dell\'ordine:', err);
      setPopupMessage(err.response?.data?.error || "Errore nella conferma dell'ordine. Riprova.");
      setPopupType("error");
      setIsPopupVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Il tuo carrello è vuoto!</h2>
        <p className="mb-4">Per procedere al checkout, aggiungi prima alcuni prodotti al carrello.</p>
        <Link to="/products" className="text-blue-600 hover:underline">
          Vai alla pagina dei prodotti
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto checkout-container">
      <h2 className="text-2xl font-bold mb-6 text-center">Checkout</h2>
      
      {!user && (
        <div className="flex flex-col items-center p-4 bg-gray-100 rounded-lg shadow-inner mb-6 text-center">
          <p className="text-gray-700 font-semibold mb-3">
            Vuoi risparmiare tempo e velocizzare il processo di checkout?
          </p>
          <div className="flex gap-4">
            <Link 
              to="/login" 
              state={{ from: location.pathname }}
              className="login-register-btn flex-1 text-center"
            >
              Accedi
            </Link>
            <Link 
              to="/register" 
              state={{ from: location.pathname }}
              className="login-register-btn flex-1 text-center"
            >
              Registrati
            </Link>
          </div>
        </div>
      )}

      <div className="md:w-full">
        <h3 className="text-xl font-semibold mb-4">Dati di Spedizione</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-bold mb-2">Nome:</label>
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
            <label htmlFor="lastName" className="block text-sm font-bold mb-2">Cognome:</label>
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

          <div>
            <label htmlFor="address" className="block text-sm font-bold mb-2">Indirizzo:</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-bold mb-2">Città:</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div>
            <label htmlFor="province" className="block text-sm font-bold mb-2">Provincia (Sigla):</label>
            <input
              type="text"
              id="province"
              name="province"
              value={formData.province}
              onChange={handleChange}
              maxLength="2"
              className="form-input"
            />
          </div>

          <div>
            <label htmlFor="zipCode" className="block text-sm font-bold mb-2">CAP:</label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              maxLength="5"
              className="form-input"
            />
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-bold mb-2">Nazione:</label>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="form-input"
            >
              <option value="">Seleziona una nazione</option>
              {countries.map(country => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-bold mb-2">Numero di Telefono:</label>
            <input
              type="text"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-bold mb-2">Email:</label>
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

          {/* Nuova sezione per il metodo di pagamento */}
          <div className="border-t pt-4">
            <h3 className="text-xl font-semibold mb-4">Metodo di Pagamento</h3>
            <div className="space-y-3">
              {paymentMethods.map(method => (
                <label key={method.value} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={handlePaymentMethodChange}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="text-gray-900 font-medium">{method.label}</span>
                  {method.value === 'cash_on_delivery' && (
                    <span className="text-sm text-gray-500 ml-2">
                      (Paga direttamente al corriere)
                    </span>
                  )}
                </label>
              ))}
            </div>
            {errors.paymentMethod && <p className="text-red-500 text-xs italic mt-2">{errors.paymentMethod}</p>}
          </div>

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
            {isLoading ? 'Elaborazione...' : `Conferma Ordine ${subtotal} €`}
          </button>
        </form>
      </div>

      {isPopupVisible && <FeedbackPopup message={popupMessage} type={popupType} onClose={() => setIsPopupVisible(false)} />}
    </div>
  );
};

export default Checkout;