import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Play, Zap, Trophy, Shuffle } from 'lucide-react';
import { gameApi } from '../services/api';

export default function HomePage() {
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<number | null>(null);

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['quizzes'],
    queryFn: () => gameApi.getQuizzes().then((res) => res.data),
  });

  const startGame = async (quizId?: number) => {
    setIsStarting(true);
    try {
      const response = await gameApi.startSession(quizId);
      navigate(`/game/${response.data.session_key}`);
    } catch (error) {
      console.error('Error starting game:', error);
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center max-w-4xl mx-auto"
      >
        {/* Logo / Title */}
        <motion.h1
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-display text-6xl md:text-8xl font-bold mb-6"
        >
          <span className="gradient-text">Real</span>
          <span className="text-dark-300"> vs </span>
          <span className="gradient-text">AI</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl md:text-2xl text-dark-300 mb-12"
        >
          Saurez-vous distinguer le réel de l'intelligence artificielle ?
        </motion.p>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <div className="card flex flex-col items-center p-6">
            <div className="w-14 h-14 rounded-full bg-primary-500/20 flex items-center justify-center mb-4">
              <Zap className="w-7 h-7 text-primary-400" />
            </div>
            <h3 className="font-display text-lg font-semibold mb-2">10 Défis</h3>
            <p className="text-dark-400 text-sm">Testez votre perception sur 10 paires d'images ou vidéos</p>
          </div>

          <div className="card flex flex-col items-center p-6">
            <div className="w-14 h-14 rounded-full bg-accent-500/20 flex items-center justify-center mb-4">
              <Trophy className="w-7 h-7 text-accent-400" />
            </div>
            <h3 className="font-display text-lg font-semibold mb-2">Streak Bonus</h3>
            <p className="text-dark-400 text-sm">Enchaînez les bonnes réponses pour des points bonus</p>
          </div>

          <div className="card flex flex-col items-center p-6">
            <div className="w-14 h-14 rounded-full bg-orange-500/20 flex items-center justify-center mb-4">
              <Trophy className="w-7 h-7 text-orange-400" />
            </div>
            <h3 className="font-display text-lg font-semibold mb-2">Classement</h3>
            <p className="text-dark-400 text-sm">Comparez votre score avec les autres joueurs</p>
          </div>
        </motion.div>

        {/* Quiz Selection */}
        {!isLoading && quizzes && quizzes.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <h3 className="font-display text-lg font-semibold mb-4 text-dark-300">
              Choisissez un quiz ou jouez en mode aléatoire
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setSelectedQuiz(null)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  selectedQuiz === null
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                }`}
              >
                <Shuffle className="w-4 h-4 inline mr-2" />
                Aléatoire
              </button>
              {quizzes.map((quiz) => (
                <button
                  key={quiz.id}
                  onClick={() => setSelectedQuiz(quiz.id)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    selectedQuiz === quiz.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                  }`}
                >
                  {quiz.name}
                  <span className="ml-2 text-xs opacity-70">({quiz.pairs_count})</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
        >
          <button
            onClick={() => startGame(selectedQuiz ?? undefined)}
            disabled={isStarting}
            className="btn-primary inline-flex items-center gap-3 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStarting ? (
              <>
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Chargement...
              </>
            ) : (
              <>
                <Play className="w-6 h-6" />
                Commencer
              </>
            )}
          </button>
        </motion.div>

        {/* Leaderboard link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <button
            onClick={() => navigate('/leaderboard')}
            className="text-dark-400 hover:text-primary-400 transition-colors"
          >
            <Trophy className="w-5 h-5 inline mr-2" />
            Voir le classement
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

