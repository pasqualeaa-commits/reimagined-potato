// src/pages/ReimpostaPassword.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import FeedbackPopup from "../components/FeedbackPopup"; // Importa il componente popup

const ReimpostaPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
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
      await axios.post("https://reimagined-potato-1.onrender.com/api/password-reset", { token, newPassword });
      setPopupMessage("Password reimpostata con successo! Ora puoi accedere.");
      setPopupType("success");
      setIsPopupVisible(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setPopupMessage(err.response?.data?.error || "Errore nella reimpostazione della password");
      setPopupType("error");
      setIsPopupVisible(true);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Reimposta Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="newPassword">Nuova password</label>
          <input
            name="newPassword"
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="form-input"
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Reimposta
        </button>
      </form>
      {isPopupVisible && <FeedbackPopup message={popupMessage} type={popupType} onClose={handleClosePopup} />}
    </div>
  );
};

export default ReimpostaPassword;