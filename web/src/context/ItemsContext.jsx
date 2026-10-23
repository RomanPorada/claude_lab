import React, { createContext, useContext, useState } from "react";
const ItemsContext = createContext();

export function ItemsProvider({ children }) {
  const initial = [
    // ATOMS
    {
      id: "atom-1",
      type: "atom",
      name: "Гідроген",
      symbol: "H",
      mass: 1.008,
      protons: 1,
      neutrons: 0,
      electrons: 1,
      atomType: "Неметал",
      stateVariant: "Стабільний"
    },
    {
      id: "atom-2",
      type: "atom",
      name: "Гелій",
      symbol: "He",
      mass: 4.0026,
      protons: 2,
      neutrons: 2,
      electrons: 2,
      atomType: "Інертний газ",
      stateVariant: "Стабільний"
    },
    {
      id: "atom-3",
      type: "atom",
      name: "Літій",
      symbol: "Li",
      mass: 6.94,
      protons: 3,
      neutrons: 4,
      electrons: 3,
      atomType: "Метал",
      stateVariant: "Йонний"
    },
    {
      id: "atom-4",
      type: "atom",
      name: "Бор",
      symbol: "B",
      mass: 10.81,
      protons: 5,
      neutrons: 6,
      electrons: 5,
      atomType: "Неметал",
      stateVariant: "Ізотоп"
    },
    {
      id: "atom-5",
      type: "atom",
      name: "Карбон",
      symbol: "C",
      mass: 12.011,
      protons: 6,
      neutrons: 6,
      electrons: 6,
      atomType: "Неметал",
      stateVariant: "Стабільний"
    },
    {
      id: "atom-6",
      type: "atom",
      name: "Нітроген",
      symbol: "N",
      mass: 14.007,
      protons: 7,
      neutrons: 7,
      electrons: 7,
      atomType: "Неметал",
      stateVariant: "Стабільний"
    },
    {
      id: "atom-7",
      type: "atom",
      name: "Оксиген",
      symbol: "O",
      mass: 15.999,
      protons: 8,
      neutrons: 8,
      electrons: 8,
      atomType: "Неметал",
      stateVariant: "Стабільний"
    },
    {
      id: "atom-8",
      type: "atom",
      name: "Флуор",
      symbol: "F",
      mass: 18.998,
      protons: 9,
      neutrons: 10,
      electrons: 9,
      atomType: "Галоген",
      stateVariant: "Радіоактивний"
    },
    {
      id: "atom-9",
      type: "atom",
      name: "Неон",
      symbol: "Ne",
      mass: 20.180,
      protons: 10,
      neutrons: 10,
      electrons: 10,
      atomType: "Інертний газ",
      stateVariant: "Стабільний"
    },
    {
      id: "atom-10",
      type: "atom",
      name: "Натрій",
      symbol: "Na",
      mass: 22.990,
      protons: 11,
      neutrons: 12,
      electrons: 11,
      atomType: "Метал",
      stateVariant: "Йонний"
    },

    // MOLECULES
    {
      id: "mol-1",
      type: "molecule",
      name: "Вода",
      formula: "H₂O",
      molarMass: 18.015,
      phase: "Рідина",
      variant: "Стабільна"
    },
    {
      id: "mol-2",
      type: "molecule",
      name: "Вуглекислий газ",
      formula: "CO₂",
      molarMass: 44.01,
      phase: "Газ",
      variant: "Стабільна"
    },
    {
      id: "mol-3",
      type: "molecule",
      name: "Метан",
      formula: "CH₄",
      molarMass: 16.04,
      phase: "Газ",
      variant: "Стабільна"
    },
    {
      id: "mol-4",
      type: "molecule",
      name: "Етанол",
      formula: "C₂H₅OH",
      molarMass: 46.07,
      phase: "Рідина",
      variant: "Стабільна"
    },
    {
      id: "mol-5",
      type: "molecule",
      name: "Сахароза",
      formula: "C₁₂H₂₂O₁₁",
      molarMass: 342.30,
      phase: "Тверда",
      variant: "Стабільна"
    },
    {
      id: "mol-6",
      type: "molecule",
      name: "Амiак",
      formula: "NH₃",
      molarMass: 17.03,
      phase: "Газ",
      variant: "Стабільна"
    },
    {
      id: "mol-7",
      type: "molecule",
      name: "Глюкоза",
      formula: "C₆H₁₂O₆",
      molarMass: 180.16,
      phase: "Тверда",
      variant: "Стабільна"
    },
    {
      id: "mol-8",
      type: "molecule",
      name: "Озон",
      formula: "O₃",
      molarMass: 48.00,
      phase: "Газ",
      variant: "Стабільна"
    },
    {
      id: "mol-9",
      type: "molecule",
      name: "Сірководень",
      formula: "H₂S",
      molarMass: 34.08,
      phase: "Газ",
      variant: "Стабільна"
    },
    {
      id: "mol-10",
      type: "molecule",
      name: "Азот",
      formula: "N₂",
      molarMass: 28.02,
      phase: "Газ",
      variant: "Стабільна"
    }
  ];

  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem("atom_mol_items_v1");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return initial;
  });

  React.useEffect(() => {
    try {
      localStorage.setItem("atom_mol_items_v1", JSON.stringify(items));
    } catch (e) {}
  }, [items]);

  return (
    <ItemsContext.Provider value={{ items, setItems }}>
      {children}
    </ItemsContext.Provider>
  );
}

export function useItems() {
  return useContext(ItemsContext);
}
