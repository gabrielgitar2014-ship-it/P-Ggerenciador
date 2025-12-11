import React, { createContext, useState, useContext, useEffect } from 'react';

const VisibilityContext = createContext();

export const VisibilityProvider = ({ children }) => {
  // O valor inicial é lido do localStorage, ou 'true' se não houver nada salvo.
  const [valuesVisible, setValuesVisible] = useState(() => {
    const savedState = localStorage.getItem('valuesVisible');
    return savedState !== null ? JSON.parse(savedState) : true;
  });

  // Efeito para salvar a escolha do usuário no localStorage sempre que ela mudar.
  useEffect(() => {
    localStorage.setItem('valuesVisible', JSON.stringify(valuesVisible));
  }, [valuesVisible]);

  const toggleValuesVisibility = () => {
    setValuesVisible(prev => !prev);
  };

  return (
    <VisibilityContext.Provider value={{ valuesVisible, toggleValuesVisibility }}>
      {children}
    </VisibilityContext.Provider>
  );
};

export const useVisibility = () => useContext(VisibilityContext);