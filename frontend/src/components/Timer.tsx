import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface TimerProps {
  duration: number; // in seconds
  onTimeUp: () => void;
}

export default function Timer({ duration, onTimeUp }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const getTimerClass = () => {
    if (timeLeft <= 5) return 'danger';
    if (timeLeft <= 10) return 'warning';
    return '';
  };

  const progress = (timeLeft / duration) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card px-6 py-4 flex items-center gap-4"
    >
      <Clock
        className={`w-6 h-6 ${
          timeLeft <= 5
            ? 'text-red-400'
            : timeLeft <= 10
            ? 'text-yellow-400'
            : 'text-accent-400'
        }`}
      />
      <div className="flex flex-col">
        <div className={`timer ${getTimerClass()}`}>{timeLeft}s</div>
        <div className="w-20 h-1.5 rounded-full bg-dark-700 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              timeLeft <= 5
                ? 'bg-red-500'
                : timeLeft <= 10
                ? 'bg-yellow-500'
                : 'bg-accent-500'
            }`}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

