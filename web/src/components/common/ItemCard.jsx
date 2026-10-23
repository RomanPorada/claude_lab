import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../../redux/actions";

export default function ItemCard({ item }) {
  const dispatch = useDispatch();
  const [variant, setVariant] = useState(item.type === "molecule" ? item.variant || "Стандартний" : "");

  const variants = item.type === "atom" ? ["Стабільний", "Ізотоп", "Йон"] : [];

  return (
    <div
      style={{
        border: "1px solid #aaa",
        padding: 15,
        borderRadius: 10,
        width: 230,
      }}
    >
      <h3>{item.name}</h3>

      {item.formula && <p>Формула: {item.formula}</p>}
      {item.mass && <p>Маса: {item.mass}</p>}
      {item.molarMass && <p>Молярна маса: {item.molarMass}</p>}

      {item.type === "atom" ? (
        <>
          <select
            value={variant}
            onChange={(e) => setVariant(e.target.value)}
            style={{ width: "100%", marginTop: 10 }}
          >
            <option value="">Оберіть варіант...</option>
            {variants.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          <button
            disabled={!variant}
            onClick={() => dispatch(addToCart(item, variant))}
            style={{ marginTop: 10, width: "100%" }}
          >
            Додати в кошик
          </button>
        </>
      ) : (
        <button
          onClick={() => dispatch(addToCart(item, item.variant || "Стандартний"))}
          style={{ marginTop: 10, width: "100%" }}
        >
          Додати в кошик
        </button>
      )}

      <Link to={`/item/${item.id}`}>
        <button style={{ marginTop: 10, width: "100%" }}>
          Дізнатись більше
        </button>
      </Link>
    </div>
  );
}
