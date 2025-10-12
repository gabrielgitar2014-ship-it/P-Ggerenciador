export default function SearchBar({ searchTerm, setSearchTerm }) {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <span className="material-symbols-outlined text-gray-400">search</span>
      </div>
      <input
        type="text"
        placeholder="Pesquisar"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 pl-10 border border-red-300 rounded-full shadow-sm"
      />
    </div>
  );
}
