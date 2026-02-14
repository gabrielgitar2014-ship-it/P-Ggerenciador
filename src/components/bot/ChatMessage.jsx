// src/components/bot/ChatMessage.jsx
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

export default function ChatMessage({ author, text }) {
  const isBot = author === 'bot';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex my-3 ${isBot ? 'justify-start' : 'justify-end'}`}
    >
      <div
        className={`max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${
          isBot
            ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700'
            : 'bg-blue-600 text-white rounded-br-none'
        }`}
      >
        {isBot ? (
          <div className="markdown-content text-sm leading-relaxed">
            <ReactMarkdown
              components={{
                # Estilização das listas solicitadas no prompt do Gen
                ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                strong: ({ node, ...props }) => <span className="font-bold text-blue-500 dark:text-blue-400" {...props} />,
              }}
            >
              {text}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{text}</p>
        )}
      </div>
    </motion.div>
  );
}
