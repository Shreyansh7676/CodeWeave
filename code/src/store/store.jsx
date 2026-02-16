import { createContext, useContext, useState, useCallback } from "react";

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [code, setCode] = useState("");

  const updateCode = useCallback((newCode) => {
    setCode(newCode);
  }, []);

  return (
    <StoreContext.Provider value={{ code, setCode, updateCode }}>
      {children}
    </StoreContext.Provider>
  );
}

const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}

export default useStore;