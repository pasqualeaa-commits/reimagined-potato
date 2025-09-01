import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { getNames } from "country-list";

const allCountries = getNames().sort((a, b) => a.localeCompare(b));
const italyIndex = allCountries.findIndex((country) => country === "Italy");
if (italyIndex > -1) {
  allCountries.splice(italyIndex, 1);
}
const countries = ["Italy", "--------------------", ...allCountries];

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
    password: "",
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  if (!user) return <Navigate to="/" replace />;

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedValue = value;

    if (name === "province") {
      updatedValue = value
        .replace(/[^a-zA-Z]/g, "")
        .toUpperCase()
        .slice(0, 2);
    } else if (name === "zipCode") {
      updatedValue = value.replace(/\D/g, "").slice(0, 5);
    }

    setForm({ ...form, [name]: updatedValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    try {
      // Recupera il token dal localStorage
      const token = localStorage.getItem('userToken');
      
      if (!token) {
        setError("Token di autenticazione mancante. Effettua nuovamente il login.");
        return;
      }

      const res = await axios.put(
        `https://reimagined-potato-1.onrender.com/api/users/${user.id}`,
        form,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess("Profilo aggiornato!");
      if (onUpdateUser) onUpdateUser(res.data.user);
      
      // Reset password field dopo l'aggiornamento riuscito
      setForm({ ...form, password: "" });
      
    } catch (err) {
      console.error(err);
      
      if (err.response?.status === 401) {
        setError("Sessione scaduta. Effettua nuovamente il login.");
        // Rimuovi il token scaduto
        localStorage.removeItem('userToken');
        onLogout();
        navigate("/");
      } else if (err.response?.status === 403) {
        setError("Non hai i permessi per modificare questo profilo.");
      } else {
        setError(err.response?.data?.error || "Errore nell'aggiornamento del profilo");
      }
    }
  };

  const handleLogout = () => {
    // Rimuovi il token dal localStorage
    localStorage.removeItem('userToken');
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
          <label htmlFor="province">Provincia (Sigla)</label>
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
          <select
            name="country"
            value={form.country}
            onChange={handleChange}
            className="form-input"
          >
            <option value="">Seleziona una nazione</option>
            {countries.map((country) => {
              if (country === "--------------------") {
                return (
                  <option key="separator" value="" disabled>
                    ─
                  </option>
                );
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
            placeholder="Lascia vuoto per non modificare"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Salva modifiche
        </button>
      </form>
      {success && <div className="text-green-600 mt-2">{success}</div>}
      {error && <div className="text-red-600 mt-2">{error}</div>}
      <button
        onClick={handleLogout}
        className="logout-button mt-4" 
      >
        Logout
      </button>
    </div>
  );
};

export default Profilo;