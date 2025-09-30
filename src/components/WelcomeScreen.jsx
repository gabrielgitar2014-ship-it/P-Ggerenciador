// src/components/WelcomeScreen.jsx
import { useEffect, useState, useRef } from 'react';

export default function WelcomeScreen() {
  const [visible, setVisible] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(error => {
        console.error("Erro ao tocar o áudio:", error);
      });
    }

    const timer = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
   <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
      <div className="text-center">
        <h1
          className="text-5xl md:text-7xl text-white font-extrabold tracking-tight animate-bounce [-webkit-box-reflect:below_-7px_linear_gradient(to_bottom,transparent_10%,rgba(255,255,255,0.2))]"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
         GenFinance
        </h1>
      </div>

      <audio ref={audioRef} src="/intro-sound-4-270301.mp3" preload="auto"></audio>
    </div>
  );
}
