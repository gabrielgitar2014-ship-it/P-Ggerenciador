// src/components/Chatbot.jsx

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient'; // Verifique se este caminho está correto
import { MessageCircle, Send, X, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Componente de bolha de mensagem individual
 */
const ChatBubble = ({ message }) => {
  const isUser = message.sender === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`flex items-start gap-2 max-w-xs ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Ícone */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-600' : 'bg-slate-600'}`}>
          {isUser ? (
            <User className="w-5 h-5 text-white" />
          ) : (
            <Bot className="w-5 h-5 text-white" />
          )}
        </div>
        
        {/* Bolha da Mensagem */}
        <div 
          className={`px-4 py-3 rounded-2xl ${
            isUser 
              ? 'bg-blue-600 text-white rounded-br-none' 
              : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none'
          } shadow-md`}
        >
          {/* O 'whitespace-pre-wrap' preserva as quebras de linha que a IA envia */}
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * O componente principal do Chatbot
 */
export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Olá! Eu sou o GenFinance, seu assistente financeiro. Como posso ajudar você hoje?'
    }
  ]);
  
  const chatHistoryRef = useRef(null);

  // Efeito para rolar para o final sempre que uma nova mensagem é adicionada
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  const handleToggleChat = () => {
    setIsOpen(prev => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userMessage = currentMessage.trim();
    if (!userMessage) return;

    setIsLoading(true);
    setCurrentMessage("");
    // Adiciona a mensagem do usuário ao histórico
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);

    try {
      // Chama a Edge Function 'hybrid-chatbot'
      const { data, error } = await supabase.functions.invoke('hybrid-chatbot', {
        body: { message: userMessage },
      });

      if (error) {
        throw new Error(`Erro do Supabase: ${error.message}`);
      }
      
      // Adiciona a resposta do bot ao histórico
      const botResponse = data?.response || "Desculpe, não consegui processar sua resposta.";
      setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);

    } catch (err) {
      console.error("Erro ao chamar a função do chatbot:", err);
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: `Houve um erro: ${err.message}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* --- Janela do Chat (Modal) --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 right-4 z-50 w-full max-w-md h-[600px] 
                       bg-slate-100 dark:bg-slate-800 
                       rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700
                       flex flex-col"
          >
            {/* Header da Janela */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Assistente GenFinance</h3>
              <button 
                onClick={handleToggleChat} 
                className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Histórico de Mensagens */}
            <div 
              ref={chatHistoryRef} 
              className="flex-1 p-4 space-y-4 overflow-y-auto"
            >
              {messages.map((msg, index) => (
                <ChatBubble key={index} message={msg} />
              ))}
              {isLoading && (
                <ChatBubble message={{ sender: 'bot', text: 'Pensando...' }} />
              )}
            </div>

            {/* Input de Mensagem */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Pergunte-me qualquer coisa..."
                  disabled={isLoading}
                  className="flex-1 p-3 border border-slate-300 dark:border-slate-600 rounded-lg 
                             bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 
                             focus:ring-2 focus:ring-blue-500 focus:outline-none
                             disabled:opacity-50"
                />
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                             disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Botão Flutuante (FAB) --- */}
      <button
        onClick={handleToggleChat}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 
                   bg-blue-600 text-white 
                   rounded-full shadow-lg 
                   flex items-center justify-center 
                   hover:bg-blue-700 transition-transform hover:scale-110"
        aria-label="Abrir chat"
      >
        <AnimatePresence>
          {isOpen ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <X className="w-8 h-8" />
            </motion.div>
          ) : (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <MessageCircle className="w-8 h-8" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </>
  );
}