import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser, setCart } from "../redux/actions";
import { loginUser } from "../api/authApi";
import "./AuthPages.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await loginUser(email, password);
      
      if (response.success) {
        const userCartKey = `redux_cart_${response.user.id}`;
        let savedCart = {};
        try {
          const raw = localStorage.getItem(userCartKey);
          savedCart = raw ? JSON.parse(raw) : {};
        } catch (e) {
          savedCart = {};
        }

        dispatch(setUser(response.user));

        setTimeout(() => {
          dispatch(setCart(savedCart || {}));
          
          navigate("/");
        }, 10);
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Увійти</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
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

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Завантаження..." : "Увійти"}
          </button>
        </form>

        <p className="auth-link">
          Немаєте облікового запису? <Link to="/register">Зареєструватися</Link>
        </p>
      </div>
    </div>
  );
}
