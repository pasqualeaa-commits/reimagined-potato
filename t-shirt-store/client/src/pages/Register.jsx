// Register.jsx
import React, { useState } from "react";
import axios from "axios";
import { getNames } from 'country-list';
import { useNavigate, useLocation } from "react-router-dom";
import FeedbackPopup from "../components/FeedbackPopup"; // Importa il nuovo componente

const Register = ({ onLogin }) => {
  const [form, setForm] = useState({ 
    firstName: "", 
    lastName: "", 
    email: "", 
    password: "", 
    address: "", 
    city: "", 
    province: "", 
    zipCode: "",
    country: "",
    phoneNumber: ""
  });
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");

  const allCountries = getNames().sort((a, b) => a.localeCompare(b));
  const italyIndex = allCountries.findIndex(country => country === 'Italy');
  if (italyIndex > -1) {
    allCountries.splice(italyIndex, 1);
  }
  const countries = ['Italy', '--------------------', ...allCountries];
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setIsPopupVisible(false);

    try {
      await axios.post("https://reimagined-potato-1.onrender.com/api/register", form);
      const res = await axios.post("https://reimagined-potato-1.onrender.com/api/login", {
        email: form.email,
        password: form.password
      });
      localStorage.setItem("userToken", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      onLogin(res.data.user);
      
      setPopupMessage("Registrazione avvenuta con successo! Verrai reindirizzato a breve.");
      setPopupType("success");
      setIsPopupVisible(true);

      setTimeout(() => {
        navigate(from, { replace: true });
      }, 3000);

    } catch (err) {
      setPopupMessage(err.response?.data?.error || "Errore nella registrazione");
      setPopupType("error");
      setIsPopupVisible(true);
    }
  };

  const handleClosePopup = () => {
    setIsPopupVisible(false);
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Registrazione</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="firstName">Nome</label>
          <input name="firstName" id="firstName" value={form.firstName} onChange={handleChange} required className="form-input" />
        </div>
        <div>
          <label htmlFor="lastName">Cognome</label>
          <input name="lastName" id="lastName" value={form.lastName} onChange={handleChange} required className="form-input" />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input name="email" id="email" type="email" value={form.email} onChange={handleChange} required className="form-input" />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input name="password" id="password" type="password" value={form.password} onChange={handleChange} required className="form-input" />
        </div>
        <div>
          <label htmlFor="address">Indirizzo</label>
          <input name="address" id="address" value={form.address} onChange={handleChange} className="form-input" />
        </div>
        <div>
          <label htmlFor="city">Città</label>
          <input name="city" id="city" value={form.city} onChange={handleChange} className="form-input" />
        </div>
        <div>
          <label htmlFor="province">Provincia</label>
          <input name="province" id="province" value={form.province} onChange={handleChange} className="form-input" />
        </div>
        <div>
          <label htmlFor="zipCode">CAP</label>
          <input name="zipCode" id="zipCode" value={form.zipCode} onChange={handleChange} className="form-input" />
        </div>
        <div>
          <label htmlFor="country">Nazione</label>
          <select name="country" value={form.country} onChange={handleChange} className="form-input">
            <option value="">Seleziona una nazione</option>
            {countries.map(country => {
              if (country === '--------------------') {
                return <option key="separator" value="" disabled>─</option>;
              }
              return (
                <option key={country} value={country}>
                  {country}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label htmlFor="phoneNumber">Numero di Telefono</label>
          <input name="phoneNumber" id="phoneNumber" value={form.phoneNumber} onChange={handleChange} className="form-input" />
        </div>
        <button type="submit" className="bg-black text-white px-4 py-2 rounded">Registrati</button>
      </form>
      {isPopupVisible && <FeedbackPopup message={popupMessage} type={popupType} onClose={handleClosePopup} />}
    </div>
  );
};

export default Register;