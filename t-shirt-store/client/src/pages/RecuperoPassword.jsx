// src/pages/RecuperoPassword.jsx
import React, { useState } from "react";
import axios from "axios";

const RecuperoPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await axios.post("https://reimagined-potato-1.onrender.com/api/forgot-password", { email });
      setMessage("Se l'email è registrata, riceverai un link per reimpostare la password.");
    } catch (err) {
      setError(err.response?.data?.error || "Errore durante la richiesta");
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Recupero Password</h2>
      <p className="mb-4">Inserisci la tua email per ricevere un link di reimpostazione.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email">Email</label>
          <input
            name="email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="form-input"
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Invia
        </button>
      </form>
      {message && <div className="text-green-600 mt-2">{message}</div>}
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
};

export default RecuperoPassword;