// src/pages/AuthPage.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; 

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) throw error;
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });
      if (error) throw error;
      alert('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- STYLES & ASSETS ---
  
  // Injetamos CSS global para animações e placeholders que não funcionam bem via inline-styles
  const GlobalCss = () => (
    <style>{`
      @keyframes float {
        0% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(30px, -50px) scale(1.1); }
        66% { transform: translate(-20px, 20px) scale(0.9); }
        100% { transform: translate(0px, 0px) scale(1); }
      }
      
      .glass-input::placeholder {
        color: rgba(255, 255, 255, 0.6);
      }
      
      .glass-button:hover {
        background: rgba(255, 255, 255, 0.2) !important;
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.2);
      }
      
      .glass-button:active {
        transform: translateY(0);
      }
    `}</style>
  );

  const styles = {
    container: { 
      position: 'relative',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      width: '100vw',
      overflow: 'hidden',
      background: '#0f172a', // Fundo escuro base
      fontFamily: "'Inter', sans-serif",
    },
    // Bolhas de fundo para dar o efeito de cor através do vidro
    blob1: {
      position: 'absolute',
      top: '10%',
      left: '20%',
      width: '300px',
      height: '300px',
      background: 'linear-gradient(180deg, #ff00cc 0%, #333399 100%)',
      borderRadius: '50%',
      filter: 'blur(80px)',
      opacity: 0.6,
      animation: 'float 8s infinite ease-in-out'
    },
    blob2: {
      position: 'absolute',
      bottom: '15%',
      right: '20%',
      width: '250px',
      height: '250px',
      background: 'linear-gradient(180deg, #00c6ff 0%, #0072ff 100%)',
      borderRadius: '50%',
      filter: 'blur(80px)',
      opacity: 0.6,
      animation: 'float 10s infinite ease-in-out reverse'
    },
    // O Cartão de Vidro
    glassCard: {
      position: 'relative',
      padding: '40px', 
      maxWidth: '400px', 
      width: '90%',
      zIndex: 10,
      
      // O segredo do Glassmorphism:
      background: 'rgba(255, 255, 255, 0.05)', 
      backdropFilter: 'blur(15px)', 
      WebkitBackdropFilter: 'blur(15px)', // Safari
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      color: 'white'
    },
    header: {
      textAlign: 'center',
      marginBottom: '10px'
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '5px',
      background: 'linear-gradient(to right, #fff, #ccc)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    subtitle: {
      fontSize: '0.9rem',
      color: 'rgba(255,255,255,0.7)',
      margin: 0
    },
    form: { 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '15px' 
    },
    input: { 
      width: '100%',
      padding: '15px', 
      fontSize: '16px', 
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '10px',
      color: 'white',
      outline: 'none',
      transition: 'all 0.3s ease',
      boxSizing: 'border-box'
    },
    buttonPrimary: { 
      padding: '15px', 
      fontSize: '16px', 
      fontWeight: '600',
      cursor: 'pointer', 
      background: 'rgba(255, 255, 255, 0.15)', // Semi-transparente
      color: 'white', 
      border: '1px solid rgba(255, 255, 255, 0.2)', 
      borderRadius: '10px',
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(5px)'
    },
    buttonSecondary: {
      padding: '12px', 
      fontSize: '14px', 
      cursor: 'pointer', 
      background: 'transparent',
      color: 'rgba(255,255,255,0.6)', 
      border: 'none', 
      borderRadius: '10px',
      transition: 'color 0.3s ease'
    },
    error: { 
      background: 'rgba(255, 59, 48, 0.2)',
      border: '1px solid rgba(255, 59, 48, 0.3)',
      color: '#ff9999', 
      padding: '10px',
      borderRadius: '8px',
      textAlign: 'center',
      fontSize: '14px'
    },
    footerText: {
      textAlign: 'center',
      fontSize: '12px',
      color: 'rgba(255,255,255,0.3)',
      marginTop: '10px'
    }
  };

  return (
    <div style={styles.container}>
      <GlobalCss />
      
      {/* Elementos de Fundo (Blobs) */}
      <div style={styles.blob1}></div>
      <div style={styles.blob2}></div>

      {/* Cartão de Vidro */}
      <div style={styles.glassCard}>
        <div style={styles.header}>
          <h1 style={styles.title}>Bem-vindo</h1>
          <p style={styles.subtitle}>Entre nas suas credenciais</p>
        </div>
        
        <form onSubmit={handleLogin} style={styles.form}>
          <div>
            <input
              className="glass-input" // Classe para o placeholder (ver GlobalCss)
              style={styles.input}
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              onFocus={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
              onBlur={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
            />
          </div>
          <div>
            <input
              className="glass-input"
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              onFocus={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
              onBlur={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
            />
          </div>
          
          {error && <div style={styles.error}>{error}</div>}

          <button 
            type="submit" 
            className="glass-button" 
            style={styles.buttonPrimary} 
            disabled={loading}
          >
            {loading ? 'Processando...' : 'Entrar'}
          </button>
          
          <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px'}}>
             <span style={{color: 'rgba(255,255,255,0.4)', fontSize: '14px'}}>Não tem conta?</span>
             <button
              type="button"
              onClick={handleSignUp}
              style={{...styles.buttonSecondary, textDecoration: 'underline'}}
              disabled={loading}
              onMouseEnter={(e) => e.target.style.color = 'white'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.6)'}
            >
              Cadastrar
            </button>
          </div>
        </form>
        
        <div style={styles.footerText}>Protegido por Supabase Auth</div>
      </div>
    </div>
  );
}
