/**
 * Hook for managing live session persistence (anti-cheat/reconnection)
 * Saves session data to localStorage and handles automatic reconnection
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const STORAGE_KEY = 'realvsai_live_session';

export interface LiveSessionData {
  roomCode: string;
  pseudo: string;
  sessionToken: string;
  playerId: number | null;
  joinedAt: number;
  isActive: boolean;
}

interface UseLiveSessionOptions {
  /** Called when a valid session is restored */
  onSessionRestored?: (session: LiveSessionData) => void;
  /** Called when session is cleared */
  onSessionCleared?: () => void;
  /** Whether to block navigation to other pages */
  blockNavigation?: boolean;
  /** Allowed paths when navigation is blocked */
  allowedPaths?: string[];
}

interface UseLiveSessionReturn {
  /** Current session data */
  session: LiveSessionData | null;
  /** Whether we're checking for existing session */
  isLoading: boolean;
  /** Whether an active session exists */
  hasActiveSession: boolean;
  /** Save a new session */
  saveSession: (data: Omit<LiveSessionData, 'joinedAt' | 'isActive'>) => void;
  /** Clear the current session */
  clearSession: () => void;
  /** Update session data */
  updateSession: (updates: Partial<LiveSessionData>) => void;
  /** Mark session as inactive (game finished) */
  endSession: () => void;
}

/**
 * Reads session data from localStorage
 */
function readStoredSession(): LiveSessionData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const session = JSON.parse(stored) as LiveSessionData;
    
    // Check if session is still valid (less than 24 hours old)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - session.joinedAt > maxAge) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    
    return session;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/**
 * Writes session data to localStorage
 */
function writeStoredSession(session: LiveSessionData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save session to localStorage:', error);
  }
}

/**
 * Hook for managing live classroom session persistence
 */
export function useLiveSession(options: UseLiveSessionOptions = {}): UseLiveSessionReturn {
  const {
    onSessionRestored,
    onSessionCleared,
    blockNavigation = true,
    allowedPaths = ['/multiplayer/play', '/multiplayer/join'],
  } = options;

  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<LiveSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialCheckDone = useRef(false);
  const callbacksRef = useRef({ onSessionRestored, onSessionCleared });

  // Keep callbacks ref up to date
  useEffect(() => {
    callbacksRef.current = { onSessionRestored, onSessionCleared };
  }, [onSessionRestored, onSessionCleared]);

  // Initial session check on mount
  useEffect(() => {
    if (initialCheckDone.current) return;
    initialCheckDone.current = true;

    const stored = readStoredSession();
    
    if (stored && stored.isActive) {
      setSession(stored);
      callbacksRef.current.onSessionRestored?.(stored);
    }
    
    setIsLoading(false);
  }, []);

  // Block navigation when session is active
  useEffect(() => {
    if (!blockNavigation || !session?.isActive) return;

    const currentPath = location.pathname;
    const isAllowed = allowedPaths.some(path => currentPath.startsWith(path));

    if (!isAllowed) {
      // Redirect to the game page
      navigate(`/multiplayer/play/${session.roomCode}`, { replace: true });
    }
  }, [location.pathname, session, blockNavigation, allowedPaths, navigate]);

  // Handle browser back button
  useEffect(() => {
    if (!blockNavigation || !session?.isActive) return;

    const handlePopState = (e: PopStateEvent) => {
      const currentPath = window.location.pathname;
      const isAllowed = allowedPaths.some(path => currentPath.startsWith(path));

      if (!isAllowed) {
        e.preventDefault();
        // Push the game URL back onto the history stack
        window.history.pushState(null, '', `/multiplayer/play/${session.roomCode}`);
      }
    };

    // Push initial state to prevent going back
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [session, blockNavigation, allowedPaths]);

  // Handle beforeunload warning
  useEffect(() => {
    if (!session?.isActive) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Vous êtes en pleine partie. Êtes-vous sûr de vouloir quitter ?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [session?.isActive]);

  const saveSession = useCallback((data: Omit<LiveSessionData, 'joinedAt' | 'isActive'>) => {
    const newSession: LiveSessionData = {
      ...data,
      joinedAt: Date.now(),
      isActive: true,
    };
    
    writeStoredSession(newSession);
    setSession(newSession);
  }, []);

  const updateSession = useCallback((updates: Partial<LiveSessionData>) => {
    setSession(prev => {
      if (!prev) return null;
      
      const updated = { ...prev, ...updates };
      writeStoredSession(updated);
      return updated;
    });
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    callbacksRef.current.onSessionCleared?.();
  }, []);

  const endSession = useCallback(() => {
    setSession(prev => {
      if (!prev) return null;
      
      const ended = { ...prev, isActive: false };
      writeStoredSession(ended);
      return ended;
    });
  }, []);

  return {
    session,
    isLoading,
    hasActiveSession: session?.isActive ?? false,
    saveSession,
    clearSession,
    updateSession,
    endSession,
  };
}

/**
 * Hook to check if there's an active session and redirect accordingly
 * Use this on the home page or join page
 */
export function useSessionRedirect(): { 
  isChecking: boolean; 
  activeSession: LiveSessionData | null;
} {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [activeSession, setActiveSession] = useState<LiveSessionData | null>(null);

  useEffect(() => {
    const stored = readStoredSession();
    
    if (stored && stored.isActive) {
      setActiveSession(stored);
      // Redirect to the game
      navigate(`/multiplayer/play/${stored.roomCode}`, { 
        replace: true,
        state: { pseudo: stored.pseudo, restored: true }
      });
    }
    
    setIsChecking(false);
  }, [navigate]);

  return { isChecking, activeSession };
}

export default useLiveSession;

