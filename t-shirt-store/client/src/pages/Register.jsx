// Register.jsx
import React, { useState } from "react";
import axios from "axios";
import { getNames } from 'country-list';
import { useNavigate, useLocation } from "react-router-dom";

const Register = () => {
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const allCountries = getNames().sort((a, b) => a.localeCompare(b));
  const italyIndex = allCountries.findIndex(country => country === 'Italy');
  if (italyIndex > -1) {
    allCountries.splice(italyIndex, 1);
  }
  const countries = ['Italy', '--------------------', ...allCountries];


  const navigate = useNavigate();
  const location = useLocation();


  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      await axios.post("https://reimagined-potato-1.onrender.com/api/register", form);
      setSuccess("Registrazione avvenuta con successo! Ora puoi fare il login.");
      setTimeout(() => {
        navigate('/login', { state: { from: location.state?.from || { pathname: from } } });
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Errore nella registrazione");
    }
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
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {success && <div className="text-green-600 mt-2">{success}</div>}
    </div>
  );
};

export default Register;