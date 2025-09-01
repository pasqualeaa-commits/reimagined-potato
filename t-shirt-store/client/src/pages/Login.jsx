// Login.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation, Link } from "react-router-dom";
import FeedbackPopup from "../components/FeedbackPopup";
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = ({ onLogin }) => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Correzione qui: legge direttamente lo stato 'from'
  const from = location.state?.from || "/";

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleClosePopup = () => {
    setIsPopupVisible(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsPopupVisible(false);

    try {
      const res = await axios.post("https://reimagined-potato-1.onrender.com/api/login", form);

      localStorage.setItem('userToken', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      onLogin(res.data.user);

      setPopupMessage("Login avvenuto con successo! Verrai reindirizzato a breve.");
      setPopupType("success");
      setIsPopupVisible(true);

      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1500);

    } catch (err) {
      setPopupMessage(err.response?.data?.error || "Credenziali non valide. Riprova.");
      setPopupType("error");
      setIsPopupVisible(true);
    }
  };

  return (
    <div className="login-register-container">
      <h2 className="form-title">Login</h2>
      <form onSubmit={handleSubmit} className="form-container">
        <input 
          name="email" 
          type="email" 
          placeholder="Email" 
          value={form.email} 
          onChange={handleChange} 
          required 
          className="form-input" 
        />
        <div className="password-container">
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
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
          Accedi
        </button>
      </form>
      <div className="forgot-password-container">
        <Link to="/recupero-password" className="forgot-password-link">
          Password dimenticata?
        </Link>
      </div>
      {isPopupVisible && <FeedbackPopup message={popupMessage} type={popupType} onClose={handleClosePopup} />}
    </div>
  );
};

export default Login;