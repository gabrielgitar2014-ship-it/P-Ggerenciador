// src/pages/AuthPage.jsx
// (Crie este novo arquivo)

import React, { useState } from 'react';
// Certifique-se de que o caminho para seu cliente supabase está correto
import { supabase } from '../supabaseClient'; 

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  /**
   * Tenta fazer o login (Sign In) com e-mail e senha.
   */
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
      // Se for sucesso, o 'ouvinte' no App.jsx vai detectar
      // a mudança de sessão e redirecionar automaticamente.
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Tenta criar uma nova conta (Sign Up) com e-mail e senha.
   * Lembre-se de desabilitar isso no painel do Supabase depois!
   */
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

  // Estilização simples (inline) para ser fácil de copiar e colar.
  // Sinta-se à vontade para trocar por classes CSS ou Tailwind.
  const styles = {
    container: { 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      padding: '20px',
      background: '#f4f4f4' // Um fundo leve
    },
    card: {
      padding: '30px', 
      maxWidth: '400px', 
      width: '100%',
      margin: '0 auto',
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    },
    form: { 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '15px' 
    },
    input: { 
      padding: '12px', 
      fontSize: '16px', 
      border: '1px solid #ccc', 
      borderRadius: '5px' 
    },
    button: { 
      padding: '12px', 
      fontSize: '16px', 
      cursor: 'pointer', 
      background: '#333', // Cor primária
      color: 'white', 
      border: 'none', 
      borderRadius: '5px' 
    },
    buttonSecondary: {
      background: '#6c757d' // Cor secundária
    },
    error: { 
      color: 'red', 
      marginTop: '10px',
      textAlign: 'center'
    },
    title: {
      textAlign: 'center',
      color: '#333',
      marginBottom: '5px'
    },
    subtitle: {
      textAlign: 'center',
      color: '#555',
      marginTop: '0',
      marginBottom: '25px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Bem-vindo</h1>
        <p style={styles.subtitle}>Acesse sua conta para continuar</p>
        
        <form onSubmit={handleLogin} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar (Login)'}
          </button>
          
          <button
            type="button" // 'type="button"' impede o envio do formulário
            onClick={handleSignUp}
            style={{...styles.button, ...styles.buttonSecondary}}
            disabled={loading}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar (Sign Up)'}
          </button>
        </form>
      </div>
    </div>
  );
}