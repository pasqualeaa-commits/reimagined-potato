// src/pages/ReimpostaPassword.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import FeedbackPopup from "../components/FeedbackPopup";
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Importa le icone di React Icons

const ReimpostaPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleClosePopup = () => {
    setIsPopupVisible(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
    <div className="login-register-container">
      <h2 className="form-title">Reimposta Password</h2>
      <form onSubmit={handleSubmit} className="form-container">
        <div className="password-container">
          <input
            name="newPassword"
            id="newPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="Nuova password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="form-input password-input"
          />
          <span
            className="password-toggle"
            onClick={togglePasswordVisibility}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        <button type="submit" className="login-button">
          Reimposta
        </button>
      </form>
      {isPopupVisible && <FeedbackPopup message={popupMessage} type={popupType} onClose={handleClosePopup} />}
    </div>
  );
};

export default ReimpostaPassword;