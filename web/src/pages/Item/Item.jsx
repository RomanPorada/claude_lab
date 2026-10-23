import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../../redux/actions";
import { fetchAtomById } from "../../api/atomsApi";
import { fetchMoleculeById } from "../../api/moleculesApi";

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
    <div className="container" style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <h1>{item.name}</h1>

      {item.formula && <p>Формула: {item.formula}</p>}
      {item.mass && <p>Маса: {item.mass}</p>}
      {item.molarMass && <p>Молярна маса: {item.molarMass}</p>}

        </div>

        <aside style={{ width: 280 }}>
          <div style={{ border: "1px solid #e6e9ef", padding: 12, borderRadius: 8 }}>
            {itemType === "atom" && (
              <>
                <div style={{ marginBottom: 8 }}>
                  {item.protons != null && <div>Протони: {item.protons}</div>}
                  {item.neutrons != null && <div>Нейтрони: {item.neutrons}</div>}
                  {item.electrons != null && <div>Електрони: {item.electrons}</div>}
                </div>

                <select value={variant} onChange={(e) => setVariant(e.target.value)} style={{ width: "100%" }}>
                  <option value="">Оберіть варіант...</option>
                  {atomVariants.map((v) => (
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
            )}

            {itemType === "molecule" && (
              <>
                <div style={{ marginBottom: 8 }}>Фаза: {item.phase}</div>
                <button
                  onClick={() => dispatch(addToCart(item, item.variant || "Стандартний"))}
                  style={{ marginTop: 10, width: "100%" }}
                >
                  Додати в кошик
                </button>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
