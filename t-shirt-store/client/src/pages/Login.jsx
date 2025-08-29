// Login.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Login = ({ onLogin }) => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("https://reimagined-potato-1.onrender.com/api/login", form);
      
      // Salva il token e i dati utente in localStorage
      localStorage.setItem('userToken', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // Chiama la funzione onLogin per aggiornare lo stato del componente App
      onLogin(res.data.user);

      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Errore nel login");
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
      {error && <div className="text-red-600 mt-2">{error}</div>}
      
      <div className="mt-4 text-center">
        <Link to="/recupero-password" className="text-sm text-blue-600 hover:underline">
          Hai dimenticato la password?
        </Link>
      </div>
    </div>
  );
};

export default Login;