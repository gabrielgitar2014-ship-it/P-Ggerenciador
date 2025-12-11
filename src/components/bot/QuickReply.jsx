// src/components/bot/QuickReply.jsx

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};

export default function QuickReply({ options, onSelect }) {
  if (!options || options.length === 0) return null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-wrap justify-end gap-2 px-2 pb-2"
    >
      {options.map((option) => (
        <motion.div key={option} variants={itemVariants}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect(option)}
            className="bg-white/80 dark:bg-slate-800/80"
          >
            {option}
          </Button>
        </motion.div>
      ))}
    </motion.div>
  );
}