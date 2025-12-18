import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Sparkles, CheckCircle, XCircle, RotateCcw, Trophy, AlertCircle } from 'lucide-react';
import { gameApi, SecretQuizAuthor, SecretQuizQuestion } from '../services/api';

// Données de fallback si aucune citation n'est configurée dans l'admin
const FALLBACK_AUTHORS: SecretQuizAuthor[] = [
  { id: 1, name: 'Albert Einstein', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Einstein_1921_by_F_Schmutzer_-_restoration.jpg/220px-Einstein_1921_by_F_Schmutzer_-_restoration.jpg' },
  { id: 2, name: 'Marie Curie', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Marie_Curie_c._1920s.jpg/220px-Marie_Curie_c._1920s.jpg' },
  { id: 3, name: 'Steve Jobs', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg/220px-Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg' },
  { id: 4, name: 'Nelson Mandela', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Nelson_Mandela_1994.jpg/220px-Nelson_Mandela_1994.jpg' },
  { id: 5, name: 'Mahatma Gandhi', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Mahatma-Gandhi%2C_studio%2C_1931.jpg/220px-Mahatma-Gandhi%2C_studio%2C_1931.jpg' },
];

const FALLBACK_QUESTIONS: SecretQuizQuestion[] = [
  { id: 1, quote: "L'imagination est plus importante que le savoir.", hint: "Un génie de la physique", correct_author_id: 1 },
  { id: 2, quote: "Dans la vie, rien n'est à craindre, tout est à comprendre.", hint: "Deux fois prix Nobel", correct_author_id: 2 },
  { id: 3, quote: "Stay hungry, stay foolish.", hint: "Fondateur d'une entreprise à la pomme", correct_author_id: 3 },
  { id: 4, quote: "L'éducation est l'arme la plus puissante pour changer le monde.", hint: "Icône de la liberté", correct_author_id: 4 },
  { id: 5, quote: "Soyez le changement que vous voulez voir dans le monde.", hint: "Leader de la non-violence", correct_author_id: 5 },
];

export default function SecretQuizPage() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isEntering, setIsEntering] = useState(true);

  // Récupérer les données du quiz depuis l'API
  const { data: quizData, isLoading, isError } = useQuery({
    queryKey: ['secret-quiz'],
    queryFn: () => gameApi.getSecretQuiz().then((res) => res.data),
    retry: 1,
  });

  // Utiliser les données de l'API ou les fallbacks
  const questions = quizData?.questions || FALLBACK_QUESTIONS;
  const authors = quizData?.authors || FALLBACK_AUTHORS;
  const useFallback = !quizData || quizData.questions.length === 0;

  useEffect(() => {
    // Animation d'entrée
    const timer = setTimeout(() => setIsEntering(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectAnswer = (authorId: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(authorId);
    const correct = authorId === questions[currentQuestion].correct_author_id;
    setIsCorrect(correct);
    
    if (correct) {
      setScore(prev => prev + 1);
    }
    
    setShowResult(true);
    
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
        setIsCorrect(null);
        setShowHint(false);
      } else {
        setGameComplete(true);
      }
    }, 2000);
  };

  const resetGame = () => {
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(null);
    setGameComplete(false);
    setShowHint(false);
  };

  const getScoreMessage = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage === 100) return "🏆 Parfait ! Vous êtes un véritable érudit !";
    if (percentage >= 80) return "🌟 Excellent ! Votre culture est impressionnante !";
    if (percentage >= 60) return "👏 Bien joué ! Vous connaissez vos classiques !";
    if (percentage >= 40) return "📚 Pas mal ! Un peu de lecture s'impose !";
    return "🎯 Continuez à explorer le monde des citations !";
  };

  // Écran de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-6xl"
        >
          🔮
        </motion.div>
      </div>
    );
  }

  // Animation d'entrée mystérieuse
  if (isEntering) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1.2, type: "spring", damping: 10 }}
          className="text-center"
        >
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="text-8xl mb-6"
          >
            🔮
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="font-display text-3xl gradient-text"
          >
            Vous avez découvert le secret...
          </motion.h1>
        </motion.div>
      </div>
    );
  }

  // Écran de fin de jeu
  if (gameComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center max-w-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="text-9xl mb-8"
          >
            {score === questions.length ? '🏆' : score >= questions.length * 0.7 ? '🌟' : score >= questions.length * 0.5 ? '👏' : '📚'}
          </motion.div>

          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 gradient-text">
            Quiz Terminé !
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-8 mb-8"
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <Trophy className="w-12 h-12 text-amber-400" />
              <span className="font-display text-5xl font-bold text-amber-400">
                {score} / {questions.length}
              </span>
            </div>
            <p className="text-xl text-dark-300">{getScoreMessage()}</p>
          </motion.div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetGame}
              className="btn-primary inline-flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Rejouer
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour à l'accueil
            </motion.button>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 text-dark-500 text-sm"
          >
            🤫 Cet easter egg restera notre petit secret...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const correctAuthor = authors.find(a => a.id === question.correct_author_id);

  return (
    <div className="min-h-screen flex flex-col px-4 py-8">
      {/* Background mystérieux */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-900/20 via-purple-900/10 to-amber-900/20" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-amber-400">
            <Sparkles className="w-5 h-5" />
            <span className="font-display font-semibold">Quiz Secret</span>
          </div>
          <div className="px-4 py-2 rounded-full bg-dark-800 text-dark-300">
            {currentQuestion + 1} / {questions.length}
          </div>
        </div>
        <div className="flex items-center gap-2 text-lg">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span className="font-bold">{score}</span>
        </div>
      </div>

      {/* Avertissement si utilisation des fallbacks */}
      {useFallback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-4xl mx-auto w-full mb-4"
        >
          <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg px-4 py-2 flex items-center gap-2 text-sm text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Mode démo - Configurez vos propres citations dans l'admin !</span>
          </div>
        </motion.div>
      )}

      {/* Barre de progression */}
      <div className="relative z-10 w-full max-w-4xl mx-auto mb-8">
        <div className="progress-bar">
          <motion.div
            className="progress-bar-fill"
            style={{ 
              background: 'linear-gradient(90deg, #f59e0b, #d946ef)',
              width: `${((currentQuestion) / questions.length) * 100}%`
            }}
            animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Citation */}
      <motion.div
        key={currentQuestion}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center mb-8"
      >
        <div className="card max-w-3xl mx-auto p-8 relative overflow-hidden">
          <div className="absolute top-4 left-4 text-6xl text-dark-700 opacity-50">"</div>
          <div className="absolute bottom-4 right-4 text-6xl text-dark-700 opacity-50 rotate-180">"</div>
          
          <p className="font-display text-2xl md:text-3xl italic text-white leading-relaxed px-8">
            {question.quote}
          </p>
          
          {showHint && question.hint && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-amber-400 text-sm"
            >
              💡 Indice : {question.hint}
            </motion.p>
          )}
          
          {!showHint && !showResult && question.hint && (
            <button
              onClick={() => setShowHint(true)}
              className="mt-4 text-dark-500 hover:text-amber-400 text-sm transition-colors"
            >
              Besoin d'un indice ?
            </button>
          )}
        </div>
      </motion.div>

      {/* Grille des auteurs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 max-w-6xl mx-auto w-full"
      >
        <p className="text-center text-dark-400 mb-6">
          Cliquez sur l'auteur de cette citation
        </p>
        
        <div className={`grid gap-4 ${
          authors.length <= 5 
            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5' 
            : authors.length <= 8 
            ? 'grid-cols-2 sm:grid-cols-4' 
            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
        }`}>
          <AnimatePresence>
            {authors.map((author, index) => {
              const isSelected = selectedAnswer === author.id;
              const isCorrectAnswer = author.id === question.correct_author_id;
              const showAsCorrect = showResult && isCorrectAnswer;
              const showAsWrong = showResult && isSelected && !isCorrectAnswer;

              return (
                <motion.button
                  key={author.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={selectedAnswer === null ? { scale: 1.05 } : {}}
                  whileTap={selectedAnswer === null ? { scale: 0.95 } : {}}
                  onClick={() => handleSelectAnswer(author.id)}
                  disabled={selectedAnswer !== null}
                  className={`relative group rounded-xl overflow-hidden transition-all duration-300 aspect-square ${
                    showAsCorrect
                      ? 'ring-4 ring-green-500 shadow-lg shadow-green-500/30'
                      : showAsWrong
                      ? 'ring-4 ring-red-500 shadow-lg shadow-red-500/30'
                      : selectedAnswer === null
                      ? 'hover:ring-2 hover:ring-amber-400/50'
                      : 'opacity-50'
                  }`}
                >
                  <img
                    src={author.image}
                    alt={author.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=random&size=200`;
                    }}
                  />
                  
                  {/* Overlay avec le nom */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center p-2 transition-opacity ${
                    selectedAnswer === null ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                  }`}>
                    <span className="text-white text-sm font-semibold text-center">
                      {author.name}
                    </span>
                  </div>

                  {/* Icône de résultat */}
                  {showAsCorrect && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center bg-green-500/30"
                    >
                      <CheckCircle className="w-12 h-12 text-green-400" />
                    </motion.div>
                  )}
                  {showAsWrong && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center bg-red-500/30"
                    >
                      <XCircle className="w-12 h-12 text-red-400" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Message de résultat */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <div className={`px-8 py-4 rounded-2xl font-semibold text-lg flex items-center gap-3 ${
              isCorrect 
                ? 'bg-green-500/90 text-white' 
                : 'bg-red-500/90 text-white'
            }`}>
              {isCorrect ? (
                <>
                  <CheckCircle className="w-6 h-6" />
                  Bravo ! C'était bien {correctAuthor?.name} !
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6" />
                  C'était {correctAuthor?.name} !
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
