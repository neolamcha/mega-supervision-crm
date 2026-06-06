import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import {
  getActiveVisit,
  getVisits,
  getRecentVisits,
  insertVisit,
  updateVisit,
  getUnsynchronizedVisits,
  markVisitsSynced,
} from '../services/database';
import type { Visit } from '../types';

interface VisitState {
  activeVisit: Visit | null;
  visits: Visit[];
  isTracking: boolean;
  isLoading: boolean;
  error: string | null;
}

type VisitAction =
  | { type: 'SET_ACTIVE_VISIT'; payload: Visit | null }
  | { type: 'SET_VISITS'; payload: Visit[] }
  | { type: 'SET_IS_TRACKING'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_VISIT'; payload: Visit }
  | { type: 'UPDATE_VISIT'; payload: Partial<Visit> & { id: string } }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: VisitState = {
  activeVisit: null,
  visits: [],
  isTracking: false,
  isLoading: false,
  error: null,
};

function visitReducer(state: VisitState, action: VisitAction): VisitState {
  switch (action.type) {
    case 'SET_ACTIVE_VISIT':
      return { ...state, activeVisit: action.payload };
    case 'SET_VISITS':
      return { ...state, visits: action.payload };
    case 'SET_IS_TRACKING':
      return { ...state, isTracking: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'ADD_VISIT':
      return { ...state, visits: [action.payload, ...state.visits], activeVisit: action.payload };
    case 'UPDATE_VISIT':
      return {
        ...state,
        visits: state.visits.map((v) =>
          v.id === action.payload.id ? { ...v, ...action.payload } : v,
        ),
        activeVisit:
          state.activeVisit?.id === action.payload.id
            ? { ...state.activeVisit, ...action.payload }
            : state.activeVisit,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

interface VisitContextType extends VisitState {
  loadActiveVisit: () => Promise<void>;
  loadVisits: (prospectId?: string) => Promise<void>;
  loadRecentVisits: (days?: number) => Promise<void>;
  startNewVisit: (visit: Visit) => Promise<void>;
  endVisit: (visitId: string, heureDepart: string, dureeSecondes: number) => Promise<void>;
  syncVisits: () => Promise<void>;
  clearError: () => void;
}

const VisitContext = createContext<VisitContextType | undefined>(undefined);

export function VisitProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(visitReducer, initialState);

  const loadActiveVisit = useCallback(async () => {
    try {
      const visit = await getActiveVisit();
      dispatch({ type: 'SET_ACTIVE_VISIT', payload: visit });
      dispatch({ type: 'SET_IS_TRACKING', payload: visit !== null });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  const loadVisits = useCallback(async (prospectId?: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const visits = await getVisits(prospectId);
      dispatch({ type: 'SET_VISITS', payload: visits });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loadRecentVisits = useCallback(async (days: number = 7) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const visits = await getRecentVisits(days);
      dispatch({ type: 'SET_VISITS', payload: visits });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const startNewVisit = useCallback(async (visit: Visit) => {
    try {
      await insertVisit(visit);
      dispatch({ type: 'ADD_VISIT', payload: visit });
      dispatch({ type: 'SET_IS_TRACKING', payload: true });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  const endVisit = useCallback(
    async (visitId: string, heureDepart: string, dureeSecondes: number) => {
      try {
        const updated = { id: visitId, heureDepart, dureeSecondes, estComplete: true, estSynchronise: false };
        await updateVisit(updated);
        dispatch({ type: 'UPDATE_VISIT', payload: updated });
        dispatch({ type: 'SET_ACTIVE_VISIT', payload: null });
        dispatch({ type: 'SET_IS_TRACKING', payload: false });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    },
    [],
  );

  const syncVisits = useCallback(async () => {
    try {
      const unsyncedVisits = await getUnsynchronizedVisits();
      if (unsyncedVisits.length > 0) {
        const ids = unsyncedVisits.map((v) => v.id);
        await markVisitsSynced(ids);
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      loadActiveVisit,
      loadVisits,
      loadRecentVisits,
      startNewVisit,
      endVisit,
      syncVisits,
      clearError,
    }),
    [
      state,
      loadActiveVisit,
      loadVisits,
      loadRecentVisits,
      startNewVisit,
      endVisit,
      syncVisits,
      clearError,
    ],
  );

  return <VisitContext.Provider value={value}>{children}</VisitContext.Provider>;
}

export function useVisit(): VisitContextType {
  const context = useContext(VisitContext);
  if (!context) {
    throw new Error('useVisit must be used within a VisitProvider');
  }
  return context;
}
