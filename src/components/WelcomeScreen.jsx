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
   <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
      <div className="text-center">
        <h1
  className="text-5xl md:text-7xl text-white font-extrabold tracking-tight animate-fade-in-down [-webkit-box-reflect:below_-7px_linear-gradient(to_bottom,transparent_10%,rgba(255,255,255,0.2))]"
  style={{ fontFamily: "'Poppins', sans-serif" }}
>
        
         GenFinance
        </h1>

      </div>
    </div>
  );
}



