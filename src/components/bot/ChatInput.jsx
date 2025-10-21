// src/components/bot/ChatInput.jsx

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// AQUI ESTÁ A CORREÇÃO: Adicionando 'export default'
export default function ChatInput({ onSendMessage, disabled }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(text.trim());
      setText('');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 p-2 bg-white/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700"
    >
      <Input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Digite sua resposta..."
        disabled={disabled}
        className="flex-1 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600"
      />
      <Button type="submit" size="icon" disabled={disabled}>
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}