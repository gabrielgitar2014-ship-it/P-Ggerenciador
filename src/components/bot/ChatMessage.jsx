// src/components/bot/ChatMessage.jsx

import { motion } from 'framer-motion';

export default function ChatMessage({ author, text }) {
  const isBot = author === 'bot';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex my-2 ${isBot ? 'justify-start' : 'justify-end'}`}
    >
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${
          isBot
            ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none'
            : 'bg-blue-600 text-white rounded-br-none'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{text}</p>
      </div>
    </motion.div>
  );
}