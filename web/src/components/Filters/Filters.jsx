import React from "react";
import "./Filters.css";

export default function Filters({
  kind,
  atomTypes,
  selectedAtomTypes,
  toggleAtomType,
  atomMassRange,
  setAtomMassRange,
  molPhases,
  selectedMolPhases,
  toggleMolPhase,
  molMassRange,
  setMolMassRange,
  onReset
}) {
  return (
    <aside className="filters">
      <div className="filters-head">
        <h4>Фільтри</h4>
        <button className="reset" onClick={onReset}>Скинути</button>
      </div>

      {kind === "atom" && (
        <>
          <div className="filter-block">
            <div className="filter-title">Тип атома</div>
            {atomTypes.map(t => (
              <label key={t} className="check">
                <input type="checkbox" checked={selectedAtomTypes.includes(t)} onChange={() => toggleAtomType(t)} />
                {t}
              </label>
            ))}
          </div>

          <div className="filter-block">
            <div className="filter-title">Маса (від — до)</div>
            <div className="range-row">
              <input type="number" value={atomMassRange[0]} onChange={e => setAtomMassRange([Number(e.target.value), atomMassRange[1]])} />
              <input type="number" value={atomMassRange[1]} onChange={e => setAtomMassRange([atomMassRange[0], Number(e.target.value)])} />
            </div>
          </div>
        </>
      )}

      {kind === "molecule" && (
        <>
          <div className="filter-block">
            <div className="filter-title">Агрегатний стан</div>
            {molPhases.map(ph => (
              <label key={ph} className="check">
                <input type="checkbox" checked={selectedMolPhases.includes(ph)} onChange={() => toggleMolPhase(ph)} />
                {ph}
              </label>
            ))}
          </div>

          <div className="filter-block">
            <div className="filter-title">Молярна маса (від — до)</div>
            <div className="range-row">
              <input type="number" value={molMassRange[0]} onChange={e => setMolMassRange([Number(e.target.value), molMassRange[1]])} />
              <input type="number" value={molMassRange[1]} onChange={e => setMolMassRange([molMassRange[0], Number(e.target.value)])} />
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
