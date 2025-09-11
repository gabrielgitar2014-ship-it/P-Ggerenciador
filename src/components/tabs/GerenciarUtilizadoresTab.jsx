import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

export default function GerenciarUtilizadoresTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  async function fetchUsers() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data, error: functionError } = await supabase.functions.invoke('listar-todos-utilizadores');
      if (functionError) throw functionError;
      if (data.error) throw new Error(data.error);
      
      // Filtra para não mostrar o próprio administrador na lista
      setUsers(data.users.filter(u => u.id !== user.id));
    } catch (err) {
      setError(`Erro ao carregar utilizadores: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (userId) => {
    if (!window.confirm("Tem a certeza que quer excluir este utilizador permanentemente? Esta ação não pode ser desfeita.")) {
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke('excluir-utilizador', {
        body: { userId }
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setMessage(data.message);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      setError(`Erro ao excluir utilizador: ${err.message}`);
    }
  };

  if (loading) return <p className="text-center dark:text-gray-200">A carregar utilizadores...</p>;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 dark:text-white">Gerir Utilizadores</h2>
      {error && <p className="bg-red-200 text-red-800 p-3 rounded-lg mb-4">{error}</p>}
      {message && <p className="bg-green-200 text-green-800 p-3 rounded-lg mb-4">{message}</p>}
      
      <ul className="space-y-4">
        {users.map(user => (
          <li key={user.id} className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <div className="text-sm">
              <p className="font-semibold dark:text-white">{user.email}</p>
              <p className="text-gray-500 dark:text-gray-400">ID: {user.id}</p>
              <p className="text-gray-500 dark:text-gray-400">Status: {user.app_metadata?.status || 'N/A'}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => handleDelete(user.id)}
                className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-red-600 transition"
              >
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}