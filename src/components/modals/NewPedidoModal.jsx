import { useState, useEffect } from "react"; // Importar useEffect

// Adicionamos a nova prop 'pedidoToEdit'
export default function NewPedidoModal({
  isOpen,
  onClose,
  onSave,
  pedidoToEdit,
}) {
  const [value, setValue] = useState("");
  const [justification, setJustification] = useState("");

  // Este hook vai observar a prop 'pedidoToEdit'.
  // Se ela existir, ele preenche o formulário. Senão, ele limpa.
  useEffect(() => {
    if (isOpen) {
      if (pedidoToEdit) {
        setValue(pedidoToEdit.value);
        setJustification(pedidoToEdit.justification);
      } else {
        setValue("");
        setJustification("");
      }
    }
  }, [pedidoToEdit, isOpen]);

  const handleSave = () => {
    if (!value || !justification) {
      alert("Por favor, preencha o valor e a justificativa.");
      return;
    }
    // A função onSave agora só precisa enviar os dados, sem se preocupar com o ID
    onSave({ value: parseFloat(value), justification });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        {/* O título do modal agora é dinâmico */}
        <h2 className="text-2xl font-bold mb-4">
          {pedidoToEdit ? "Editar Pedido" : "Novo Pedido de Compra"}
        </h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="value"
              className="block text-sm font-medium text-gray-700"
            >
              Valor (R$)
            </label>
            <input
              type="number"
              id="value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ex: 250.00"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label
              htmlFor="justification"
              className="block text-sm font-medium text-gray-700"
            >
              Justificativa
            </label>
            <textarea
              id="justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows="3"
              placeholder="Ex: Compra de um novo monitor"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            ></textarea>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
