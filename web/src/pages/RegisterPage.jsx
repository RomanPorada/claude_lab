import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser, setCart } from "../redux/actions";
import { registerUser } from "../api/authApi";
import "./AuthPages.css";

export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await registerUser(firstName, lastName, email, password, confirmPassword);
      
      if (response.success) {
        dispatch(setUser(response.user));

        dispatch(setCart({}));

        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Зареєструватися</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Ім'я</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Введіть ваше ім'я"
              required
            />
          </div>

          <div className="form-group">
            <label>Прізвище</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Введіть ваше прізвище"
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Мінімум 6 символів"
              required
            />
          </div>

          <div className="form-group">
            <label>Підтвердити пароль</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Повторіть пароль"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Завантаження..." : "Зареєструватися"}
          </button>
        </form>

        <p className="auth-link">
          Вже маєте обліковий запис? <Link to="/login">Увійти</Link>
        </p>
      </div>
    </div>
  );
}
