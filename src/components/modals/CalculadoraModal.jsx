import React, { useState, useEffect } from 'react';

// Este é o modal da calculadora que abre por cima do formulário de despesa.
export default function CalculadoraModal({ isOpen, onClose, onConfirm }) {
  const [display, setDisplay] = useState('0');
  const [currentValue, setCurrentValue] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(true);

  // Reinicia a calculadora sempre que o modal é aberto
  useEffect(() => {
    if (isOpen) {
      setDisplay('0');
      setCurrentValue(null);
      setOperator(null);
      setWaitingForOperand(true);
    }
  }, [isOpen]);

  const handleDigitClick = (digit) => {
    if (waitingForOperand) {
      setDisplay(String(digit));
      setWaitingForOperand(false);
    } else {
      if (display.length >= 9) return;
      setDisplay(display === '0' ? String(digit) : display + digit);
    }
  };

  const handleDecimalClick = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const handleOperatorClick = (nextOperator) => {
    const inputValue = parseFloat(display);
    if (currentValue === null) {
      setCurrentValue(inputValue);
    } else if (operator) {
      const result = performCalculation();
      setCurrentValue(result);
      setDisplay(String(result));
    }
    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);
    const prevValue = currentValue;
    if (prevValue == null) return inputValue;
    let result;
    switch (operator) {
      case '+': result = prevValue + inputValue; break;
      case '-': result = prevValue - inputValue; break;
      case '*': result = prevValue * inputValue; break;
      case '/': result = prevValue / inputValue; break;
      default: return inputValue;
    }
    return parseFloat(result.toPrecision(15));
  };

  const handleEqualsClick = () => {
    if (!operator) return;
    const result = performCalculation();
    setDisplay(String(result));
    setCurrentValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const handleClearClick = () => {
    setDisplay('0');
    setCurrentValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const handlePlusMinusClick = () => {
    setDisplay(String(parseFloat(display) * -1));
  };

  const handlePercentClick = () => {
    setDisplay(String(parseFloat(display) / 100));
  };

  // Função para confirmar e enviar o valor para o formulário de despesa
  const handleConfirm = () => {
    onConfirm(parseFloat(display));
    onClose();
  };

  if (!isOpen) return null;

  const Button = ({ onClick, children, className = '', span = 'col-span-1' }) => (
    <div className={span}>
        <button
          onClick={onClick}
          className={`w-full h-full flex items-center justify-center aspect-square rounded-full text-3xl font-light focus:outline-none transition-colors duration-150 ease-in-out active:brightness-75 ${className}`}
        >
          {children}
        </button>
    </div>
  );
  
  const getDisplayFontSize = () => {
    const len = display.length;
    if (len > 15) return 'text-4xl';
    if (len > 9) return 'text-5xl';
    return 'text-7xl';
  };

  return (
    // O z-index z-[60] garante que este modal fique por cima do outro
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex justify-center items-center p-4">
      <div className="bg-black p-4 rounded-lg shadow-lg max-w-xs w-full animate-fade-in-down">
        <div className="text-right p-4 mb-4 h-28 flex items-end justify-end">
          <p className={`${getDisplayFontSize()} font-light text-white break-all`}>{display}</p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <Button onClick={handleClearClick} className="bg-gray-400 text-black">AC</Button>
          <Button onClick={handlePlusMinusClick} className="bg-gray-400 text-black">+/-</Button>
          <Button onClick={handlePercentClick} className="bg-gray-400 text-black">%</Button>
          <Button onClick={() => handleOperatorClick('/')} className="bg-orange-500 text-white">÷</Button>
          <Button onClick={() => handleDigitClick(7)} className="bg-gray-700 text-white">7</Button>
          <Button onClick={() => handleDigitClick(8)} className="bg-gray-700 text-white">8</Button>
          <Button onClick={() => handleDigitClick(9)} className="bg-gray-700 text-white">9</Button>
          <Button onClick={() => handleOperatorClick('*')} className="bg-orange-500 text-white">×</Button>
          <Button onClick={() => handleDigitClick(4)} className="bg-gray-700 text-white">4</Button>
          <Button onClick={() => handleDigitClick(5)} className="bg-gray-700 text-white">5</Button>
          <Button onClick={() => handleDigitClick(6)} className="bg-gray-700 text-white">6</Button>
          <Button onClick={() => handleOperatorClick('-')} className="bg-orange-500 text-white">−</Button>
          <Button onClick={() => handleDigitClick(1)} className="bg-gray-700 text-white">1</Button>
          <Button onClick={() => handleDigitClick(2)} className="bg-gray-700 text-white">2</Button>
          <Button onClick={() => handleDigitClick(3)} className="bg-gray-700 text-white">3</Button>
          <Button onClick={() => handleOperatorClick('+')} className="bg-orange-500 text-white">+</Button>
          
          {/* BOTÕES MODIFICADOS */}
          <Button onClick={() => handleDigitClick(0)} className="bg-gray-700 text-white">0</Button>
          <Button onClick={handleDecimalClick} className="bg-gray-700 text-white">.</Button>
          <Button onClick={handleEqualsClick} span="col-span-2" className="bg-orange-500 text-white">=</Button>
        </div>
        <div className="mt-4 flex justify-between gap-3">
            <button onClick={onClose} className="w-full bg-gray-500 text-white font-bold py-3 px-4 rounded-full">Cancelar</button>
            <button onClick={handleConfirm} className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-full">Confirmar Valor</button>
        </div>
      </div>
    </div>
  );
}