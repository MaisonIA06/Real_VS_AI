import axios from 'axios';

// Utiliser une URL relative pour que l'API fonctionne depuis n'importe quel appareil
// (tablettes, téléphones, etc. sur le réseau local)
const getApiUrl = () => {
  // Si une URL est définie explicitement et n'est pas localhost, l'utiliser
  if (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost')) {
    return import.meta.env.VITE_API_URL;
  }
  
  // En production ou via Nginx, une URL relative est préférable
  // car le frontend et l'API sont sur le même hôte/port
  return '/api';
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Note: withCredentials désactivé car non nécessaire pour ce jeu
  // et peut causer des problèmes CORS sur les navigateurs mobiles (Safari/Chrome iOS)
  withCredentials: false,
});

// Types
export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface MediaPair {
  id: number;
  category: Category;
  media_type: 'image' | 'video' | 'audio';
  difficulty: 'easy' | 'medium' | 'hard';
  left_media?: string;
  right_media?: string;
  audio_media?: string;
  real_position?: 'left' | 'right' | 'real' | 'ai';
  is_real?: boolean;
}

export interface GameSession {
  session_key: string;
  quiz_name: string;
  pairs: MediaPair[];
  total_pairs: number;
}

export interface AnswerResponse {
  is_correct: boolean;
  hint: string;
  ai_position: 'left' | 'right' | 'real' | 'ai';
  points_earned: number;
  current_streak: number;
  total_score: number;
  global_stats: {
    total_attempts: number;
    success_rate: number;
  };
  is_session_complete: boolean;
}

export interface GameResult {
  session_key: string;
  quiz_name: string;
  pseudo: string;
  score: number;
  streak_max: number;
  time_total_ms: number;
  is_completed: boolean;
  answers: {
    order: number;
    is_correct: boolean;
    response_time_ms: number;
    points_earned: number;
  }[];
}

export interface LeaderboardEntry {
  id: number;
  pseudo: string;
  score: number;
  streak_max: number;
  time_total_ms: number;
  quiz_name: string;
  created_at: string;
}

// Game API
export const gameApi = {
  getQuizzes: () => api.get<Quiz[]>('/game/quizzes/'),

  startSession: (quizId?: number, audienceType: 'school' | 'public' = 'public') =>
    api.post<GameSession>('/game/sessions/', { quiz_id: quizId, audience_type: audienceType }),

  submitAnswer: (sessionKey: string, pairId: number, choice: 'left' | 'right' | 'real' | 'ai', responseTimeMs: number) =>
    api.post<AnswerResponse>(`/game/sessions/${sessionKey}/answer/`, {
      pair_id: pairId,
      choice,
      response_time_ms: responseTimeMs,
    }),

  getResult: (sessionKey: string) =>
    api.get<GameResult>(`/game/sessions/${sessionKey}/result/`),

  submitPseudo: (sessionKey: string, pseudo: string) =>
    api.post(`/game/sessions/${sessionKey}/result/`, { pseudo }),

  getLeaderboard: (quizId?: number, limit = 10) =>
    api.get<LeaderboardEntry[]>('/game/leaderboard/', {
      params: { quiz_id: quizId, limit },
    }),

  // Secret Quiz (Easter Egg)
  getSecretQuiz: () => api.get<SecretQuizData>('/game/secret-quiz/'),

  // Multiplayer / Live Mode
  createMultiplayerRoom: (quizId?: number) =>
    api.post<MultiplayerRoom>('/game/multiplayer/rooms/', { quiz_id: quizId }),

  getMultiplayerRoom: (roomCode: string) =>
    api.get<MultiplayerRoom>(`/game/multiplayer/rooms/${roomCode}/`),

  getLocalIP: () =>
    api.get<{ ip: string }>('/game/local-ip/'),
};

// Types for Multiplayer
export interface MultiplayerRoom {
  id: number;
  room_code: string;
  quiz?: Quiz;
  status: 'waiting' | 'playing' | 'showing_answer' | 'finished';
  created_at: string;
}

// Types for Secret Quiz
export interface SecretQuizAuthor {
  id: number;
  name: string;
  image: string;
}

export interface SecretQuizQuestion {
  id: number;
  quote: string;
  hint: string;
  correct_author_id: number;
}

export interface SecretQuizData {
  questions: SecretQuizQuestion[];
  authors: SecretQuizAuthor[];
  total_questions: number;
}

// Admin API
export interface MediaPairAdmin {
  id: number;
  category: number;
  category_name: string;
  real_media?: string;
  ai_media?: string;
  audio_media?: string;
  is_real?: boolean;
  media_type: string;
  difficulty: string;
  hint: string;
  is_active: boolean;
  stats: {
    total_attempts: number;
    correct_answers: number;
    success_rate: number;
  };
  created_at: string;
}

export interface AudienceStats {
  success_rate: number;
  total_sessions: number;
  total_answers: number;
  correct_answers: number;
}

export interface DashboardStats {
  total_categories: number;
  total_pairs: number;
  total_sessions: number;
  completed_sessions: number;
  school_stats: AudienceStats;
  public_stats: AudienceStats;
  recent_sessions: {
    id: number;
    session_key: string;
    pseudo: string;
    score: number;
    streak_max: number;
    audience_type: 'school' | 'public';
    created_at: string;
  }[];
}

export const adminApi = {
  // Categories
  getCategories: () => api.get<Category[]>('/admin/categories/'),
  createCategory: (data: Partial<Category>) => api.post<Category>('/admin/categories/', data),
  updateCategory: (id: number, data: Partial<Category>) => api.patch<Category>(`/admin/categories/${id}/`, data),
  deleteCategory: (id: number) => api.delete(`/admin/categories/${id}/`),

  // Media Pairs
  getMediaPairs: (params?: { category?: number; media_type?: string; difficulty?: string; is_active?: boolean }) =>
    api.get<MediaPairAdmin[]>('/admin/media-pairs/', { params }),
  createMediaPair: (formData: FormData) =>
    api.post<MediaPairAdmin>('/admin/media-pairs/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateMediaPair: (id: number, formData: FormData) =>
    api.patch<MediaPairAdmin>(`/admin/media-pairs/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteMediaPair: (id: number) => api.delete(`/admin/media-pairs/${id}/`),

  // Stats
  getStats: () => api.get<DashboardStats>('/admin/stats/'),

  // Sessions
  deleteSession: (sessionId: number) => api.delete(`/admin/sessions/${sessionId}/`),

  // Secret Quotes (Easter Egg)
  getSecretQuotes: (params?: { is_active?: boolean }) =>
    api.get<SecretQuoteAdmin[]>('/admin/secret-quotes/', { params }),
  createSecretQuote: (formData: FormData) =>
    api.post<SecretQuoteAdmin>('/admin/secret-quotes/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateSecretQuote: (id: number, formData: FormData) =>
    api.patch<SecretQuoteAdmin>(`/admin/secret-quotes/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteSecretQuote: (id: number) => api.delete(`/admin/secret-quotes/${id}/`),
};

// Types for Secret Quotes Admin
export interface SecretQuoteAdmin {
  id: number;
  quote: string;
  hint: string;
  author_name: string;
  author_image: string;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export default api;

