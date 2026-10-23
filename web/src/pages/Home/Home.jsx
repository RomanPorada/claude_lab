import React, { useState, useEffect } from "react";
import Filters from "../../components/Filters/Filters";
import CardItem from "../../components/molecules/CardItem/CardItem";
import Input from "../../components/atoms/Input/Input";
import Button from "../../components/atoms/Button/Button";
import Loader from "../../components/Loader/Loader";
import { fetchAtoms } from "../../api/atomsApi";
import { fetchMolecules } from "../../api/moleculesApi";
import "./Home.css";

export default function Home() {
  const [tab, setTab] = useState("atom");
  const [search, setSearch] = useState("");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedAtomTypes, setSelectedAtomTypes] = useState([]);
  const [atomMassRange, setAtomMassRange] = useState([0, 300]);
  const [selectedMolPhases, setSelectedMolPhases] = useState([]);
  const [molMassRange, setMolMassRange] = useState([0, 1000]);

  const [count, setCount] = useState(6);

  useEffect(() => {
    let cancelled = false;
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
          if (!cancelled) setItems(resp.data || []);
        } else {
          const params = {};
          if (selectedMolPhases.length) params.phases = selectedMolPhases.join(",");
          if (molMassRange?.[0]) params.molarMin = molMassRange[0];
          if (molMassRange?.[1]) params.molarMax = molMassRange[1];
          if (search) params.q = search;
          const resp = await fetchMolecules(params);
          if (!cancelled) setItems(resp.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [tab, search, selectedAtomTypes, atomMassRange, selectedMolPhases, molMassRange]);

  return (
    <div className="container home-page row">
      <div style={{ flex: "0 0 260px" }}>
        <Filters
          kind={tab}
          atomTypes={Array.from(new Set())}
          selectedAtomTypes={selectedAtomTypes}
          toggleAtomType={(t)=> setSelectedAtomTypes(s => s.includes(t) ? s.filter(x=>x!==t) : [...s,t])}
          atomMassRange={atomMassRange}
          setAtomMassRange={setAtomMassRange}
          molPhases={Array.from(new Set())}
          selectedMolPhases={selectedMolPhases}
          toggleMolPhase={(p)=> setSelectedMolPhases(s => s.includes(p) ? s.filter(x=>x!==p) : [...s,p])}
          molMassRange={molMassRange}
          setMolMassRange={setMolMassRange}
          onReset={()=>{ setSelectedAtomTypes([]); setAtomMassRange([0,300]); setSelectedMolPhases([]); setMolMassRange([0,1000]); setSearch("")}}
        />
      </div>

      <div style={{ flex: 1 }}>
        <div className="tabs">
          <button className={tab==="atom"?"tab active":"tab"} onClick={()=>setTab("atom")}>Атоми</button>
          <button className={tab==="molecule"?"tab active":"tab"} onClick={()=>setTab("molecule")}>Молекули</button>
        </div>

        <div style={{display:'flex',gap:12,marginTop:12,marginBottom:18}}>
          <Input placeholder={`Пошук у ${tab==="atom"?"атомах":"молекулах"}...`} value={search} onChange={e=>setSearch(e.target.value)} />
        </div>

        {loading ? <Loader /> : (
          <>
            <div className="grid">
              {items.slice(0, count).map(it => <CardItem key={it.id} item={it} />)}
            </div>
            {items.length > count && <div style={{textAlign:"center",marginTop:12}}><Button onClick={()=>setCount(c=>c+6)}>Показати ще</Button></div>}
          </>
        )}
      </div>
    </div>
  );
}
