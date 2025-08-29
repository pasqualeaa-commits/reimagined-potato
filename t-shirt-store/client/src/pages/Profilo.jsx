import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { getNames } from 'country-list';

const countries = getNames(); // Array di tutti i paesi

const Profilo = ({ user, onLogout, onUpdateUser }) => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    address: user.address || "",
    city: user.city || "",
    province: user.province || "",
    zipCode: user.zipCode || "",
    country: user.country || "",
    phoneNumber: user.phoneNumber || "",
    password: ""
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  if (!user) return <Navigate to="/" replace />;

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedValue = value;

    if (name === 'province') {
      updatedValue = value.toUpperCase().slice(0, 2);
    } else if (name === 'zipCode') {
      updatedValue = value.replace(/\D/g, '').slice(0, 5);
    }

    setForm({ ...form, [name]: updatedValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await axios.put(
        `https://reimagined-potato-1.onrender.com/api/user/${user.id}`,
        form
      );

      setSuccess("Profilo aggiornato!");
      if (onUpdateUser) onUpdateUser(res.data.user);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Errore nell'aggiornamento");
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate("/");
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">
        Profilo di {user.firstName} {user.lastName}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="firstName">Nome</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
        <div>
          <label htmlFor="lastName">Cognome</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
        <div>
          <label htmlFor="address">Indirizzo</label>
          <input
            type="text"
            id="address"
            name="address"
            value={form.address}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div>
          <label htmlFor="city">Città</label>
          <input
            type="text"
            id="city"
            name="city"
            value={form.city}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div>
          <label htmlFor="province">Provincia</label>
          <input
            type="text"
            id="province"
            name="province"
            maxLength="2"
            value={form.province}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div>
          <label htmlFor="zipCode">CAP</label>
          <input
            type="text"
            id="zipCode"
            name="zipCode"
            maxLength="5"
            value={form.zipCode}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div>
          <label htmlFor="country">Nazione</label>
          <select name="country" value={form.country} onChange={handleChange} className="form-input">
            <option value="">Seleziona una nazione</option>
            {countries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="phoneNumber">Numero di Telefono</label>
          <input
            type="text"
            id="phoneNumber"
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div>
          <label htmlFor="password">Nuova password (opzionale)</label>
          <input
            type="password"
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Salva modifiche
        </button>
      </form>
      {success && <div className="text-green-600 mt-2">{success}</div>}
      {error && <div className="text-red-600 mt-2">{error}</div>}
      <button
        onClick={handleLogout}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
      >
        Logout
      </button>
    </div>
  );
};

export default Profilo;