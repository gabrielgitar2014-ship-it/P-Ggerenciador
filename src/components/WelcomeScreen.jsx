// src/components/WelcomeScreen.jsx
import { useEffect, useState } from 'react';

export default function WelcomeScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2500); // a tela some após 2.5s
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900">
      <div className="text-center">
        <h1
          className="text-5xl md:text-7xl text-white font-extrabold tracking-tight drop-shadow-lg animate-fade-in-down"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Rendify
        </h1>

        <p
          className="text-white/90 text-lg md:text-xl mt-3 animate-fade-in-up"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Bem-vindo — organizando suas finanças...
        </p>
      </div>

      {/* Footer de autoria */}
      <div className="mt-10 text-white/70 text-sm md:text-base animate-fade-in-up">
        Feito por: Gabriel Ricco
      </div>
    </div>
  );
}
