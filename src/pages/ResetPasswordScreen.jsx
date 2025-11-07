// src/pages/ResetPasswordScreen.jsx

import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (!password) {
      setError('Por favor, insira uma nova senha.');
      setLoading(false);
      return;
    }

    try {
      // Esta é a função do Supabase para atualizar a senha do utilizador
      // Ela usa o token da sessão que foi estabelecido pelo link do email.
      const { error: updateError } = await supabase.auth.updateUser({ password: password });
      
      if (updateError) throw updateError;
      
      setMessage('A sua senha foi redefinida com sucesso! Agora você já pode fazer login.');

    } catch (err) {
      setError(err.message || 'Não foi possível redefinir a sua senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 to-indigo-800 p-4">
      <div className="w-full max-w-sm bg-white/20 backdrop-blur-lg p-8 rounded-3xl shadow-2xl text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Crie a sua Nova Senha</h1>
        <p className="text-purple-200 mb-6">Insira a sua nova senha abaixo. Ela deve ter no mínimo 6 caracteres.</p>

        {!message ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="password"
              placeholder="Digite a nova senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/30 text-white placeholder-purple-200 border-2 border-transparent focus:border-purple-300 focus:ring-0 rounded-xl px-4 py-3 outline-none transition"
              required
              minLength="6"
            />
            {error && <p className="bg-red-500/50 text-white font-semibold rounded-lg text-sm py-2 px-3">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-purple-700 font-bold text-lg py-3 px-4 rounded-xl shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-300 transition-all duration-300 ease-in-out hover:scale-105 active:scale-95 disabled:bg-gray-300"
            >
              {loading ? 'A guardar...' : 'Guardar Nova Senha'}
            </button>
          </form>
        ) : (
          <div>
            <p className="bg-green-500/50 text-white font-semibold rounded-lg text-lg py-4 px-3 mb-4">{message}</p>
            {/* Opcional: Adicionar um botão para ir para o login */}
          </div>
        )}
      </div>
    </div>
  );
}