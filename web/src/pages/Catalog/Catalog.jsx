import React, { useState, useEffect } from "react";
import Filters from "../../components/Filters/Filters";
import CardItem from "../../components/molecules/CardItem/CardItem";
import Input from "../../components/atoms/Input/Input";
import { fetchAtoms } from "../../api/atomsApi";
import { fetchMolecules } from "../../api/moleculesApi";
import Loader from "../../components/Loader/Loader";
import "./Catalog.css";

export default function Catalog() {
  const [tab, setTab] = useState("atom");
  const [search, setSearch] = useState("");

  const [atomTypes, setAtomTypes] = useState([]);
  const [selectedAtomTypes, setSelectedAtomTypes] = useState([]);
  const [atomMassRange, setAtomMassRange] = useState([0, 300]);

  const [molPhases, setMolPhases] = useState([]);
  const [selectedMolPhases, setSelectedMolPhases] = useState([]);
  const [molMassRange, setMolMassRange] = useState([0, 1000]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadMeta() {
      try {
        setLoading(true);
        const atomsResp = await fetchAtoms();
        const molsResp = await fetchMolecules();
        const atomsList = atomsResp.data || [];
        const molsList = molsResp.data || [];
        setAtomTypes(Array.from(new Set(atomsList.map(a => a.atomType))).sort());
        setMolPhases(Array.from(new Set(molsList.map(m => m.phase))).sort());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadMeta();
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (tab === "atom") {
          const params = {};
          if (selectedAtomTypes.length) params.types = selectedAtomTypes.join(",");
          if (atomMassRange?.[0]) params.massMin = atomMassRange[0];
          if (atomMassRange?.[1]) params.massMax = atomMassRange[1];
          if (search) params.q = search;
          const resp = await fetchAtoms(params);
          setItems(resp.data || []);
        } else {
          const params = {};
          if (selectedMolPhases.length) params.phases = selectedMolPhases.join(",");
          if (molMassRange?.[0]) params.molarMin = molMassRange[0];
          if (molMassRange?.[1]) params.molarMax = molMassRange[1];
          if (search) params.q = search;
          const resp = await fetchMolecules(params);
          setItems(resp.data || []);
        }
      } catch (e) {
        console.error(e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [tab, search, selectedAtomTypes, atomMassRange, selectedMolPhases, molMassRange]);

  const toggleAtomType = t => {
    setSelectedAtomTypes(s => s.includes(t) ? s.filter(x => x !== t) : [...s, t]);
  };
  const toggleMolPhase = p => {
    setSelectedMolPhases(s => s.includes(p) ? s.filter(x => x !== p) : [...s, p]);
  };
  const resetAll = () => {
    setSelectedAtomTypes([]);
    setAtomMassRange([0, 300]);
    setSelectedMolPhases([]);
    setMolMassRange([0, 1000]);
    setSearch("");
  };

  return (
    <div className="container catalog-page row">
      <div style={{ flex: "0 0 280px" }}>
        <Filters
          kind={tab}
          atomTypes={atomTypes}
          selectedAtomTypes={selectedAtomTypes}
          toggleAtomType={toggleAtomType}
          atomMassRange={atomMassRange}
          setAtomMassRange={setAtomMassRange}
          molPhases={molPhases}
          selectedMolPhases={selectedMolPhases}
          toggleMolPhase={toggleMolPhase}
          molMassRange={molMassRange}
          setMolMassRange={setMolMassRange}
          onReset={resetAll}
        />
      </div>

      <div style={{ flex: 1 }}>
        <div className="tabs">
          <button className={tab === "atom" ? "tab active" : "tab"} onClick={() => setTab("atom")}>Атоми</button>
          <button className={tab === "molecule" ? "tab active" : "tab"} onClick={() => setTab("molecule")}>Молекули</button>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 12, marginBottom: 18 }}>
          <Input placeholder={`Пошук у ${tab === "atom" ? "атомах" : "молекулах"}...`} value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? <Loader /> : (
          <>
            <div className="grid">
              {items.map(it => <CardItem key={it.id} item={it} />)}
            </div>
            {items.length === 0 && <p>Нічого не знайдено.</p>}
          </>
        )}
      </div>
    </div>
  );
}
