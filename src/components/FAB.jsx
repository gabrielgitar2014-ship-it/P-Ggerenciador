// src/components/FAB.jsx

export default function FAB({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-6 w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full shadow-xl shadow-purple-500/20 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-purple-400 dark:focus:ring-purple-500 transition-transform duration-200 ease-in-out hover:scale-110 active:scale-95 z-30"
      aria-label="Adicionar nova despesa"
      title="Adicionar nova despesa"
    >
      <span className="material-symbols-outlined text-3xl">add</span>
    </button>
  );
}