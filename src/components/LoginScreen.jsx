// src/components/LoginScreen.jsx

import { useState } from "react";

export default function LoginScreen({ onLogin }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      // Usuário fixo "casa" que loga automaticamente
      const user = { email: "casa@exemplo.com", name: "Casa" };
      
      // Simula algum delay para feedback de carregamento
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setMessage(`Bem-vindo, ${user.name}!`);
      
      // Chama a função externa que você pode usar para redirecionar ou abrir o app
      if (onLogin) onLogin(user);

    } catch (err) {
      setMessage("Ocorreu um erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) {
      return (
        <span className="flex items-center justify-center">
          <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
          Processando...
        </span>
      );
    }
    return "Entrar como Casa";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 to-indigo-800 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-block">
            <div className="w-32 h-32 rounded-full bg-white/30 backdrop-blur-lg p-2 shadow-2xl">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-7xl">home</span>
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mt-4">Bem-vindo!</h1>
          <p className="text-purple-200">Clique no botão para entrar automaticamente.</p>
        </div>
        <div className="bg-white/20 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-white/30">
          {message && <p className="bg-green-500/50 text-white font-semibold rounded-lg text-center text-sm py-2 px-3 mb-4">{message}</p>}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-white text-purple-700 font-bold text-lg py-3 px-4 rounded-xl shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-300 transition-all duration-300 ease-in-out hover:scale-105 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:scale-100"
          >
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
}
