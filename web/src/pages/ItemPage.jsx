import { useDispatch } from "react-redux";
import { addToCart } from "../redux/actions";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchAtomById } from "../api/atomsApi";
import { fetchMoleculeById } from "../api/moleculesApi";

export default function ItemPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [item, setItem] = useState(null);
  const [variant, setVariant] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        if (id && id.startsWith("atom-")) {
          const resp = await fetchAtomById(id);
          if (mounted) setItem(resp.data);
        } else if (id && id.startsWith("mol-")) {
          const resp = await fetchMoleculeById(id);
          if (mounted) setItem(resp.data);
        } else {
          if (mounted) setItem(null);
        }
      } catch (e) {
        if (mounted) setItem(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [id]);

  if (loading) return <h2>Завантаження...</h2>;
  if (!item) return <h2>Товар не знайдено</h2>;

  const atomVariants = ["Стабільний", "Ізотоп", "Йон"];
  const itemType = item.type || (id?.startsWith("atom-") ? "atom" : id?.startsWith("mol-") ? "molecule" : null);

  return (
    <div style={{ padding: 20 }}>
      <h1>{item.name}</h1>

      {item.formula && <p>Формула: {item.formula}</p>}
      {item.mass && <p>Маса: {item.mass}</p>}
      {item.molarMass && <p>Мол. маса: {item.molarMass}</p>}

      {item.type === "atom" && (
        <div>
          {item.protons != null && <p>Протони: {item.protons}</p>}
          {item.neutrons != null && <p>Нейтрони: {item.neutrons}</p>}
          {item.electrons != null && <p>Електрони: {item.electrons}</p>}
          {item.atomType && <p>Тип: {item.atomType}</p>}
        </div>
      )}
      {itemType === "molecule" && item.phase && <p>Фаза: {item.phase}</p>}

      {itemType === "atom" ? (
        <>
          <select value={variant} onChange={(e) => setVariant(e.target.value)}>
            <option value="">Оберіть варіант...</option>
            {atomVariants.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>

          <button
            disabled={!variant}
            onClick={() => dispatch(addToCart(item, variant))}
            style={{ marginLeft: 10 }}
          >
            Додати до кошика
          </button>
        </>
      ) : (
        <button
          onClick={() => dispatch(addToCart(item, item.variant || "Стандартний"))}
          style={{ marginLeft: 10 }}
        >
          Додати до кошика
        </button>
      )}
    </div>
  );
}
