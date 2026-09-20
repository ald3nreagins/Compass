import { createContext, useContext, useState } from 'react';

export const FUNDS = [
  'Alumni Ventures',
  'Andreessen Horowitz',
  'Bpifrance',
  'Gaingels',
  'General Catalyst',
  'Google for Startups',
  'Plug and Play',
  'Techstars',
  'Y Combinator',
];

const FundContext = createContext(null);

export function FundProvider({ children }) {
  const [selectedFund, setSelectedFund] = useState('All funds');
  return (
    <FundContext.Provider value={{ selectedFund, setSelectedFund }}>
      {children}
    </FundContext.Provider>
  );
}

export function useFund() {
  const ctx = useContext(FundContext);
  if (!ctx) throw new Error('useFund must be used within a FundProvider');
  return ctx;
}