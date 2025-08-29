// src/pages/RecuperoPassword.jsx
import React, { useState } from "react";
import axios from "axios";
import FeedbackPopup from "../components/FeedbackPopup"; // Importa il componente popup

const RecuperoPassword = () => {
  const [email, setEmail] = useState("");
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");

  const handleClosePopup = () => {
    setIsPopupVisible(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsPopupVisible(false);

    try {
      await axios.post("https://reimagined-potato-1.onrender.com/api/forgot-password", { email });
      setPopupMessage("Se l'email è registrata, riceverai un link per reimpostare la password.");
      setPopupType("success");
      setIsPopupVisible(true);
    } catch (err) {
      setPopupMessage(err.response?.data?.error || "Errore durante la richiesta");
      setPopupType("error");
      setIsPopupVisible(true);
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
          Invia link
        </button>
      </form>
      {isPopupVisible && <FeedbackPopup message={popupMessage} type={popupType} onClose={handleClosePopup} />}
    </div>
  );
};

export default RecuperoPassword;