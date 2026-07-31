import { createContext, useContext, useState } from 'react';

const STORAGE_KEY = 'cbs-mock:environment';

export const ENVIRONMENTS = [
  { value: 'DEV', label: 'Dev' },
  { value: 'QA', label: 'QA' },
];

const EnvironmentContext = createContext(null);

export function EnvironmentProvider({ children }) {
  const [environment, setEnvironment] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'DEV'
  );

  const updateEnvironment = (value) => {
    setEnvironment(value);
    localStorage.setItem(STORAGE_KEY, value);
  };

  return (
    <EnvironmentContext.Provider value={{ environment, setEnvironment: updateEnvironment }}>
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironment() {
  return useContext(EnvironmentContext);
}
