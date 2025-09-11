// src/components/WelcomeScreen.jsx

import { useEffect, useState } from 'react';

export default function WelcomeScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2500); // A tela sumirá após 2.5 segundos
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-green-600 to-indigo-700">
      <div className="text-center">
        <h1 
          className="text-5xl md:text-7xl text-white font-bold animate-fade-in-down"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Bem-vindo!
        </h1>
        <p 
          className="text-white/80 text-lg md:text-xl mt-4 animate-fade-in-up"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Organizando suas finanças...
        </p>
      </div>

      {/* Footer com autoria */}
      <div className="mt-10 text-white/70 text-sm md:text-base animate-fade-in-up">
        Feito por: Gabriel Ricco
      </div>
    </div>
  );
}
