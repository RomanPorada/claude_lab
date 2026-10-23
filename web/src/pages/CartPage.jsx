import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addToCart, removeFromCart } from "../redux/actions";
import "./CartPage.css";

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector((state) => state.cart || {});

  const items = Object.values(cart);

  const totalItems = items.reduce((s, it) => s + (it.quantity || 0), 0);

  return (
    <div className="container cart-page">
      <h1>🛒 Кошик</h1>

      {items.length === 0 && <div className="cart-empty">Кошик порожній</div>}

      <div className="cart-list">
        {items.map((item) => (
          <div key={`${item.id}-${item.variant}`} className="cart-card">
            <div className="meta">
              <strong>{item.name}</strong>
              <small>{item.variant}</small>
            </div>

            <div className="cart-controls">
              <button onClick={() => dispatch(removeFromCart(item.id, item.variant))}>-</button>
              <strong>{item.quantity}</strong>
              <button onClick={() => dispatch(addToCart(item, item.variant))}>+</button>
            </div>
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <>
          <div className="cart-summary">
            Всього позицій: <strong>{totalItems}</strong>
          </div>
          <button
            onClick={() => navigate("/checkout")}
            style={{
              width: "100%",
              padding: "12px",
              background: "var(--primary, #2563eb)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: "600",
              cursor: "pointer",
              marginTop: "16px",
            }}
          >
            Перейти до оформлення
          </button>
        </>
      )}
    </div>
  );
}
