import { createContext, useContext, useState } from 'react';

const FundContext = createContext(null);

export function FundProvider({ children }) {
  const [selectedFund, setSelectedFund] = useState('All funds');
  const [availableFunds, setAvailableFunds] = useState([]);

  return (
    <FundContext.Provider value={{ selectedFund, setSelectedFund, availableFunds, setAvailableFunds }}>
      {children}
    </FundContext.Provider>
  );
}

export function useFund() {
  const ctx = useContext(FundContext);
  if (!ctx) throw new Error('useFund must be used within a FundProvider');
  return ctx;
}