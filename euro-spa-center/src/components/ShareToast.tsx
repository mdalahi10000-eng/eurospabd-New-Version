import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export function ShareToast({ message, onClose }: ToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-full shadow-lg border border-gray-800 flex items-center gap-2 text-xs font-semibold backdrop-blur-md"
        >
          <CheckCircle2 className="w-4 h-4 text-blue-400" />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
