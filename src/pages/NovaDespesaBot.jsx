// src/pages/NovaDespesaBot.jsx

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient'; // ✅ IMPORTAR O SUPABASE
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import ChatMessage from '../components/bot/ChatMessage';
import ChatInput from '../components/bot/ChatInput';
import QuickReply from '../components/bot/QuickReply';

export default function NovaDespesaBot({ onBack }) {
  const [messages, setMessages] = useState([
    { author: 'bot', text: 'Olá! 👋\nVamos registrar uma nova despesa.' },
    { author: 'bot', text: 'Primeiro, me diga: qual a descrição da compra?' }
  ]);
  
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]); // Estado para as respostas rápidas
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // Função para lidar com o envio de mensagens (texto ou clique em botão)
  const handleSendMessage = async (text) => {
    setQuickReplies([]); // Limpa as respostas rápidas ao enviar uma nova mensagem
    
    const newMessages = [...messages, { author: 'user', text }];
    setMessages(newMessages);
    setIsBotTyping(true);

    try {
      // ✅ AQUI ESTÁ A MUDANÇA: Invoca a Edge Function
      const { data, error } = await supabase.functions.invoke('expense-bot', {
        body: { conversationHistory: newMessages },
      });

      if (error) throw error;

      // Adiciona a resposta do bot e as novas respostas rápidas
      setMessages(prev => [...prev, { author: 'bot', text: data.reply }]);
      setQuickReplies(data.quickReplies || []);

    } catch (error) {
      console.error('Erro ao chamar a Edge Function:', error);
      setMessages(prev => [...prev, { author: 'bot', text: 'Desculpe, ocorreu um erro de comunicação. Tente novamente.' }]);
    } finally {
      setIsBotTyping(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full max-w-4xl mx-auto"
    >
      <header className="flex items-center gap-4 p-4 border-b border-slate-200 dark:border-slate-700">
        <Button onClick={onBack} variant="ghost" size="icon" aria-label="Voltar">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div>
          <h2 className="text-xl font-bold dark:text-white">Adicionar Despesa</h2>
          <p className="text-xs text-green-500 flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Online
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, index) => (
          <ChatMessage key={index} author={msg.author} text={msg.text} />
        ))}
        {isBotTyping && (
          <ChatMessage author="bot" text="Digitando..." />
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <footer>
        <QuickReply 
          options={quickReplies} 
          onSelect={handleSendMessage} 
        />
        <ChatInput onSendMessage={handleSendMessage} disabled={isBotTyping} />
      </footer>
    </motion.div>
  );
}