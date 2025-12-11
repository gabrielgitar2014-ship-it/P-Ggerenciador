import { useState, useEffect } from "react";

export default function NewCompraModal({
  isOpen,
  onClose,
  onSave,
  compraToEdit,
  selectedMonth,
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [bank, setBank] = useState("Nubank");
  const [paymentMonth, setPaymentMonth] = useState("current");
  const [isParcelado, setIsParcelado] = useState(false);
  const [totalParcelas, setTotalParcelas] = useState("");
  const [valorTotalCompra, setValorTotalCompra] = useState("");

  useEffect(() => {
    if (isOpen) {
      const initialDate = selectedMonth
        ? `${selectedMonth}-01`
        : new Date().toISOString().split("T")[0];
      if (compraToEdit) {
        setDescription(compraToEdit.description);
        setAmount(compraToEdit.amount);
        setDate(compraToEdit.date);
        setBank(compraToEdit.bank);
        setPaymentMonth(compraToEdit.paymentMonth || "current");
        const isEditParcelado = !!compraToEdit.parcela;
        setIsParcelado(isEditParcelado);
        if (isEditParcelado) {
          setTotalParcelas(compraToEdit.parcela.totalParcelas);
          setValorTotalCompra(compraToEdit.parcela.valorTotalCompra);
        }
      } else {
        setDescription("");
        setAmount("");
        setDate(initialDate);
        setBank("Nubank");
        setPaymentMonth("current");
        setIsParcelado(false);
        setTotalParcelas("");
        setValorTotalCompra("");
      }
    }
  }, [compraToEdit, isOpen, selectedMonth]);

  const handleSave = () => {
    let finalAmount = parseFloat(amount);
    let parcelaInfo = null;
    if (isParcelado) {
      if (!valorTotalCompra || !totalParcelas || totalParcelas <= 0) {
        alert(
          "Para compras parceladas, preencha o valor total e o número de parcelas."
        );
        return;
      }
      finalAmount = parseFloat(valorTotalCompra) / parseInt(totalParcelas);
      parcelaInfo = {
        numeroDaParcela: compraToEdit
          ? compraToEdit.parcela.numeroDaParcela
          : 1,
        totalParcelas: parseInt(totalParcelas),
        valorTotalCompra: parseFloat(valorTotalCompra),
      };
    } else if (!amount) {
      alert("Por favor, preencha o valor da compra.");
      return;
    }

    const compraData = {
      description,
      amount: finalAmount,
      date,
      bank,
      paymentMonth,
      isFixed: false, // Compras nunca são fixas por padrão
      type: "expense",
      parcela: parcelaInfo,
    };
    onSave(compraData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">
          {compraToEdit ? "Editar Compra" : "Nova Compra"}
        </h2>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isParcelado"
              checked={isParcelado}
              onChange={(e) => setIsParcelado(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            <label
              htmlFor="isParcelado"
              className="ml-2 block text-sm font-bold"
            >
              É uma compra parcelada?
            </label>
          </div>
          {isParcelado ? (
            <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-md">
              <div>
                <label className="block text-sm font-medium">
                  Valor Total da Compra (R$)
                </label>
                <input
                  type="number"
                  value={valorTotalCompra}
                  onChange={(e) => setValorTotalCompra(e.target.value)}
                  className="mt-1 block w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Nº de Parcelas
                </label>
                <input
                  type="number"
                  value={totalParcelas}
                  onChange={(e) => setTotalParcelas(e.target.value)}
                  className="mt-1 block w-full p-2 border rounded-md"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium">
                Valor da Compra (R$)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 block w-full p-2 border rounded-md"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Data da Compra</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Banco / Método</label>
            <select
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="mt-1 block w-full p-2 border rounded-md"
            >
              <option>Nubank</option>
              <option>Itau</option>
              <option>Bradesco</option>
              <option>Pix</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Cobrança</label>
            <select
              value={paymentMonth}
              onChange={(e) => setPaymentMonth(e.target.value)}
              className="mt-1 block w-full p-2 border rounded-md"
            >
              <option value="current">Neste mês</option>
              <option value="next">Próximo mês (Fatura do Cartão)</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-gray-200 rounded-md"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="py-2 px-4 bg-blue-600 text-white rounded-md"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
