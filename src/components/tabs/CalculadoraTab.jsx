import React, { useState } from 'react';

// Componente da nova aba de Calculadora com design inspirado no iOS
export default function CalculadoraTab() {
  const [display, setDisplay] = useState('0');
  const [currentValue, setCurrentValue] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(true);

  // Lógica da calculadora com pequenas melhorias
  const handleDigitClick = (digit) => {
    if (waitingForOperand) {
      setDisplay(String(digit));
      setWaitingForOperand(false);
    } else {
      // Limita o número de dígitos no visor para evitar overflow
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
    // Formata o resultado para evitar casas decimais muito longas
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

  // Componente de botão com o estilo do iOS
  const Button = ({ onClick, children, className = '', span = 'col-span-1' }) => (
    <div className={span}>
        <button
          onClick={onClick}
          className={`w-full h-full flex items-center rounded-full text-3xl font-light focus:outline-none transition-colors duration-150 ease-in-out active:brightness-75 ${className}`}
        >
          {children}
        </button>
    </div>
  );

  // Função para ajustar o tamanho da fonte do visor dinamicamente
  const getDisplayFontSize = () => {
    const len = display.length;
    if (len > 15) return 'text-4xl';
    if (len > 9) return 'text-5xl';
    return 'text-7xl';
  };

  return (
    // Container principal com fundo preto
    <div className="bg-black p-4 rounded-lg shadow-lg max-w-xs mx-auto">
      {/* Visor da calculadora */}
      <div className="text-right p-4 mb-4 h-28 flex items-end justify-end">
        <p className={`${getDisplayFontSize()} font-light text-white break-all`}>{display}</p>
      </div>
      
      {/* Grid de botões com as cores do iOS */}
      <div className="grid grid-cols-4 gap-3">
        {/* Adicionado 'aspect-square justify-center' para os botões circulares */}
        <Button onClick={handleClearClick} className="bg-gray-400 text-black aspect-square justify-center">AC</Button>
        <Button onClick={handlePlusMinusClick} className="bg-gray-400 text-black aspect-square justify-center">+/-</Button>
        <Button onClick={handlePercentClick} className="bg-gray-400 text-black aspect-square justify-center">%</Button>
        <Button onClick={() => handleOperatorClick('/')} className="bg-orange-500 text-white aspect-square justify-center">÷</Button>

        <Button onClick={() => handleDigitClick(7)} className="bg-gray-700 text-white aspect-square justify-center">7</Button>
        <Button onClick={() => handleDigitClick(8)} className="bg-gray-700 text-white aspect-square justify-center">8</Button>
        <Button onClick={() => handleDigitClick(9)} className="bg-gray-700 text-white aspect-square justify-center">9</Button>
        <Button onClick={() => handleOperatorClick('*')} className="bg-orange-500 text-white aspect-square justify-center">×</Button>

        <Button onClick={() => handleDigitClick(4)} className="bg-gray-700 text-white aspect-square justify-center">4</Button>
        <Button onClick={() => handleDigitClick(5)} className="bg-gray-700 text-white aspect-square justify-center">5</Button>
        <Button onClick={() => handleDigitClick(6)} className="bg-gray-700 text-white aspect-square justify-center">6</Button>
        <Button onClick={() => handleOperatorClick('-')} className="bg-orange-500 text-white aspect-square justify-center">−</Button>

        <Button onClick={() => handleDigitClick(1)} className="bg-gray-700 text-white aspect-square justify-center">1</Button>
        <Button onClick={() => handleDigitClick(2)} className="bg-gray-700 text-white aspect-square justify-center">2</Button>
        <Button onClick={() => handleDigitClick(3)} className="bg-gray-700 text-white aspect-square justify-center">3</Button>
        <Button onClick={() => handleOperatorClick('+')} className="bg-orange-500 text-white aspect-square justify-center">+</Button>

        {/* Botão zero com estilo de pílula e alinhamento à esquerda */}
        <Button onClick={() => handleDigitClick(0)} span="col-span-2" className="bg-gray-700 text-white justify-start pl-8">0</Button>
        <Button onClick={handleDecimalClick} className="bg-gray-700 text-white aspect-square justify-center">.</Button>
        <Button onClick={handleEqualsClick} className="bg-orange-500 text-white aspect-square justify-center">=</Button>
      </div>
    </div>
  );
}
