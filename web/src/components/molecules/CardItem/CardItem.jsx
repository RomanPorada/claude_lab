import React from "react";
import "./CardItem.css";
import { Link } from "react-router-dom";

export default function CardItem({ item }) {
  return (
    <div className="card-item">
      <div className="card-body">
        <h3>{item.name}</h3>
        {item.type === "atom" ? (
          <p className="muted">{item.symbol} • маса {item.mass}</p>
        ) : (
          <p className="muted">{item.formula} • мол. маса {item.molarMass}</p>
        )}
        <Link to={`/item/${item.id}`} className="more">Дивитися більше</Link>
      </div>
    </div>
  );
}
