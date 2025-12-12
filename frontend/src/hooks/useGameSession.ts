import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameApi, MediaPair, AnswerResponse } from '../services/api';

interface GameState {
  sessionKey: string | null;
  pairs: MediaPair[];
  currentIndex: number;
  score: number;
  streak: number;
  maxStreak: number;
  isLoading: boolean;
  error: string | null;
}

export function useGameSession() {
  const navigate = useNavigate();
  const [state, setState] = useState<GameState>({
    sessionKey: null,
    pairs: [],
    currentIndex: 0,
    score: 0,
    streak: 0,
    maxStreak: 0,
    isLoading: false,
    error: null,
  });
  const startTimeRef = useRef<number>(Date.now());

  const startSession = useCallback(async (quizId?: number) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await gameApi.startSession(quizId);
      const { session_key, pairs } = response.data;

      // Store pairs in localStorage for persistence
      localStorage.setItem(`pairs_${session_key}`, JSON.stringify(pairs));

      setState({
        sessionKey: session_key,
        pairs,
        currentIndex: 0,
        score: 0,
        streak: 0,
        maxStreak: 0,
        isLoading: false,
        error: null,
      });

      startTimeRef.current = Date.now();
      navigate(`/game/${session_key}`);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Impossible de démarrer la session',
      }));
    }
  }, [navigate]);

  const submitAnswer = useCallback(
    async (choice: 'left' | 'right'): Promise<AnswerResponse | null> => {
      if (!state.sessionKey || !state.pairs[state.currentIndex]) {
        return null;
      }

      const responseTime = Date.now() - startTimeRef.current;
      const pair = state.pairs[state.currentIndex];

      try {
        const response = await gameApi.submitAnswer(
          state.sessionKey,
          pair.id,
          choice,
          responseTime
        );

        const result = response.data;

        setState((prev) => ({
          ...prev,
          score: result.total_score,
          streak: result.current_streak,
          maxStreak: Math.max(prev.maxStreak, result.current_streak),
        }));

        return result;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: 'Erreur lors de la soumission',
        }));
        return null;
      }
    },
    [state.sessionKey, state.pairs, state.currentIndex]
  );

  const nextQuestion = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentIndex: prev.currentIndex + 1,
    }));
    startTimeRef.current = Date.now();
  }, []);

  const loadSessionFromStorage = useCallback((sessionKey: string) => {
    const storedPairs = localStorage.getItem(`pairs_${sessionKey}`);
    if (storedPairs) {
      setState((prev) => ({
        ...prev,
        sessionKey,
        pairs: JSON.parse(storedPairs),
      }));
      return true;
    }
    return false;
  }, []);

  return {
    ...state,
    currentPair: state.pairs[state.currentIndex],
    totalPairs: state.pairs.length,
    isLastQuestion: state.currentIndex >= state.pairs.length - 1,
    startSession,
    submitAnswer,
    nextQuestion,
    loadSessionFromStorage,
  };
}

