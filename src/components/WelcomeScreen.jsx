// src/components/WelcomeScreen.jsx
import { useEffect, useState, useRef } from 'react';

export default function WelcomeScreen() {
  const [visible, setVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(error => {
        console.warn("A reprodução automática de áudio foi bloqueada pelo navegador.", error);
      });
    }

    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      const unmountTimer = setTimeout(() => {
        setVisible(false);
      }, 700);
      return () => clearTimeout(unmountTimer);
    }, 2500);

    return () => clearTimeout(exitTimer);
  }, []);

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black ${isExiting ? 'animate-project-forward' : ''}`}>
      
      {/* =================================================================== */}
      {/* CORREÇÃO APLICADA AQUI                                              */}
      {/* =================================================================== */}

      {/* 1. Este container externo faz a animação de REVELAÇÃO (da esquerda para a direita) */}
      <div className="animate-reveal-from-left">
        {/* 2. O H1 interno agora só precisa do efeito CINTILANTE e do REFLEXO */}
        <h1
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-shimmering-silver"
          style={{
            fontFamily: "'Poppins', sans-serif",
            WebkitBoxReflect: 'below -15px linear-gradient(to bottom, transparent 20%, rgba(255, 255, 255, 0.25))'
          }}
        >
          GenFinance
        </h1>
      </div>

      <audio ref={audioRef} src="/intro-sound-4-270301.mp3" preload="auto"></audio>
    </div>
  );
}
