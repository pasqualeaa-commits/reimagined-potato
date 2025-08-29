// Login.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation, Link } from "react-router-dom";
import FeedbackPopup from "../components/FeedbackPopup"; // Importa il componente popup

const Login = ({ onLogin }) => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleClosePopup = () => {
    setIsPopupVisible(false);
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
      }, 3000);

    } catch (err) {
      setPopupMessage(err.response?.data?.error || "Credenziali non valide. Riprova.");
      setPopupType("error");
      setIsPopupVisible(true);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required className="form-input" />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required className="form-input" />
        <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded transition duration-200 hover:bg-blue-700">
          Accedi
        </button>
      </form>
      <div className="mt-4 text-center">
        <Link to="/recupero-password" className="text-blue-600 hover:underline">
          Hai dimenticato la password?
        </Link>
      </div>
      {isPopupVisible && <FeedbackPopup message={popupMessage} type={popupType} onClose={handleClosePopup} />}
    </div>
  );
};

export default Login;