import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';

interface MediaDisplayProps {
  src: string;
  type: 'image' | 'video';
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isCorrect?: boolean;
  isSelected?: boolean;
}

export default function MediaDisplay({
  src,
  type,
  label,
  onClick,
  disabled = false,
  isCorrect,
  isSelected = false,
}: MediaDisplayProps) {
  const getStatusClasses = () => {
    if (!isSelected) return '';
    if (isCorrect) return 'selected-correct glow-success';
    return 'selected-wrong glow-error';
  };

  return (
    <motion.div
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={`media-card aspect-[4/3] relative ${getStatusClasses()} ${
        disabled ? 'cursor-not-allowed' : ''
      }`}
      onClick={!disabled ? onClick : undefined}
    >
      {/* Label Badge */}
      <div className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-dark-900/80 backdrop-blur flex items-center justify-center font-display font-bold text-lg">
        {label}
      </div>

      {/* Media Content */}
      {type === 'image' ? (
        <img
          src={src}
          alt={`Option ${label}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <video
          src={src}
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
      )}

      {/* Hover Overlay */}
      {!disabled && !isSelected && (
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-primary-500/20 flex items-center justify-center"
        >
          <span className="px-6 py-3 rounded-xl bg-dark-900/80 backdrop-blur font-semibold">
            Sélectionner
          </span>
        </motion.div>
      )}

      {/* Result Overlay */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`absolute inset-0 flex items-center justify-center ${
            isCorrect ? 'bg-green-500/30' : 'bg-red-500/30'
          }`}
        >
          {isCorrect ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
            >
              <CheckCircle className="w-20 h-20 text-green-400" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
            >
              <XCircle className="w-20 h-20 text-red-400" />
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Real/AI Label after answer */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full font-semibold ${
            isCorrect
              ? 'bg-green-500/90 text-white'
              : 'bg-red-500/90 text-white'
          }`}
        >
          {isCorrect ? 'RÉEL' : 'IA'}
        </motion.div>
      )}
    </motion.div>
  );
}

