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
          // AQUI ESTÁ A MÁGICA DO MARKDOWN
          <div className="markdown-content text-sm leading-relaxed overflow-hidden">
            <ReactMarkdown
              components={{
                // Títulos (### no markdown)
                h1: ({ node, ...props }) => <h1 className="text-lg font-bold mt-2 mb-2" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-base font-bold mt-2 mb-2" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-sm font-bold mt-3 mb-1 uppercase text-slate-500" {...props} />,
                
                // Listas (- item no markdown)
                ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                
                // Parágrafos
                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                
                // Negrito (**texto**) - Colocamos em AZUL para destacar valores
                strong: ({ node, ...props }) => <span className="font-bold text-blue-600 dark:text-blue-400" {...props} />,
                
                // Links
                a: ({ node, ...props }) => <a className="text-blue-500 underline hover:text-blue-700" target="_blank" rel="noopener noreferrer" {...props} />,
              }}
            >
              {text}
            </ReactMarkdown>
          </div>
        ) : (
          // Mensagem do Usuário (Texto normal)
          <p className="text-sm whitespace-pre-wrap">{text}</p>
        )}
      </div>
    </motion.div>
  );
}
