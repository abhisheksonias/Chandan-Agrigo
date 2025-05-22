import React from 'react';
const InventoryContext = React.createContext(undefined);
export const InventoryProvider = ({ children }) => {
  return (
    <InventoryContext.Provider value={{}}>
      {children}
    </InventoryContext.Provider>
  );
};
export const useInventory = () => {};
