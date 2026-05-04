// src/pages/TelaDeEspera.jsx

export default function TelaDeEspera({ onLogout }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900 text-center p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Aguardando Aprovação</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          O seu registo foi concluído com sucesso. No entanto, um administrador precisa de aprovar a sua conta antes que possa aceder à aplicação.
        </p>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Você não receberá uma notificação. Por favor, verifique o acesso mais tarde ou contacte o administrador.
        </p>
        <button
          onClick={onLogout}
          className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:bg-indigo-700 transition"
        >
          Sair
        </button>
      </div>
    </div>
  );
}