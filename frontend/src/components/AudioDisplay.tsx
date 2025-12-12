import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, CheckCircle, XCircle, Volume2 } from 'lucide-react';

interface AudioDisplayProps {
  src: string;
  onAnswer: (choice: 'real' | 'ai') => void;
  disabled?: boolean;
  isCorrect?: boolean;
  isReal?: boolean;
  isSelected?: boolean;
}

export default function AudioDisplay({
  src,
  onAnswer,
  disabled = false,
  isCorrect,
  isReal,
  isSelected = false,
}: AudioDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * duration;
  };

  const getStatusClasses = () => {
    if (!isSelected) return '';
    if (isCorrect) return 'selected-correct glow-success';
    return 'selected-wrong glow-error';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card p-8 ${getStatusClasses()}`}
    >
      {/* Audio Player */}
      <div className="flex flex-col items-center gap-6 mb-8">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mb-4">
          <Volume2 className="w-16 h-16 text-primary-400" />
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          disabled={disabled}
          className="w-20 h-20 rounded-full bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all"
        >
          {isPlaying ? (
            <Pause className="w-10 h-10 text-white" />
          ) : (
            <Play className="w-10 h-10 text-white ml-1" />
          )}
        </button>

        {/* Progress Bar */}
        <div className="w-full max-w-md">
          <div
            onClick={handleProgressClick}
            className="w-full h-2 bg-dark-700 rounded-full cursor-pointer relative"
          >
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-dark-400 mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
      </div>

      {/* Answer Buttons */}
      {!isSelected && (
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAnswer('real')}
            disabled={disabled}
            className="px-8 py-4 rounded-xl font-semibold text-lg bg-green-500/20 hover:bg-green-500/30 border-2 border-green-500/50 text-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            RÉEL
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAnswer('ai')}
            disabled={disabled}
            className="px-8 py-4 rounded-xl font-semibold text-lg bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            IA
          </motion.button>
        </div>
      )}

      {/* Result Display */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          {isCorrect ? (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="w-16 h-16 text-green-400" />
              <div className="px-6 py-3 rounded-full bg-green-500/20 text-green-400 font-semibold text-lg">
                {isReal ? 'RÉEL' : 'IA'} - Correct !
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <XCircle className="w-16 h-16 text-red-400" />
              <div className="px-6 py-3 rounded-full bg-red-500/20 text-red-400 font-semibold text-lg">
                {isReal ? 'RÉEL' : 'IA'} - Incorrect
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

